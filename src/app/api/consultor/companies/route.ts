import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashCpf, hashPin } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit-log";
import {
  findSimilarCompany,
  formatCnpj,
  getSuggestedSlug,
  isValidCnpj,
  normalizeCnpj,
  slugify,
} from "@/lib/company-guardrails";
import { requireConsultant } from "@/lib/consultor-auth";
import { getConsultantCompanySummaries } from "@/lib/consultor-companies";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const payload = await requireConsultant(req);
    const companies = await getConsultantCompanySummaries(payload);

    return NextResponse.json({
      companies,
      viewer: { id: payload.sub, role: payload.role },
    });
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: err.message }, { status: err.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await requireConsultant(req);
    if (payload.role === "ANALYST") {
      return NextResponse.json({ error: "Analistas não podem cadastrar tenants" }, { status: 403 });
    }

    const body = await req.json();
    const companyName = String(body.name ?? "").trim();
    const cnpj = String(body.cnpj ?? "").trim() || null;
    const slugInput = String(body.slug ?? "").trim();
    const adminName = String(body.adminName ?? "").trim();
    const adminEmail = String(body.adminEmail ?? "").trim().toLowerCase() || null;
    const adminCpf = String(body.adminCpf ?? "").trim();
    const adminPin = String(body.adminPin ?? "").trim();
    const adminSector = String(body.adminSector ?? "").trim() || "Recursos Humanos";
    const adminJobTitle = String(body.adminJobTitle ?? "").trim() || "Administrador do tenant";
    const logoUrl = String(body.logoUrl ?? "").trim() || null;
    const createInitialAdmin =
      Boolean(adminName && adminCpf && adminPin);

    if (!companyName) {
      return NextResponse.json({ error: "Nome da empresa é obrigatório" }, { status: 400 });
    }

    if (!isValidCnpj(cnpj)) {
      return NextResponse.json({ error: "CNPJ inválido" }, { status: 400 });
    }

    const baseSlug = slugify(slugInput || companyName);
    if (!baseSlug) {
      return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
    }

    const existingCompanies = await prisma.company.findMany({
      select: { id: true, name: true, slug: true, cnpj: true },
    });

    const similarCompany = findSimilarCompany(existingCompanies, companyName);
    if (similarCompany) {
      return NextResponse.json(
        {
          error: `Já existe uma empresa muito parecida na base: ${similarCompany.company.name}. Revise antes de cadastrar outro tenant.`,
        },
        { status: 409 }
      );
    }

    const normalizedCnpj = normalizeCnpj(cnpj);
    if (normalizedCnpj) {
      const conflictingCnpj = existingCompanies.find(
        (company) => normalizeCnpj(company.cnpj) === normalizedCnpj
      );
      if (conflictingCnpj) {
        return NextResponse.json(
          { error: `Já existe um tenant com esse CNPJ: ${conflictingCnpj.name}.` },
          { status: 409 }
        );
      }
    }

    if (createInitialAdmin) {
      if (!adminName) {
        return NextResponse.json({ error: "Nome do admin inicial é obrigatório" }, { status: 400 });
      }
      if (adminCpf.replace(/\D/g, "").length !== 11) {
        return NextResponse.json({ error: "CPF do admin inicial deve ter 11 dígitos" }, { status: 400 });
      }
      if (!/^\d{6}$/.test(adminPin)) {
        return NextResponse.json({ error: "PIN do admin inicial deve ter 6 dígitos" }, { status: 400 });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingSlugs = existingCompanies.map((company) => company.slug);
      const finalSlug = slugInput
        ? getSuggestedSlug(baseSlug, existingSlugs)
        : getSuggestedSlug(baseSlug, existingSlugs);

      if (slugInput && finalSlug !== baseSlug) {
        throw new Error(`SLUG_CONFLICT:${finalSlug}`);
      }

      const company = await tx.company.create({
        data: {
          name: companyName,
          cnpj: formatCnpj(cnpj),
          slug: finalSlug,
          logoUrl,
        },
      });

      await tx.consultantCompany.upsert({
        where: {
          consultantId_companyId: {
            consultantId: payload.sub,
            companyId: company.id,
          },
        },
        update: { role: "ADMIN" },
        create: {
          consultantId: payload.sub,
          companyId: company.id,
          role: "ADMIN",
        },
      });

      const campaign = await tx.campaign.create({
        data: {
          title: `Avaliação NR-01 — ${companyName}`,
          description: "Campanha criada automaticamente no cadastro do tenant",
          status: "ACTIVE",
          slug: `avaliacao-${slugify(companyName)}-${Date.now()}`,
          startDate: new Date(),
          companyId: company.id,
        },
      });

      const admin = createInitialAdmin
        ? await tx.user.create({
            data: {
              name: adminName,
              email: adminEmail,
              cpfHash: hashCpf(adminCpf),
              pin: await hashPin(adminPin),
              role: "ADMIN",
              sector: adminSector,
              jobTitle: adminJobTitle,
              companyId: company.id,
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          })
        : null;

      await recordAuditLog(tx, {
        companyId: company.id,
        action: "TENANT_CREATED",
        entityType: "Company",
        entityId: company.id,
        performedBy: payload.sub,
        metadata: {
          companyName: company.name,
          slug: company.slug,
          hasInitialCampaign: true,
          hasInitialAdmin: Boolean(admin),
        },
      });

      return { company, campaign, admin, suggestedSlug: finalSlug };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.startsWith("SLUG_CONFLICT:")) {
      return NextResponse.json(
        {
          error: "Slug já está em uso. Use outro valor ou aceite a sugestão automática.",
          suggestedSlug: err.message.replace("SLUG_CONFLICT:", ""),
        },
        { status: 409 }
      );
    }
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Já existe empresa, e-mail ou CPF com esses dados." },
        { status: 409 }
      );
    }
    if (
      err instanceof Error &&
      ["UNAUTHORIZED", "FORBIDDEN", "FORBIDDEN_ROLE"].includes(err.message)
    ) {
      return NextResponse.json(
        { error: err.message },
        { status: err.message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
