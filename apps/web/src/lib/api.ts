import {
  DEMO_USER,
  DEMO_STATS,
  DEMO_PIPELINE,
  DEMO_PROPERTIES,
  DEMO_LEADS,
  DEMO_APPLICATIONS,
  DEMO_LEASES,
  DEMO_TENANTS,
} from './demo-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

class ApiClient {
  private token: string | null = null;
  private demoMode = false;

  isDemoMode() {
    return this.demoMode;
  }

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
    this.demoMode = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tms_token');
      localStorage.removeItem('tms_refresh_token');
      localStorage.removeItem('tms_demo_mode');
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
    try {
      const res = await this.request<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      this.setToken(res.data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('tms_refresh_token', res.data.refreshToken);
      }
      return res.data;
    } catch {
      this.demoMode = true;
      this.setToken('demo-token');
      if (typeof window !== 'undefined') {
        localStorage.setItem('tms_demo_mode', 'true');
      }
      return { user: DEMO_USER, accessToken: 'demo-token', refreshToken: 'demo-refresh' };
    }
  }

  async register(data: any) {
    try {
      const res = await this.request<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      this.setToken(res.data.accessToken);
      return res.data;
    } catch {
      this.demoMode = true;
      this.setToken('demo-token');
      if (typeof window !== 'undefined') {
        localStorage.setItem('tms_demo_mode', 'true');
      }
      return { user: { ...DEMO_USER, ...data }, accessToken: 'demo-token' };
    }
  }

  async getProfile() {
    if (this.demoMode || (typeof window !== 'undefined' && localStorage.getItem('tms_demo_mode'))) {
      this.demoMode = true;
      return { success: true, data: DEMO_USER };
    }
    return this.request<any>('/auth/profile');
  }

  // Properties
  async getProperties() {
    try {
      return await this.request<any>('/properties');
    } catch {
      return DEMO_PROPERTIES;
    }
  }

  async getProperty(id: string) {
    try {
      return await this.request<any>(`/properties/${id}`);
    } catch {
      return { data: DEMO_PROPERTIES.data.find(p => p.id === id) || DEMO_PROPERTIES.data[0] };
    }
  }

  async createProperty(data: any) {
    if (this.demoMode) {
      const newProp = { id: 'prop-new-' + Date.now(), ...data, _count: { units: 0 } };
      DEMO_PROPERTIES.data.push(newProp);
      return { data: newProp };
    }
    return this.request<any>('/properties', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateProperty(id: string, data: any) {
    return this.request<any>(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async getDashboardStats() {
    try {
      return await this.request<any>('/properties/dashboard/stats');
    } catch {
      return DEMO_STATS;
    }
  }

  // Units
  async getUnits(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    try {
      return await this.request<any>(`/units${query}`);
    } catch {
      return { data: [] };
    }
  }

  async createUnit(data: any) {
    return this.request<any>('/units', { method: 'POST', body: JSON.stringify(data) });
  }

  // Leads
  async getLeads(params?: Record<string, string>) {
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return await this.request<any>(`/leads${query}`);
    } catch {
      const status = params?.status;
      if (status) {
        return { data: DEMO_LEADS.data.filter(l => l.status === status) };
      }
      return DEMO_LEADS;
    }
  }

  async getLead(id: string) {
    try {
      return await this.request<any>(`/leads/${id}`);
    } catch {
      return { data: DEMO_LEADS.data.find(l => l.id === id) || DEMO_LEADS.data[0] };
    }
  }

  async createLead(data: any) {
    if (this.demoMode) {
      const newLead = { id: 'lead-new-' + Date.now(), ...data, score: 70, status: 'NEW' };
      DEMO_LEADS.data.unshift(newLead);
      return { data: newLead };
    }
    return this.request<any>('/leads', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateLeadStatus(id: string, status: string, lostReason?: string) {
    if (this.demoMode) {
      const lead = DEMO_LEADS.data.find(l => l.id === id);
      if (lead) lead.status = status;
      return { data: lead };
    }
    return this.request<any>(`/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, lostReason }),
    });
  }

  async getPipelineStats() {
    try {
      return await this.request<any>('/leads/pipeline');
    } catch {
      return DEMO_PIPELINE;
    }
  }

  // Applications
  async getApplications(params?: Record<string, string>) {
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return await this.request<any>(`/applications${query}`);
    } catch {
      const status = params?.status;
      if (status) {
        return { data: DEMO_APPLICATIONS.data.filter(a => a.status === status) };
      }
      return DEMO_APPLICATIONS;
    }
  }

  async getApplication(id: string) {
    try {
      return await this.request<any>(`/applications/${id}`);
    } catch {
      return { data: DEMO_APPLICATIONS.data.find(a => a.id === id) || DEMO_APPLICATIONS.data[0] };
    }
  }

  async createApplication(data: any) {
    return this.request<any>('/applications', { method: 'POST', body: JSON.stringify(data) });
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
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return await this.request<any>(`/leases${query}`);
    } catch {
      const status = params?.status;
      if (status) {
        return { data: DEMO_LEASES.data.filter(l => l.status === status) };
      }
      return DEMO_LEASES;
    }
  }

  async getLease(id: string) {
    try {
      return await this.request<any>(`/leases/${id}`);
    } catch {
      return { data: DEMO_LEASES.data.find(l => l.id === id) || DEMO_LEASES.data[0] };
    }
  }

  async createLease(data: any) {
    return this.request<any>('/leases', { method: 'POST', body: JSON.stringify(data) });
  }

  async signLease(id: string, role: string, signature: string) {
    return this.request<any>(`/leases/${id}/sign`, {
      method: 'PATCH',
      body: JSON.stringify({ role, signature }),
    });
  }

  // Tenants
  async getTenants(params?: Record<string, string>) {
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return await this.request<any>(`/tenants${query}`);
    } catch {
      const search = params?.search?.toLowerCase();
      if (search) {
        return {
          data: DEMO_TENANTS.data.filter(
            t =>
              t.user?.firstName.toLowerCase().includes(search) ||
              t.user?.lastName.toLowerCase().includes(search) ||
              t.user?.email.toLowerCase().includes(search),
          ),
        };
      }
      return DEMO_TENANTS;
    }
  }

  async getTenant(id: string) {
    try {
      return await this.request<any>(`/tenants/${id}`);
    } catch {
      return { data: DEMO_TENANTS.data.find(t => t.id === id) || DEMO_TENANTS.data[0] };
    }
  }

  // Documents
  async uploadDocument(file: File, data: { applicationId?: string; tenantId?: string; type: string }) {
    const formData = new FormData();
    formData.append('file', file);
    if (data.applicationId) formData.append('applicationId', data.applicationId);
    if (data.tenantId) formData.append('tenantId', data.tenantId);
    formData.append('type', data.type);
    return this.request<any>('/documents/upload', { method: 'POST', body: formData });
  }

  // Portfolios
  async getPortfolios() {
    try {
      return await this.request<any>('/properties/portfolios');
    } catch {
      return { data: [] };
    }
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
