import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashCpf, hashPin } from "@/lib/auth";
import { getTenantContext, tenantError } from "@/lib/tenant";
import Papa from "papaparse"; // fix #11

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB — fix #20
const ALLOWED_TYPES = ["text/csv", "application/vnd.ms-excel", "text/plain"];

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

    // Only admins or consultants linked to this company can import
    if (ctx.type === "user") {
      if (ctx.companyId !== companyId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (!["ADMIN", "HR", "SUPER_ADMIN"].includes(ctx.role)) {
        return NextResponse.json({ error: "Permissão insuficiente" }, { status: 403 });
      }
    }
    // consultant link already validated by getTenantContext

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

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const row of parsed.data) {
      const cpfRaw = (row.cpf ?? "").replace(/\D/g, "");
      const pin = (row.pin ?? "123456").replace(/\D/g, "");
      const name = row.nome || row.name || "";
      const email = row.email || "";
      const sector = row.setor || row.sector || "";
      const jobTitle = row.cargo || row.jobTitle || "";

      if (cpfRaw.length !== 11) { results.errors.push(`CPF inválido: "${row.cpf}"`); continue; }
      if (pin.length !== 6) { results.errors.push(`PIN inválido para CPF ${cpfRaw}`); continue; }

      const cpfHash = hashCpf(cpfRaw);
      const existing = await prisma.user.findUnique({ where: { cpfHash } });
      if (existing) { results.skipped++; continue; }

      const pinHash = await hashPin(pin);
      await prisma.user.create({
        data: {
          cpfHash, pin: pinHash,
          name: name || undefined,
          email: email || undefined,
          sector: sector || undefined,
          jobTitle: jobTitle || undefined,
          role: "EMPLOYEE",
          companyId,
        },
      });
      results.created++;
    }

    return NextResponse.json({ ok: true, total: parsed.data.length, ...results });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}
