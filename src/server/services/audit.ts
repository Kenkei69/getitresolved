import { PrismaClient, Prisma } from '@prisma/client';

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function logAuditEvent(
  db: DbClient,
  params: {
    complaintId?: string | null;
    actorId: string;
    action: string;
    details: Record<string, any>;
  }
) {
  try {
    return await db.auditEvent.create({
      data: {
        complaintId: params.complaintId || null,
        actorId: params.actorId,
        action: params.action,
        details: JSON.stringify(params.details),
      },
    });
  } catch (err) {
    console.error('[Audit Error] Failed to record audit event:', err);
  }
}

