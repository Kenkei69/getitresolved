import { Router, Response } from 'express';
import { prisma } from '../app';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { computeComplaintScores } from '../services/scoring';

const router = Router();

router.get('/dashboard', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { role, id, departmentId } = req.user;

    if (role === 'CITIZEN') {
      const [total, open, inProgress, resolved] = await Promise.all([
        prisma.complaint.count({ where: { citizenId: id } }),
        prisma.complaint.count({ where: { citizenId: id, status: { in: ['SUBMITTED', 'ASSIGNED'] } } }),
        prisma.complaint.count({ where: { citizenId: id, status: 'IN_PROGRESS' } }),
        prisma.complaint.count({ where: { citizenId: id, status: 'RESOLVED' } }),
      ]);

      res.json({
        success: true,
        data: {
          totalComplaints: total,
          openComplaints: open,
          inProgressComplaints: inProgress,
          resolvedComplaints: resolved,
          manualReviewRequired: 0,
          highPriorityCount: 0,
        },
      });
      return;
    }

    if (role === 'STAFF') {
      if (!departmentId) {
        res.json({
          success: true,
          data: {
            totalComplaints: 0,
            openComplaints: 0,
            inProgressComplaints: 0,
            resolvedComplaints: 0,
            manualReviewRequired: 0,
            highPriorityCount: 0,
          },
        });
        return;
      }

      const [total, assigned, inProgress, resolved] = await Promise.all([
        prisma.complaint.count({ where: { departmentId } }),
        prisma.complaint.count({ where: { departmentId, status: 'ASSIGNED' } }),
        prisma.complaint.count({ where: { departmentId, status: 'IN_PROGRESS' } }),
        prisma.complaint.count({ where: { departmentId, status: 'RESOLVED' } }),
      ]);

      res.json({
        success: true,
        data: {
          totalComplaints: total,
          openComplaints: assigned, // awaiting attention
          inProgressComplaints: inProgress,
          resolvedComplaints: resolved,
          manualReviewRequired: 0,
          highPriorityCount: 0,
        },
      });
      return;
    }

    // Role === ADMIN
    const [total, submitted, assigned, inProgress, resolved, reviewReq, allComplaints] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: 'SUBMITTED' } }),
      prisma.complaint.count({ where: { status: 'ASSIGNED' } }),
      prisma.complaint.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.complaint.count({ where: { status: 'RESOLVED' } }),
      prisma.complaint.count({ where: { reviewState: 'REQUIRED' } }),
      prisma.complaint.findMany({
        select: {
          id: true,
          createdAt: true,
          resolvedAt: true,
          priority: true,
          urgency: true,
          feasibility: true,
          overridePriority: true,
          overrideUrgency: true,
          overrideFeasibility: true,
          departmentId: true,
          status: true,
        },
      }),
    ]);

    // Count complaints with coreScore > 7.0
    let highPriorityCount = 0;
    for (const c of allComplaints) {
      const scores = computeComplaintScores({
        createdAt: c.createdAt,
        resolvedAt: c.resolvedAt,
        priority: c.priority,
        urgency: c.urgency,
        feasibility: c.feasibility,
        overridePriority: c.overridePriority,
        overrideUrgency: c.overrideUrgency,
        overrideFeasibility: c.overrideFeasibility,
      });
      if (scores.coreScore > 7.0) {
        highPriorityCount++;
      }
    }

    // Department breakdown
    const departments = await prisma.department.findMany({
      include: {
        complaints: {
          select: { id: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const departmentStats = departments.map((d) => ({
      departmentId: d.id,
      departmentName: d.name,
      total: d.complaints.length,
      inProgress: d.complaints.filter((c) => c.status === 'IN_PROGRESS').length,
      resolved: d.complaints.filter((c) => c.status === 'RESOLVED').length,
    }));

    res.json({
      success: true,
      data: {
        totalComplaints: total,
        openComplaints: submitted + assigned,
        inProgressComplaints: inProgress,
        resolvedComplaints: resolved,
        manualReviewRequired: reviewReq,
        highPriorityCount,
        departmentStats,
      },
    });
  } catch (err) {
    console.error('[Dashboard Stats Error]', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve dashboard statistics.' });
  }
});

export default router;
