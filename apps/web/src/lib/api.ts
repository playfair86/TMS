const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('tms_token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('tms_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tms_token');
      localStorage.removeItem('tms_refresh_token');
    }
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (file uploads)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  // Auth
  async login(email: string, password: string) {
    const res = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.data.accessToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tms_refresh_token', res.data.refreshToken);
    }
    return res.data;
  }

  async register(data: any) {
    const res = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.data.accessToken);
    return res.data;
  }

  async getProfile() {
    return this.request<any>('/auth/profile');
  }

  // Properties
  async getProperties(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/properties${query}`);
  }

  async getProperty(id: string) {
    return this.request<any>(`/properties/${id}`);
  }

  async createProperty(data: any) {
    return this.request<any>('/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProperty(id: string, data: any) {
    return this.request<any>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getDashboardStats() {
    return this.request<any>('/properties/dashboard/stats');
  }

  // Units
  async getUnits(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/units${query}`);
  }

  async createUnit(data: any) {
    return this.request<any>('/units', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Leads
  async getLeads(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/leads${query}`);
  }

  async getLead(id: string) {
    return this.request<any>(`/leads/${id}`);
  }

  async createLead(data: any) {
    return this.request<any>('/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLeadStatus(id: string, status: string, lostReason?: string) {
    return this.request<any>(`/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, lostReason }),
    });
  }

  async getPipelineStats() {
    return this.request<any>('/leads/pipeline');
  }

  // Applications
  async getApplications(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/applications${query}`);
  }

  async getApplication(id: string) {
    return this.request<any>(`/applications/${id}`);
  }

  async createApplication(data: any) {
    return this.request<any>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async reviewApplication(id: string, decision: string, notes?: string, declineReason?: string) {
    return this.request<any>(`/applications/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ decision, notes, declineReason }),
    });
  }

  // Screening
  async initiateScreening(applicationId: string, checks: string[]) {
    return this.request<any>(`/screening/applications/${applicationId}`, {
      method: 'POST',
      body: JSON.stringify({ checks }),
    });
  }

  async getScreeningResults(applicationId: string) {
    return this.request<any>(`/screening/applications/${applicationId}`);
  }

  // Leases
  async getLeases(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/leases${query}`);
  }

  async getLease(id: string) {
    return this.request<any>(`/leases/${id}`);
  }

  async createLease(data: any) {
    return this.request<any>('/leases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async signLease(id: string, role: string, signature: string) {
    return this.request<any>(`/leases/${id}/sign`, {
      method: 'PATCH',
      body: JSON.stringify({ role, signature }),
    });
  }

  // Tenants
  async getTenants(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/tenants${query}`);
  }

  async getTenant(id: string) {
    return this.request<any>(`/tenants/${id}`);
  }

  // Documents
  async uploadDocument(file: File, data: { applicationId?: string; tenantId?: string; type: string }) {
    const formData = new FormData();
    formData.append('file', file);
    if (data.applicationId) formData.append('applicationId', data.applicationId);
    if (data.tenantId) formData.append('tenantId', data.tenantId);
    formData.append('type', data.type);

    return this.request<any>('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  }

  // Portfolios
  async getPortfolios() {
    return this.request<any>('/properties/portfolios');
  }

  async createPortfolio(data: any) {
    return this.request<any>('/properties/portfolios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  logout() {
    this.clearToken();
  }
}

export const api = new ApiClient();
