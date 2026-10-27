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

  let data: ApiResponse<T>;
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = {
        success: false,
        error: `Invalid JSON received from server (HTTP ${res.status}).`,
      };
    }
  } else {
    // Gracefully handle non-JSON responses from serverless infrastructure / gateways
    const rawText = await res.text().catch(() => '');
    let friendlyMessage = `The server encountered a temporary issue (HTTP ${res.status}). Please try again in a few moments.`;

    if (res.status === 500 && rawText.includes('FUNCTION_INVOCATION_FAILED')) {
      friendlyMessage =
        'The backend service is currently initializing or awaiting environment configuration. Please verify server readiness or retry shortly.';
    } else if (res.status === 503) {
      friendlyMessage = 'The civic service is temporarily offline for maintenance. Please check back shortly.';
    } else if (res.status === 502 || res.status === 504) {
      friendlyMessage = 'Network gateway timeout. Please check your internet connection and retry.';
    }

    data = {
      success: false,
      error: friendlyMessage,
    };
  }

  if (!res.ok || !data.success) {
    const err: any = new Error(data.error || data.message || `Request failed with status ${res.status}`);
    err.status = res.status;
    err.code = (data as any)?.code;
    throw err;
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
