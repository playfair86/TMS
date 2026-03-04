// Validation schemas
export * from './validation/auth';
export * from './validation/property';
export * from './validation/lead';
export * from './validation/application';
export * from './validation/lease';

// Constants
export {
  SA_PROVINCES,
  AFFORDABILITY_THRESHOLD,
  LEAD_STATUS_ORDER,
  APPLICATION_REQUIRED_DOCUMENTS,
  LEASE_RENEWAL_REMINDER_DAYS,
  ARREARS_ESCALATION_DAYS,
  MAX_FILE_SIZE_MB,
  ALLOWED_DOCUMENT_TYPES,
} from './constants/index';

// Types
export type {
  PaginatedResponse,
  ApiResponse,
  JwtPayload,
  AffordabilityResult,
  ScreeningSummary,
  DashboardStats,
} from './types/index';
