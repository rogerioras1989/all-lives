import { Prisma, PrismaClient } from "@/generated/prisma/client";

type AuditWriter = PrismaClient | Prisma.TransactionClient;

type RecordAuditLogInput = {
  companyId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  performedBy: string;
  performedByType?: string;
  metadata?: Prisma.InputJsonValue;
};

export async function recordAuditLog(
  writer: AuditWriter,
  {
    companyId,
    action,
    entityType,
    entityId,
    performedBy,
    performedByType = "Consultant",
    metadata,
  }: RecordAuditLogInput
) {
  return writer.auditLog.create({
    data: {
      companyId,
      action,
      entityType,
      entityId: entityId ?? null,
      performedBy,
      performedByType,
      metadata,
    },
  });
}
