import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashCpf, hashPin } from "@/lib/auth";
import { getTenantContext, requireTenantCompanyMatch, requireTenantManagement, tenantError } from "@/lib/tenant";
import Papa from "papaparse"; // fix #11
import crypto from "crypto";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB — fix #20
const MAX_ROWS = 5000; // A-3: limite de linhas para evitar DoS por parsing
const ALLOWED_TYPES = ["text/csv", "application/vnd.ms-excel", "text/plain"];

// A-4: validação completa de CPF com dígitos verificadores (mod11)
function isValidCpf(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10 || d1 === 11) d1 = 0;
  if (d1 !== Number(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10 || d2 === 11) d2 = 0;
  return d2 === Number(cpf[10]);
}

interface CsvRow {
  cpf?: string;
  pin?: string;
  nome?: string;
  name?: string;
  email?: string;
  setor?: string;
  sector?: string;
  cargo?: string;
  jobTitle?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const ctx = await getTenantContext(req);
    requireTenantManagement(ctx);
    requireTenantCompanyMatch(ctx, companyId);

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });

    // fix #20 — validate file type and size
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Arquivo deve ser CSV" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Arquivo muito grande (máx 5 MB)" }, { status: 400 });
    }

    const text = await file.text();

    // fix #11 — use papaparse (handles quoted fields, different delimiters)
    const parsed = Papa.parse<CsvRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });

    if (parsed.data.length === 0) {
      return NextResponse.json({ error: "CSV vazio ou inválido" }, { status: 400 });
    }
    // A-3: limite de linhas para evitar DoS por parsing excessivo
    if (parsed.data.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `CSV excede o limite de ${MAX_ROWS} linhas por importação` },
        { status: 400 }
      );
    }

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    // fix #15 — pré-validar todas as linhas antes de qualquer DB operation
    type ValidRow = {
      cpfHash: string;
      pin: string;
      name: string | undefined;
      email: string | undefined;
      sector: string | undefined;
      jobTitle: string | undefined;
    };
    const validRows: ValidRow[] = [];

    for (const row of parsed.data) {
      const cpfRaw = (row.cpf ?? "").replace(/\D/g, "");
      // A-1: gerar PIN aleatório seguro quando não fornecido (evita PIN padrão hardcoded)
      const rawPin = (row.pin ?? "").replace(/\D/g, "");
      const pin = rawPin.length === 6 ? rawPin : String(crypto.randomInt(100000, 999999));
      const name = row.nome || row.name || "";
      const email = row.email || "";
      const sector = row.setor || row.sector || "";
      const jobTitle = row.cargo || row.jobTitle || "";

      // A-4: validação completa de CPF (tamanho + dígitos verificadores)
      if (!isValidCpf(cpfRaw)) { results.errors.push(`CPF inválido: "${row.cpf}"`); continue; }
      if (pin.length !== 6) { results.errors.push(`PIN inválido para CPF ${cpfRaw}`); continue; }

      validRows.push({
        cpfHash: hashCpf(cpfRaw),
        pin,
        name: name || undefined,
        email: email || undefined,
        sector: sector || undefined,
        jobTitle: jobTitle || undefined,
      });
    }

    // fix #15 — gerar todos os hashes em paralelo (evita N×100ms bcrypt sequenciais)
    const withHashes = await Promise.all(
      validRows.map(async (r) => ({ ...r, pinHash: await hashPin(r.pin) }))
    );

    // fix #15 — verificar duplicatas em batch e inserir via transação
    const existingHashes = new Set(
      (await prisma.user.findMany({
        where: { cpfHash: { in: withHashes.map((r) => r.cpfHash) } },
        select: { cpfHash: true },
      })).map((u) => u.cpfHash)
    );

    const toCreate = withHashes.filter((r) => {
      if (existingHashes.has(r.cpfHash)) { results.skipped++; return false; }
      return true;
    });

    if (toCreate.length > 0) {
      await prisma.$transaction(
        toCreate.map((r) =>
          prisma.user.create({
            data: {
              cpfHash: r.cpfHash,
              pin: r.pinHash,
              name: r.name,
              email: r.email,
              sector: r.sector,
              jobTitle: r.jobTitle,
              role: "EMPLOYEE",
              companyId,
            },
          })
        )
      );
      results.created = toCreate.length;
    }

    return NextResponse.json({ ok: true, total: parsed.data.length, ...results });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}
