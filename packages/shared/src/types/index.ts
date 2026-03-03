export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  organisationId: string;
  iat?: number;
  exp?: number;
}

export interface AffordabilityResult {
  monthlyIncome: number;
  monthlyRent: number;
  ratio: number;
  threshold: number;
  passed: boolean;
  maxAffordableRent: number;
}

export interface ScreeningSummary {
  applicationId: string;
  totalChecks: number;
  completedChecks: number;
  passedChecks: number;
  failedChecks: number;
  overallStatus: 'PENDING' | 'PASSED' | 'FAILED' | 'REVIEW_REQUIRED';
}

export interface DashboardStats {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  totalLeads: number;
  activeApplications: number;
  activeLeases: number;
  collectionRate: number;
}
