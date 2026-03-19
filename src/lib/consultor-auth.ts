import type { NextRequest } from "next/server";
import type { AccessTokenPayload } from "@/lib/auth";
import { requireAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

export async function requireConsultant(req: NextRequest): Promise<AccessTokenPayload> {
  const payload = requireAuth(req);
  if (payload.type !== "consultant") {
    throw new Error("FORBIDDEN");
  }
  return payload;
}

export async function requireConsultantCompanyAccess(
  req: NextRequest,
  companyId: string,
  options?: { manage?: boolean }
) {
  const payload = await requireConsultant(req);
  const manage = options?.manage ?? false;

  if (payload.role === "OWNER") {
    return { payload, tenantRole: "OWNER" };
  }

  const link = await prisma.consultantCompany.findUnique({
    where: {
      consultantId_companyId: {
        consultantId: payload.sub,
        companyId,
      },
    },
  });

  if (!link) {
    throw new Error("FORBIDDEN");
  }

  if (manage && (payload.role === "ANALYST" || link.role !== "ADMIN")) {
    throw new Error("FORBIDDEN_ROLE");
  }

  return { payload, tenantRole: link.role };
}
