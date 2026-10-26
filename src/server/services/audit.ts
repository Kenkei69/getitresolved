import { PrismaClient } from '@prisma/client';

export async function logAuditEvent(
  prisma: PrismaClient,
  params: {
    complaintId?: string | null;
    actorId: string;
    action: string;
    details: Record<string, any>;
  }
) {
  try {
    return await prisma.auditEvent.create({
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
