import {
  SafeUser,
  ComplaintItem,
  DepartmentSummary,
  CategorySummary,
  ServiceAreaSummary,
  DashboardStats,
  ApiResponse,
} from '../../../shared/types';
import {
  LoginInput,
  RegisterInput,
  ComplaintFilterInput,
  StatusUpdateInput,
  ScoreOverrideInput,
  ManualReviewDecisionInput,
  StaffDepartmentAssignInput,
} from '../../../shared/schemas';

const API_BASE = '/api';

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)civic_csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const csrfToken = getCsrfToken();
  if (csrfToken && !headers.has('X-CSRF-Token')) {
    headers.set('X-CSRF-Token', csrfToken);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // sends cookies
  });

  const data: ApiResponse<T> = await res.json().catch(() => ({
    success: false,
    error: `HTTP Error ${res.status}: Failed to parse server response.`,
  }));

  if (!res.ok || !data.success) {
    throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
  }

  return data.data as T;
}

export const api = {
  // Auth
  async login(input: LoginInput): Promise<{ user: SafeUser }> {
    return request<{ user: SafeUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async register(input: RegisterInput): Promise<{ user: SafeUser }> {
    return request<{ user: SafeUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async logout(): Promise<void> {
    await request('/auth/logout', { method: 'POST' });
  },

  async getMe(): Promise<{ user: SafeUser }> {
    return request<{ user: SafeUser }>('/auth/me');
  },

  // Metadata
  async getDepartments(): Promise<DepartmentSummary[]> {
    return request<DepartmentSummary[]>('/meta/departments');
  },

  async getCategories(): Promise<CategorySummary[]> {
    return request<CategorySummary[]>('/meta/categories');
  },

  async getServiceAreas(): Promise<ServiceAreaSummary[]> {
    return request<ServiceAreaSummary[]>('/meta/service-areas');
  },

  async getRoutingRules(): Promise<any[]> {
    return request<any[]>('/meta/routing-rules');
  },

  async getConfig(): Promise<{
    enableDemoAccounts: boolean;
    storageProvider: string;
    directUploadEnabled: boolean;
    aiProvider: string;
    environment: string;
  }> {
    return request<any>('/meta/config');
  },

  // Complaints
  async listComplaints(filters: Partial<ComplaintFilterInput> = {}): Promise<{
    items: ComplaintItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params.append(k, String(v));
      }
    });
    return request<{
      items: ComplaintItem[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/complaints?${params.toString()}`);
  },

  async getComplaint(id: string): Promise<ComplaintItem> {
    return request<ComplaintItem>(`/complaints/${id}`);
  },

  async createComplaint(payload: FormData | Record<string, any>): Promise<ComplaintItem> {
    if (payload instanceof FormData) {
      return request<ComplaintItem>('/complaints', {
        method: 'POST',
        body: payload,
      });
    }
    return request<ComplaintItem>('/complaints', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateStatus(id: string, input: StatusUpdateInput): Promise<ComplaintItem> {
    return request<ComplaintItem>(`/complaints/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async flagForReview(id: string, reason: string): Promise<ComplaintItem> {
    return request<ComplaintItem>(`/complaints/${id}/flag-review`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async submitManualReviewDecision(id: string, input: ManualReviewDecisionInput): Promise<ComplaintItem> {
    return request<ComplaintItem>(`/complaints/${id}/manual-review`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async overrideScores(id: string, input: ScoreOverrideInput): Promise<ComplaintItem> {
    return request<ComplaintItem>(`/complaints/${id}/override-scores`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async retryAnalysis(id: string): Promise<ComplaintItem> {
    return request<ComplaintItem>(`/complaints/${id}/retry-analysis`, {
      method: 'POST',
    });
  },

  // Admin
  async getUsers(): Promise<any[]> {
    return request<any[]>('/admin/users');
  },

  async assignStaffDepartment(input: StaffDepartmentAssignInput): Promise<any> {
    return request<any>('/admin/staff/assign', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async getAuditLogs(): Promise<any[]> {
    return request<any[]>('/admin/audit-logs');
  },

  // Stats
  async getDashboardStats(): Promise<DashboardStats> {
    return request<DashboardStats>('/stats/dashboard');
  },
};
