export type Role = 'CITIZEN' | 'STAFF' | 'ADMIN';

export type ComplaintStatus = 'SUBMITTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';

export type AnalysisState = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type ReviewState = 'NOT_REQUIRED' | 'REQUIRED' | 'APPROVED';

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  departmentId: string | null;
  department?: DepartmentSummary | null;
  createdAt: string;
}

export interface DepartmentSummary {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface ServiceAreaSummary {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface CategorySummary {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface ScoreStars {
  redPriority: boolean;      // priority > 7
  pinkDuration: boolean;     // duration > 7
  orangeUrgency: boolean;    // urgency > 7
  greenFeasibility: boolean; // feasibility > 7
}

export interface ComplaintScoreDetails {
  priority: number;
  durationScore: number;
  urgency: number;
  feasibility: number;
  coreScore: number;
  unresolvedAgeDays: number;
  stars: ScoreStars;
  hasOverrides: boolean;
  effectivePriority: number;
  effectiveUrgency: number;
  effectiveFeasibility: number;
}

export interface AttachmentSummary {
  id: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  url: string;
}

export interface StatusHistoryItem {
  id: string;
  fromStatus: ComplaintStatus | null;
  toStatus: ComplaintStatus;
  note: string | null;
  isCitizenVisible: boolean;
  changedById: string;
  changedByName: string;
  createdAt: string;
}

export interface AuditEventItem {
  id: string;
  complaintId: string | null;
  actorId: string;
  actorName: string;
  action: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface ComplaintItem {
  id: string;
  reference: string;
  title: string;
  description: string;
  address: string;
  serviceAreaId: string;
  serviceArea: ServiceAreaSummary;
  categoryId: string | null;
  category: CategorySummary | null;
  departmentId: string | null;
  department: DepartmentSummary | null;
  citizenId: string;
  citizenName?: string;
  firstNoticedDate: string | null;
  status: ComplaintStatus;
  analysisState: AnalysisState;
  reviewState: ReviewState;
  analysisProvider: string | null;
  analysisVersion: string | null;
  classificationConfidence: number | null;
  aiRationale: string | null;
  
  // Computed scores & stars
  scores: ComplaintScoreDetails;

  // Raw DB scores
  rawPriority: number;
  rawUrgency: number;
  rawFeasibility: number;

  // Overrides
  overridePriority: number | null;
  overrideUrgency: number | null;
  overrideFeasibility: number | null;
  overrideReason: string | null;
  overriddenById: string | null;
  overriddenByName?: string | null;
  overriddenAt: string | null;

  resolvedAt: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;

  attachments?: AttachmentSummary[];
  statusHistory?: StatusHistoryItem[];
  auditEvents?: AuditEventItem[];
}

export interface DashboardStats {
  totalComplaints: number;
  openComplaints: number;
  inProgressComplaints: number;
  resolvedComplaints: number;
  manualReviewRequired: number;
  highPriorityCount: number; // coreScore > 7.0
  departmentStats?: Array<{
    departmentId: string;
    departmentName: string;
    total: number;
    inProgress: number;
    resolved: number;
  }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
