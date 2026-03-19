import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit-log";
import { requireConsultantCompanyAccess } from "@/lib/consultor-auth";

export const dynamic = "force-dynamic";

const ALLOWED_TENANT_ROLES = new Set(["ADMIN", "VIEWER"]);

async function buildLinks(companyId: string) {
  const links = await prisma.consultantCompany.findMany({
    where: { companyId },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    include: {
      consultant: {
        select: {
          id: true,
          name: true,
          email: true,
          globalRole: true,
          lastLoginAt: true,
        },
      },
    },
  });

  return links.map((link) => ({
    consultantId: link.consultantId,
    tenantRole: link.role,
    linkedAt: link.createdAt,
    consultant: link.consultant,
  }));
}

async function countTenantAdmins(companyId: string) {
  return prisma.consultantCompany.count({
    where: {
      companyId,
      role: "ADMIN",
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { payload, tenantRole } = await requireConsultantCompanyAccess(req, id);
    const links = await buildLinks(id);

    return NextResponse.json({
      links,
      viewer: {
        id: payload.sub,
        role: payload.role,
        tenantRole,
      },
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { payload } = await requireConsultantCompanyAccess(req, id, { manage: true });
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const role = String(body.role ?? "VIEWER").trim().toUpperCase();

    if (!email) {
      return NextResponse.json({ error: "E-mail do consultor é obrigatório" }, { status: 400 });
    }
    if (!ALLOWED_TENANT_ROLES.has(role)) {
      return NextResponse.json({ error: "Role inválida para o tenant" }, { status: 400 });
    }

    const consultant = await prisma.consultant.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (!consultant) {
      return NextResponse.json({ error: "Consultor não encontrado" }, { status: 404 });
    }

    const existing = await prisma.consultantCompany.findUnique({
      where: {
        consultantId_companyId: {
          consultantId: consultant.id,
          companyId: id,
        },
      },
    });

    await prisma.consultantCompany.upsert({
      where: {
        consultantId_companyId: {
          consultantId: consultant.id,
          companyId: id,
        },
      },
      update: { role },
      create: {
        consultantId: consultant.id,
        companyId: id,
        role,
      },
    });

    await recordAuditLog(prisma, {
      companyId: id,
      action: existing ? "CONSULTANT_LINK_UPDATED" : "CONSULTANT_LINK_CREATED",
      entityType: "ConsultantCompany",
      entityId: consultant.id,
      performedBy: payload.sub,
      metadata: {
        consultantEmail: consultant.email,
        consultantName: consultant.name,
        tenantRole: role,
      },
    });

    return NextResponse.json({ links: await buildLinks(id) });
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
    const consultantId = String(body.consultantId ?? "").trim();
    const role = String(body.role ?? "").trim().toUpperCase();

    if (!consultantId || !ALLOWED_TENANT_ROLES.has(role)) {
      return NextResponse.json({ error: "Dados inválidos para atualizar vínculo" }, { status: 400 });
    }

    const existing = await prisma.consultantCompany.findUnique({
      where: {
        consultantId_companyId: {
          consultantId,
          companyId: id,
        },
      },
      include: {
        consultant: {
          select: { email: true, name: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Vínculo não encontrado" }, { status: 404 });
    }

    if (existing.role === "ADMIN" && role !== "ADMIN") {
      const adminCount = await countTenantAdmins(id);
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "O tenant precisa manter pelo menos um vínculo All Lives com papel ADMIN." },
          { status: 409 }
        );
      }
    }

    await prisma.consultantCompany.update({
      where: {
        consultantId_companyId: {
          consultantId,
          companyId: id,
        },
      },
      data: { role },
    });

    await recordAuditLog(prisma, {
      companyId: id,
      action: "CONSULTANT_LINK_UPDATED",
      entityType: "ConsultantCompany",
      entityId: consultantId,
      performedBy: payload.sub,
      metadata: {
        consultantEmail: existing.consultant.email,
        consultantName: existing.consultant.name,
        beforeRole: existing.role,
        afterRole: role,
      },
    });

    return NextResponse.json({ links: await buildLinks(id) });
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { payload } = await requireConsultantCompanyAccess(req, id, { manage: true });
    const body = await req.json();
    const consultantId = String(body.consultantId ?? "").trim();

    if (!consultantId) {
      return NextResponse.json({ error: "Consultor obrigatório" }, { status: 400 });
    }

    const existing = await prisma.consultantCompany.findUnique({
      where: {
        consultantId_companyId: {
          consultantId,
          companyId: id,
        },
      },
      include: {
        consultant: {
          select: { email: true, name: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Vínculo não encontrado" }, { status: 404 });
    }

    if (existing.role === "ADMIN") {
      const adminCount = await countTenantAdmins(id);
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "O tenant precisa manter pelo menos um vínculo All Lives com papel ADMIN." },
          { status: 409 }
        );
      }
    }

    await prisma.consultantCompany.delete({
      where: {
        consultantId_companyId: {
          consultantId,
          companyId: id,
        },
      },
    });

    await recordAuditLog(prisma, {
      companyId: id,
      action: "CONSULTANT_LINK_REMOVED",
      entityType: "ConsultantCompany",
      entityId: consultantId,
      performedBy: payload.sub,
      metadata: {
        consultantEmail: existing.consultant.email,
        consultantName: existing.consultant.name,
        removedRole: existing.role,
      },
    });

    return NextResponse.json({ links: await buildLinks(id) });
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
