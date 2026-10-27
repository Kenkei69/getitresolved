import { z } from 'zod';
import { UPLOAD_LIMITS, SCORING_CONFIG } from './constants';

export const RegisterSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name cannot exceed 80 characters'),
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long'),
});

export const LoginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const ComplaintCreateSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(120, 'Title cannot exceed 120 characters'),
  description: z.string().trim().min(15, 'Please provide more details (at least 15 characters)').max(3000, 'Description cannot exceed 3000 characters'),
  address: z.string().trim().min(5, 'Please provide a specific street address or landmark (at least 5 characters)').max(200, 'Address cannot exceed 200 characters'),
  serviceAreaId: z.string().min(1, 'Please select a valid service area'),
  firstNoticedDate: z.string().optional().nullable(),
});

export const StatusUpdateSchema = z.object({
  toStatus: z.enum(['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED']),
  note: z.string().trim().max(1000, 'Note cannot exceed 1000 characters').optional().nullable(),
  isCitizenVisible: z.boolean().default(true),
  explanation: z.string().trim().max(1000).optional(),
  expectedStatus: z.string().optional(),
}).refine((data) => {
  if (data.toStatus === 'RESOLVED') {
    return !!data.note && data.note.trim().length >= 5;
  }
  return true;
}, {
  message: 'A detailed resolution note (at least 5 characters) is required before resolving a complaint',
  path: ['note'],
});

export const FlagForReviewSchema = z.object({
  reason: z.string().trim().min(10, 'Please provide an explanation (at least 10 characters) for flagging this complaint').max(1000),
});

export const ManualReviewDecisionSchema = z.object({
  categoryId: z.string().min(1, 'Please select a valid category'),
  departmentId: z.string().min(1, 'Please select a valid department'),
  reviewDecision: z.enum(['APPROVED', 'REJECTED']).default('APPROVED'),
  notes: z.string().trim().min(5, 'Please provide an administrative review rationale').max(1000),
});

export const ScoreOverrideSchema = z.object({
  priority: z.number().min(0).max(10).optional().nullable(),
  urgency: z.number().min(0).max(10).optional().nullable(),
  feasibility: z.number().min(0).max(10).optional().nullable(),
  reason: z.string().trim().min(10, 'A reason for overriding automated scores is required (at least 10 characters)').max(500),
});

export const StaffDepartmentAssignSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  departmentId: z.string().nullable(),
});

export const ComplaintFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  departmentId: z.string().optional(),
  serviceAreaId: z.string().optional(),
  status: z.enum(['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'ACTIVE', 'ALL']).optional(),
  reviewState: z.enum(['NOT_REQUIRED', 'REQUIRED', 'APPROVED', 'ALL']).optional(),
  minCoreScore: z.coerce.number().min(0).max(10).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  // Colored stars (AND condition)
  starRed: z.enum(['true', 'false']).optional(),
  starPink: z.enum(['true', 'false']).optional(),
  starOrange: z.enum(['true', 'false']).optional(),
  starGreen: z.enum(['true', 'false']).optional(),
  // Sorting
  sortBy: z.enum(['coreScore', 'urgency', 'priority', 'duration', 'feasibility', 'newest', 'oldest']).default('coreScore'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ComplaintCreateInput = z.infer<typeof ComplaintCreateSchema>;
export type StatusUpdateInput = z.infer<typeof StatusUpdateSchema>;
export type ScoreOverrideInput = z.infer<typeof ScoreOverrideSchema>;
export type ManualReviewDecisionInput = z.infer<typeof ManualReviewDecisionSchema>;
export type StaffDepartmentAssignInput = z.infer<typeof StaffDepartmentAssignSchema>;
export type ComplaintFilterInput = z.infer<typeof ComplaintFilterSchema>;
