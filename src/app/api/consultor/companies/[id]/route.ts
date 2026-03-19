import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit-log";
import {
  findSimilarCompany,
  formatCnpj,
  getSuggestedSlug,
  isValidCnpj,
  normalizeCnpj,
  slugify,
} from "@/lib/company-guardrails";
import {
  requireConsultant,
  requireConsultantCompanyAccess,
} from "@/lib/consultor-auth";
import { getConsultantCompanySummaries } from "@/lib/consultor-companies";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await requireConsultant(req);
    const { id } = await params;
    await requireConsultantCompanyAccess(req, id);

    const companies = await getConsultantCompanySummaries(payload);
    const company = companies.find((item) => item.id === id);

    if (!company) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ company, viewer: { id: payload.sub, role: payload.role } });
  } catch (err: unknown) {
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { payload } = await requireConsultantCompanyAccess(req, id, { manage: true });
    const body = await req.json();

    const company = await prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        cnpj: true,
        logoUrl: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });
    }

    const name = String(body.name ?? company.name).trim();
    const cnpj = String(body.cnpj ?? company.cnpj ?? "").trim();
    const slugInput = String(body.slug ?? company.slug).trim();
    const logoUrl = String(body.logoUrl ?? company.logoUrl ?? "").trim() || null;

    if (!name) {
      return NextResponse.json({ error: "Nome da empresa é obrigatório" }, { status: 400 });
    }
    if (!isValidCnpj(cnpj)) {
      return NextResponse.json({ error: "CNPJ inválido" }, { status: 400 });
    }

    const baseSlug = slugify(slugInput || name);
    if (!baseSlug) {
      return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
    }

    const allCompanies = await prisma.company.findMany({
      select: { id: true, name: true, slug: true, cnpj: true },
    });

    const similarCompany = findSimilarCompany(allCompanies, name, id);
    if (similarCompany) {
      return NextResponse.json(
        {
          error: `Já existe uma empresa muito parecida na base: ${similarCompany.company.name}. Revise antes de editar.`,
        },
        { status: 409 }
      );
    }

    const normalizedCnpj = normalizeCnpj(cnpj);
    if (normalizedCnpj) {
      const conflictingCnpj = allCompanies.find(
        (item) =>
          item.id !== id &&
          normalizeCnpj(item.cnpj) === normalizedCnpj
      );
      if (conflictingCnpj) {
        return NextResponse.json(
          { error: `Já existe um tenant com esse CNPJ: ${conflictingCnpj.name}.` },
          { status: 409 }
        );
      }
    }

    const existingSlugs = allCompanies
      .filter((item) => item.id !== id)
      .map((item) => item.slug);
    const suggestedSlug = getSuggestedSlug(baseSlug, existingSlugs);
    if (slugInput && suggestedSlug !== baseSlug) {
      return NextResponse.json(
        {
          error: "Slug já está em uso. Use outro valor ou aceite a sugestão.",
          suggestedSlug,
        },
        { status: 409 }
      );
    }

    const updated = await prisma.company.update({
      where: { id },
      data: {
        name,
        cnpj: formatCnpj(cnpj),
        slug: suggestedSlug,
        logoUrl,
      },
    });

    await recordAuditLog(prisma, {
      companyId: id,
      action: "TENANT_UPDATED",
      entityType: "Company",
      entityId: id,
      performedBy: payload.sub,
      metadata: {
        before: {
          name: company.name,
          cnpj: company.cnpj,
          slug: company.slug,
          logoUrl: company.logoUrl,
        },
        after: {
          name: updated.name,
          cnpj: updated.cnpj,
          slug: updated.slug,
          logoUrl: updated.logoUrl,
        },
      },
    });

    const companies = await getConsultantCompanySummaries(payload);
    const summary = companies.find((item) => item.id === id) ?? null;

    return NextResponse.json({
      company: updated,
      summary,
    });
  } catch (err: unknown) {
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
