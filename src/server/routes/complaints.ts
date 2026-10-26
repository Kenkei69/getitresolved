import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../app';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { complaintUpload } from '../middleware/upload';
import {
  ComplaintCreateSchema,
  StatusUpdateSchema,
  ScoreOverrideSchema,
  ManualReviewDecisionSchema,
  FlagForReviewSchema,
  ComplaintFilterSchema,
} from '../../shared/schemas';
import { computeComplaintScores } from '../services/scoring';
import { classifyComplaint } from '../services/ai/classifier';
import { routeComplaint } from '../services/routing';
import { logAuditEvent } from '../services/audit';
import {
  saveAttachment,
  resolveAttachment,
  handleDirectBlobUpload,
  isBlobStorageConfigured,
  validatePreUploadedAttachment,
  markUploadGrantsUsed,
} from '../services/storage';
import { STATUS_TRANSITIONS } from '../../shared/constants';
import { ComplaintItem } from '../../shared/types';
import { rateLimiter } from '../services/rateLimit';

const router = Router();

const uploadAuthLimiter = rateLimiter({
  prefix: 'rl:upload:auth',
  maxPoints: 15,
  windowSeconds: 15 * 60, // 15 requests per 15 mins
  message: 'Upload authorization limit reached. Please wait a few minutes before uploading more photos.',
});

const complaintSubmitLimiter = rateLimiter({
  prefix: 'rl:complaint:submit',
  maxPoints: 10,
  windowSeconds: 15 * 60, // 10 complaints per 15 mins
  message: 'Complaint submission limit reached. Please wait a few minutes before submitting another report.',
  keyGenerator: (req) => (req as AuthRequest).user?.id || req.ip || 'unknown',
});

// Helper to format a complaint object for API responses
export function formatComplaint(c: any, currentUserRole?: string): ComplaintItem {
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

  // Filter status history for citizen visibility if needed
  const statusHistory = c.statusHistory
    ? c.statusHistory
        .filter((sh: any) => (currentUserRole === 'CITIZEN' ? sh.isCitizenVisible : true))
        .map((sh: any) => ({
          id: sh.id,
          fromStatus: sh.fromStatus,
          toStatus: sh.toStatus,
          note: sh.note,
          isCitizenVisible: sh.isCitizenVisible,
          changedById: sh.changedById,
          changedByName: sh.changedBy?.name || 'Staff Member',
          createdAt: sh.createdAt.toISOString(),
        }))
    : undefined;

  const attachments = c.attachments
    ? c.attachments.map((att: any) => ({
        id: att.id,
        originalFilename: att.originalFilename,
        mimeType: att.mimeType,
        fileSize: att.fileSize,
        createdAt: att.createdAt.toISOString(),
        url: `/api/complaints/${c.id}/attachments/${att.id}`,
      }))
    : undefined;

  const auditEvents = c.auditEvents && currentUserRole !== 'CITIZEN'
    ? c.auditEvents.map((ae: any) => ({
        id: ae.id,
        complaintId: ae.complaintId,
        actorId: ae.actorId,
        actorName: ae.actor?.name || 'System / Staff',
        action: ae.action,
        details: (() => {
          try {
            return JSON.parse(ae.details);
          } catch {
            return { raw: ae.details };
          }
        })(),
        createdAt: ae.createdAt.toISOString(),
      }))
    : undefined;

  return {
    id: c.id,
    reference: c.reference,
    title: c.title,
    description: c.description,
    address: c.address,
    serviceAreaId: c.serviceAreaId,
    serviceArea: c.serviceArea,
    categoryId: c.categoryId,
    category: c.category,
    departmentId: c.departmentId,
    department: c.department,
    citizenId: c.citizenId,
    citizenName: c.citizen?.name,
    firstNoticedDate: c.firstNoticedDate ? c.firstNoticedDate.toISOString() : null,
    status: c.status,
    analysisState: c.analysisState,
    reviewState: c.reviewState,
    analysisProvider: c.analysisProvider,
    analysisVersion: c.analysisVersion,
    classificationConfidence: c.classificationConfidence,
    aiRationale: c.aiRationale,
    scores,
    rawPriority: c.priority,
    rawUrgency: c.urgency,
    rawFeasibility: c.feasibility,
    overridePriority: c.overridePriority,
    overrideUrgency: c.overrideUrgency,
    overrideFeasibility: c.overrideFeasibility,
    overrideReason: c.overrideReason,
    overriddenById: c.overriddenById,
    overriddenByName: c.overriddenBy?.name,
    overriddenAt: c.overriddenAt ? c.overriddenAt.toISOString() : null,
    resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null,
    resolutionNote: c.resolutionNote,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    attachments,
    statusHistory,
    auditEvents,
  };
}

// Generate unique human-readable complaint reference: CR-2026-XXXX
async function generateComplaintReference(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.complaint.count();
  const num = (count + 1).toString().padStart(4, '0');
  const candidate = `CR-${year}-${num}`;
  const exists = await prisma.complaint.findUnique({ where: { reference: candidate } });
  if (exists) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `CR-${year}-${randomSuffix}`;
  }
  return candidate;
}

// DIRECT BLOB UPLOAD HANDLER FOR VERCEL
router.post('/upload-handler', authenticateToken, uploadAuthLimiter, (req: AuthRequest, res: Response) => {
  return handleDirectBlobUpload(req, res, prisma);
});

// SUBMIT COMPLAINT (CITIZEN or ADMIN)
router.post(
  '/',
  authenticateToken,
  complaintSubmitLimiter,
  complaintUpload.array('attachments', 3),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const parsed = ComplaintCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || 'Validation error' });
        return;
      }

      const { title, description, address, serviceAreaId, firstNoticedDate } = parsed.data;

      // Verify service area exists
      const serviceArea = await prisma.serviceArea.findUnique({ where: { id: serviceAreaId } });
      if (!serviceArea) {
        res.status(400).json({ success: false, error: 'Selected service area does not exist' });
        return;
      }

      const reference = await generateComplaintReference();
      const files = (req.files as Express.Multer.File[]) || [];

      // Support pre-uploaded attachments (direct blob uploads) OR multer file attachments
      let finalAttachments: {
        originalFilename: string;
        storageFilename: string;
        mimeType: string;
        fileSize: number;
      }[] = [];

      if (req.body.preUploadedAttachments) {
        try {
          const preUploaded =
            typeof req.body.preUploadedAttachments === 'string'
              ? JSON.parse(req.body.preUploadedAttachments)
              : req.body.preUploadedAttachments;

          if (Array.isArray(preUploaded)) {
            for (const item of preUploaded.slice(0, 3)) {
              const validation = await validatePreUploadedAttachment(item, req.user.id, prisma);
              if (!validation.valid) {
                res.status(400).json({
                  success: false,
                  error: `Attachment authorization failed: ${validation.error}`,
                });
                return;
              }
              finalAttachments.push({
                originalFilename: String(item.originalFilename || 'photo.jpg'),
                storageFilename: String(item.storageFilename),
                mimeType: String(item.mimeType || 'image/jpeg'),
                fileSize: Number(item.fileSize || 0),
              });
            }
          }
        } catch (e: any) {
          res.status(400).json({ success: false, error: 'Invalid attachments format: ' + e.message });
          return;
        }
      }

      if (files.length > 0) {
        for (const file of files) {
          if (isBlobStorageConfigured()) {
            const buffer = await fs.promises.readFile(file.path);
            const saved = await saveAttachment(buffer, file.originalname, file.mimetype, req.user.id);
            finalAttachments.push({
              originalFilename: saved.originalFilename,
              storageFilename: saved.storageFilename,
              mimeType: saved.mimeType,
              fileSize: saved.fileSize,
            });
            fs.promises.unlink(file.path).catch(() => {});
          } else {
            // In production, reject local filesystem writes
            if (process.env.NODE_ENV === 'production') {
              res.status(500).json({
                success: false,
                error: 'Production storage misconfiguration: BLOB_READ_WRITE_TOKEN is required for uploads.',
              });
              return;
            }
            finalAttachments.push({
              originalFilename: file.originalname,
              storageFilename: file.filename,
              mimeType: file.mimetype,
              fileSize: file.size,
            });
          }
        }
      }

      // 1. Immediately persist complaint with analysisState: PENDING, status: SUBMITTED
      const complaint = await prisma.complaint.create({
        data: {
          reference,
          title,
          description,
          address,
          serviceAreaId,
          citizenId: req.user.id,
          firstNoticedDate: firstNoticedDate ? new Date(firstNoticedDate) : null,
          status: 'SUBMITTED',
          analysisState: 'PENDING',
          reviewState: 'NOT_REQUIRED',
          attachments: {
            create: finalAttachments,
          },
        },
      });

      await logAuditEvent(prisma, {
        complaintId: complaint.id,
        actorId: req.user.id,
        action: 'SUBMIT_COMPLAINT',
        details: { reference, title, serviceArea: serviceArea.name, filesCount: files.length },
      });

      // Mark any pre-uploaded attachment grants as used
      if (finalAttachments.length > 0) {
        await markUploadGrantsUsed(
          finalAttachments.map((a) => a.storageFilename),
          req.user.id,
          prisma
        );
      }

      // 2. Perform AI classification and scoring
      let analysisResult;
      try {
        await prisma.complaint.update({
          where: { id: complaint.id },
          data: { analysisState: 'PROCESSING' },
        });

        analysisResult = await classifyComplaint(title, description);

        // Find category by code
        const category = await prisma.category.findUnique({
          where: { code: analysisResult.categoryCode },
        });

        const categoryId = category ? category.id : null;

        // Perform deterministic routing
        const routingResult = await routeComplaint(prisma, categoryId, serviceAreaId);

        const shouldReview = analysisResult.needsReview || routingResult.requiresReview;
        const newStatus = routingResult.success && !shouldReview ? 'ASSIGNED' : 'SUBMITTED';

        const updated = await prisma.complaint.update({
          where: { id: complaint.id },
          data: {
            categoryId,
            departmentId: routingResult.departmentId,
            status: newStatus,
            analysisState: 'COMPLETED',
            reviewState: shouldReview ? 'REQUIRED' : 'NOT_REQUIRED',
            analysisProvider: analysisResult.provider,
            analysisVersion: analysisResult.version,
            classificationConfidence: analysisResult.confidence,
            aiRationale: analysisResult.rationale,
            priority: analysisResult.priority,
            urgency: analysisResult.urgency,
            feasibility: analysisResult.feasibility,
          },
          include: {
            serviceArea: true,
            category: true,
            department: true,
            attachments: true,
            citizen: { select: { id: true, name: true, email: true } },
          },
        });

        // Add initial status history
        await prisma.statusHistory.create({
          data: {
            complaintId: complaint.id,
            fromStatus: null,
            toStatus: newStatus,
            note: shouldReview
              ? 'Complaint registered and queued for administrative review.'
              : `Complaint classified as ${analysisResult.categoryName} and assigned to ${routingResult.departmentName}.`,
            isCitizenVisible: true,
            changedById: req.user.id,
          },
        });

        await logAuditEvent(prisma, {
          complaintId: complaint.id,
          actorId: req.user.id,
          action: 'CLASSIFY_AND_ROUTE',
          details: {
            category: analysisResult.categoryName,
            department: routingResult.departmentName,
            status: newStatus,
            needsReview: shouldReview,
            confidence: analysisResult.confidence,
            provider: analysisResult.provider,
          },
        });

        res.status(201).json({
          success: true,
          data: formatComplaint(updated, req.user.role),
          message: 'Complaint submitted and categorized successfully.',
        });
        return;
      } catch (err: any) {
        console.error('[Analysis Error during submission]', err);
        // Recoverable state: complaint is safely stored with analysisState: FAILED or PENDING
        const fallback = await prisma.complaint.update({
          where: { id: complaint.id },
          data: {
            analysisState: 'FAILED',
            reviewState: 'REQUIRED',
          },
          include: {
            serviceArea: true,
            category: true,
            department: true,
            attachments: true,
            citizen: { select: { id: true, name: true, email: true } },
          },
        });

        res.status(201).json({
          success: true,
          data: formatComplaint(fallback, req.user.role),
          message: 'Complaint submitted. Automated analysis failed; queued for manual review.',
        });
      }
    } catch (err: any) {
      console.error('[Complaint Submission Error]', err);
      res.status(500).json({ success: false, error: 'Failed to process complaint submission.' });
    }
  }
);

// LIST COMPLAINTS (Filtered, Sorted, Paginated with Role Scoping)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const filterResult = ComplaintFilterSchema.safeParse(req.query);
    if (!filterResult.success) {
      res.status(400).json({ success: false, error: filterResult.error.errors[0]?.message || 'Invalid filter parameters' });
      return;
    }

    const filters = filterResult.data;
    const where: any = {};

    // 1. Role-based scoping
    if (req.user.role === 'CITIZEN') {
      where.citizenId = req.user.id;
    } else if (req.user.role === 'STAFF') {
      if (!req.user.departmentId) {
        res.status(403).json({ success: false, error: 'Staff account has not been assigned to a department yet.' });
        return;
      }
      where.departmentId = req.user.departmentId;
    }

    // 2. Department filter for Admin
    if (req.user.role === 'ADMIN' && filters.departmentId) {
      if (filters.departmentId === 'UNASSIGNED') {
        where.departmentId = null;
      } else {
        where.departmentId = filters.departmentId;
      }
    }

    // 3. Category filter
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    // 4. Service Area filter
    if (filters.serviceAreaId) {
      where.serviceAreaId = filters.serviceAreaId;
    }

    // 5. Status filter
    if (filters.status) {
      if (filters.status === 'ACTIVE') {
        where.status = { in: ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS'] };
      } else if (filters.status !== 'ALL') {
        where.status = filters.status;
      }
    }

    // 6. Review state filter
    if (filters.reviewState && filters.reviewState !== 'ALL') {
      where.reviewState = filters.reviewState;
    }

    // 7. Date range filter
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    // 8. Text search across reference, title, description, address
    if (filters.search && filters.search.trim().length > 0) {
      const q = filters.search.trim();
      where.OR = [
        { reference: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Query database
    const rawComplaints = await prisma.complaint.findMany({
      where,
      include: {
        serviceArea: true,
        category: true,
        department: true,
        attachments: true,
        citizen: { select: { id: true, name: true, email: true } },
      },
    });

    // Compute dynamic scores & star flags for all fetched complaints
    const formattedList = rawComplaints.map((c) => formatComplaint(c, req.user?.role));

    // Post-filter by dynamically computed values (minCoreScore, star AND conditions)
    let filteredList = formattedList.filter((item) => {
      if (filters.minCoreScore !== undefined && item.scores.coreScore < filters.minCoreScore) {
        return false;
      }
      if (filters.starRed === 'true' && !item.scores.stars.redPriority) return false;
      if (filters.starPink === 'true' && !item.scores.stars.pinkDuration) return false;
      if (filters.starOrange === 'true' && !item.scores.stars.orangeUrgency) return false;
      if (filters.starGreen === 'true' && !item.scores.stars.greenFeasibility) return false;
      return true;
    });

    // Default sorting specification:
    // 1. Core score descending
    // 2. Urgency descending
    // 3. Submission timestamp ascending
    // 4. Unique ID as final stable tie-breaker
    filteredList.sort((a, b) => {
      if (filters.sortBy === 'coreScore') {
        const diff = b.scores.coreScore - a.scores.coreScore;
        if (Math.abs(diff) > 0.001) return filters.sortOrder === 'asc' ? -diff : diff;
        // Secondary: urgency descending
        const urgDiff = b.scores.effectiveUrgency - a.scores.effectiveUrgency;
        if (Math.abs(urgDiff) > 0.001) return urgDiff;
        // Tertiary: submission timestamp ascending
        const timeDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (timeDiff !== 0) return timeDiff;
        return a.id.localeCompare(b.id);
      } else if (filters.sortBy === 'urgency') {
        const diff = b.scores.effectiveUrgency - a.scores.effectiveUrgency;
        return filters.sortOrder === 'asc' ? -diff : diff;
      } else if (filters.sortBy === 'priority') {
        const diff = b.scores.effectivePriority - a.scores.effectivePriority;
        return filters.sortOrder === 'asc' ? -diff : diff;
      } else if (filters.sortBy === 'duration') {
        const diff = b.scores.durationScore - a.scores.durationScore;
        return filters.sortOrder === 'asc' ? -diff : diff;
      } else if (filters.sortBy === 'feasibility') {
        const diff = b.scores.effectiveFeasibility - a.scores.effectiveFeasibility;
        return filters.sortOrder === 'asc' ? -diff : diff;
      } else if (filters.sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (filters.sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return 0;
    });

    const total = filteredList.length;
    const page = filters.page;
    const limit = filters.limit;
    const startIndex = (page - 1) * limit;
    const paginated = filteredList.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      data: {
        items: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (err: any) {
    console.error('[List Complaints Error]', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve complaints.' });
  }
});

// GET COMPLAINT DETAILS BY ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        serviceArea: true,
        category: true,
        department: true,
        attachments: true,
        citizen: { select: { id: true, name: true, email: true } },
        statusHistory: {
          include: { changedBy: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
        auditEvents: {
          include: { actor: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!complaint) {
      res.status(404).json({ success: false, error: 'Complaint not found.' });
      return;
    }

    // Role-based authorization
    if (req.user.role === 'CITIZEN' && complaint.citizenId !== req.user.id) {
      res.status(403).json({ success: false, error: 'Access denied: You can only view your own submitted complaints.' });
      return;
    }

    if (req.user.role === 'STAFF' && complaint.departmentId !== req.user.departmentId) {
      res.status(403).json({ success: false, error: 'Access denied: You can only view complaints assigned to your department.' });
      return;
    }

    res.json({
      success: true,
      data: formatComplaint(complaint, req.user.role),
    });
  } catch (err: any) {
    console.error('[Get Complaint Detail Error]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch complaint details.' });
  }
});

// SECURE ATTACHMENT VIEW/DOWNLOAD
router.get('/:id/attachments/:attachmentId', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id, attachmentId } = req.params;
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      res.status(404).json({ success: false, error: 'Complaint not found.' });
      return;
    }

    // Check permissions
    if (req.user.role === 'CITIZEN' && complaint.citizenId !== req.user.id) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }
    if (req.user.role === 'STAFF' && complaint.departmentId !== req.user.departmentId) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, complaintId: id },
    });

    if (!attachment) {
      res.status(404).json({ success: false, error: 'Attachment not found.' });
      return;
    }

    const resolved = await resolveAttachment(attachment.storageFilename);
    if (resolved.type === 'missing') {
      res.status(404).json({ success: false, error: 'Attachment file not found.' });
      return;
    }

    res.setHeader('Content-Type', attachment.mimeType || resolved.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.originalFilename)}"`);
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    resolved.stream.pipe(res);
  } catch (err: any) {
    console.error('[Attachment Serve Error]', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve attachment file.' });
  }
});

// UPDATE STATUS (STAFF & ADMIN)
router.patch('/:id/status', authenticateToken, requireRole('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const parsed = StatusUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || 'Invalid status update data' });
      return;
    }

    const { toStatus, note, isCitizenVisible, explanation } = parsed.data;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: { department: true },
    });

    if (!complaint) {
      res.status(404).json({ success: false, error: 'Complaint not found.' });
      return;
    }

    // Role check for staff
    if (req.user.role === 'STAFF' && complaint.departmentId !== req.user.departmentId) {
      res.status(403).json({ success: false, error: 'Access denied: You can only update complaints assigned to your department.' });
      return;
    }

    // Validate status transition
    const currentStatus = complaint.status;
    const allowed = STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(toStatus)) {
      res.status(400).json({
        success: false,
        error: `Invalid transition from "${currentStatus}" to "${toStatus}". Allowed transitions: ${allowed.join(', ')}`,
      });
      return;
    }

    // If reopening from RESOLVED to ASSIGNED, only ADMIN can do it with required explanation
    if (currentStatus === 'RESOLVED' && toStatus === 'ASSIGNED') {
      if (req.user.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: 'Only administrators can reopen a resolved complaint.' });
        return;
      }
      if (!explanation || explanation.trim().length < 5) {
        res.status(400).json({ success: false, error: 'An explanation is required to reopen a resolved complaint.' });
        return;
      }
    }

    // If moving IN_PROGRESS back to ASSIGNED, require explanation
    if (currentStatus === 'IN_PROGRESS' && toStatus === 'ASSIGNED') {
      if (!explanation || explanation.trim().length < 5) {
        res.status(400).json({ success: false, error: 'An explanation is required when moving a complaint back to Assigned.' });
        return;
      }
    }

    const updateData: any = {
      status: toStatus,
    };

    if (toStatus === 'RESOLVED') {
      updateData.resolvedAt = new Date();
      updateData.resolutionNote = note || 'Issue addressed and resolved by department staff.';
    } else if (currentStatus === 'RESOLVED') {
      // Reopening freezes age reset
      updateData.resolvedAt = null;
      updateData.resolutionNote = null;
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: updateData,
      include: {
        serviceArea: true,
        category: true,
        department: true,
        attachments: true,
        citizen: { select: { id: true, name: true, email: true } },
      },
    });

    const statusNote = note || explanation || `Status updated from ${currentStatus} to ${toStatus}.`;

    await prisma.statusHistory.create({
      data: {
        complaintId: id,
        fromStatus: currentStatus,
        toStatus,
        note: statusNote,
        isCitizenVisible,
        changedById: req.user.id,
      },
    });

    await logAuditEvent(prisma, {
      complaintId: id,
      actorId: req.user.id,
      action: 'STATUS_CHANGE',
      details: {
        from: currentStatus,
        to: toStatus,
        note: statusNote,
        isCitizenVisible,
      },
    });

    res.json({
      success: true,
      data: formatComplaint(updated, req.user.role),
      message: `Status successfully updated to ${toStatus}.`,
    });
  } catch (err: any) {
    console.error('[Status Update Error]', err);
    res.status(500).json({ success: false, error: 'Failed to update complaint status.' });
  }
});

// FLAG COMPLAINT FOR ADMINISTRATOR REVIEW (STAFF)
router.post('/:id/flag-review', authenticateToken, requireRole('STAFF'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const parsed = FlagForReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || 'Reason is required' });
      return;
    }

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      res.status(404).json({ success: false, error: 'Complaint not found.' });
      return;
    }

    if (complaint.departmentId !== req.user.departmentId) {
      res.status(403).json({ success: false, error: 'Access denied: You can only flag complaints assigned to your department.' });
      return;
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        reviewState: 'REQUIRED',
      },
      include: {
        serviceArea: true,
        category: true,
        department: true,
        attachments: true,
        citizen: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.statusHistory.create({
      data: {
        complaintId: id,
        fromStatus: complaint.status,
        toStatus: complaint.status,
        note: `Flagged for administrative review: ${parsed.data.reason}`,
        isCitizenVisible: false, // Internal note
        changedById: req.user.id,
      },
    });

    await logAuditEvent(prisma, {
      complaintId: id,
      actorId: req.user.id,
      action: 'FLAG_FOR_REVIEW',
      details: { reason: parsed.data.reason },
    });

    res.json({
      success: true,
      data: formatComplaint(updated, req.user.role),
      message: 'Complaint flagged for administrator review.',
    });
  } catch (err: any) {
    console.error('[Flag For Review Error]', err);
    res.status(500).json({ success: false, error: 'Failed to flag complaint for review.' });
  }
});

// MANUAL REVIEW DECISION (ADMIN ONLY)
router.post('/:id/manual-review', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const parsed = ManualReviewDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || 'Invalid review data' });
      return;
    }

    const { categoryId, departmentId, notes } = parsed.data;

    const [category, department, complaint] = await Promise.all([
      prisma.category.findUnique({ where: { id: categoryId } }),
      prisma.department.findUnique({ where: { id: departmentId } }),
      prisma.complaint.findUnique({ where: { id } }),
    ]);

    if (!complaint) {
      res.status(404).json({ success: false, error: 'Complaint not found.' });
      return;
    }
    if (!category) {
      res.status(400).json({ success: false, error: 'Category not found.' });
      return;
    }
    if (!department) {
      res.status(400).json({ success: false, error: 'Department not found.' });
      return;
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        categoryId,
        departmentId,
        reviewState: 'APPROVED',
        status: 'ASSIGNED', // Safe assignment moves to ASSIGNED
      },
      include: {
        serviceArea: true,
        category: true,
        department: true,
        attachments: true,
        citizen: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.statusHistory.create({
      data: {
        complaintId: id,
        fromStatus: complaint.status,
        toStatus: 'ASSIGNED',
        note: `Administrative review completed: Category set to "${category.name}", assigned to "${department.name}". Notes: ${notes}`,
        isCitizenVisible: true,
        changedById: req.user.id,
      },
    });

    await logAuditEvent(prisma, {
      complaintId: id,
      actorId: req.user.id,
      action: 'MANUAL_REVIEW_DECISION',
      details: {
        categoryId,
        categoryName: category.name,
        departmentId,
        departmentName: department.name,
        notes,
      },
    });

    res.json({
      success: true,
      data: formatComplaint(updated, req.user.role),
      message: 'Administrative review decision applied successfully.',
    });
  } catch (err: any) {
    console.error('[Manual Review Error]', err);
    res.status(500).json({ success: false, error: 'Failed to record manual review decision.' });
  }
});

// SCORE OVERRIDES (ADMIN ONLY)
router.post('/:id/override-scores', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const parsed = ScoreOverrideSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || 'Invalid override data' });
      return;
    }

    const { priority, urgency, feasibility, reason } = parsed.data;

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      res.status(404).json({ success: false, error: 'Complaint not found.' });
      return;
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        overridePriority: priority !== undefined ? priority : complaint.overridePriority,
        overrideUrgency: urgency !== undefined ? urgency : complaint.overrideUrgency,
        overrideFeasibility: feasibility !== undefined ? feasibility : complaint.overrideFeasibility,
        overrideReason: reason,
        overriddenById: req.user.id,
        overriddenAt: new Date(),
      },
      include: {
        serviceArea: true,
        category: true,
        department: true,
        attachments: true,
        citizen: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.statusHistory.create({
      data: {
        complaintId: id,
        fromStatus: complaint.status,
        toStatus: complaint.status,
        note: `Administrative score override applied: ${reason}`,
        isCitizenVisible: false,
        changedById: req.user.id,
      },
    });

    await logAuditEvent(prisma, {
      complaintId: id,
      actorId: req.user.id,
      action: 'SCORE_OVERRIDE',
      details: {
        previous: {
          priority: complaint.overridePriority ?? complaint.priority,
          urgency: complaint.overrideUrgency ?? complaint.urgency,
          feasibility: complaint.overrideFeasibility ?? complaint.feasibility,
        },
        overriddenTo: { priority, urgency, feasibility },
        reason,
      },
    });

    res.json({
      success: true,
      data: formatComplaint(updated, req.user.role),
      message: 'Scores overridden successfully.',
    });
  } catch (err: any) {
    console.error('[Score Override Error]', err);
    res.status(500).json({ success: false, error: 'Failed to override scores.' });
  }
});

// RETRY ANALYSIS (STAFF / ADMIN)
router.post('/:id/retry-analysis', authenticateToken, requireRole('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      res.status(404).json({ success: false, error: 'Complaint not found.' });
      return;
    }

    // Role-based authorization: Staff can only retry analysis for complaints assigned to their department
    if (req.user?.role === 'STAFF' && complaint.departmentId !== req.user.departmentId) {
      res.status(403).json({
        success: false,
        error: 'Access denied: You can only retry analysis for complaints assigned to your department.',
      });
      return;
    }

    const analysisResult = await classifyComplaint(complaint.title, complaint.description);
    const category = await prisma.category.findUnique({ where: { code: analysisResult.categoryCode } });
    const categoryId = category ? category.id : null;
    const routingResult = await routeComplaint(prisma, categoryId, complaint.serviceAreaId);

    const shouldReview = analysisResult.needsReview || routingResult.requiresReview;

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        categoryId,
        departmentId: routingResult.departmentId || complaint.departmentId,
        analysisState: 'COMPLETED',
        reviewState: shouldReview ? 'REQUIRED' : 'NOT_REQUIRED',
        analysisProvider: analysisResult.provider,
        analysisVersion: analysisResult.version,
        classificationConfidence: analysisResult.confidence,
        aiRationale: analysisResult.rationale,
        priority: analysisResult.priority,
        urgency: analysisResult.urgency,
        feasibility: analysisResult.feasibility,
      },
      include: {
        serviceArea: true,
        category: true,
        department: true,
        attachments: true,
        citizen: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({
      success: true,
      data: formatComplaint(updated, req.user?.role),
      message: 'Analysis rerun completed successfully.',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to rerun analysis.' });
  }
});

export default router;
