import { Router, Response } from 'express';
import { prisma } from '../app';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { StaffDepartmentAssignSchema } from '../../shared/schemas';
import { logAuditEvent } from '../services/audit';

const router = Router();

// Protect all routes under /api/admin with requireRole('ADMIN')
router.use(authenticateToken, requireRole('ADMIN'));

// List all users
router.get('/users', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        departmentId: true,
        department: {
          select: { id: true, name: true, code: true },
        },
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve user list.' });
  }
});

// Assign staff to department
router.post('/staff/assign', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = StaffDepartmentAssignSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || 'Validation error' });
      return;
    }

    const { userId, departmentId } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    if (user.role !== 'STAFF') {
      res.status(400).json({ success: false, error: 'Department assignment is only applicable to STAFF accounts.' });
      return;
    }

    let deptName = 'Unassigned';
    if (departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!dept) {
        res.status(404).json({ success: false, error: 'Department not found.' });
        return;
      }
      deptName = dept.name;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { departmentId },
      include: { department: true },
    });

    if (req.user) {
      await logAuditEvent(prisma, {
        actorId: req.user.id,
        action: 'STAFF_DEPARTMENT_ASSIGN',
        details: {
          targetUserId: userId,
          targetUserName: user.name,
          departmentId,
          departmentName: deptName,
        },
      });
    }

    res.json({
      success: true,
      data: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        departmentId: updated.departmentId,
        department: updated.department,
        createdAt: updated.createdAt.toISOString(),
      },
      message: `Staff member assigned to ${deptName} successfully.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to assign staff department.' });
  }
});

// Audit events list
router.get('/audit-logs', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await prisma.auditEvent.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, name: true, role: true, email: true } },
        complaint: { select: { id: true, reference: true, title: true } },
      },
    });

    res.json({
      success: true,
      data: logs.map((log) => ({
        id: log.id,
        complaintId: log.complaintId,
        complaintReference: log.complaint?.reference,
        complaintTitle: log.complaint?.title,
        actorId: log.actorId,
        actorName: log.actor.name,
        actorRole: log.actor.role,
        action: log.action,
        details: (() => {
          try {
            return JSON.parse(log.details);
          } catch {
            return { raw: log.details };
          }
        })(),
        createdAt: log.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve audit logs.' });
  }
});

export default router;
