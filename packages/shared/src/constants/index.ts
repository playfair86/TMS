export const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
] as const;

export const AFFORDABILITY_THRESHOLD = 0.33; // Rent should be max 33% of gross income

export const LEAD_STATUS_ORDER = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'APPLIED',
  'SCREENED',
  'APPROVED',
  'LEASE_SIGNED',
  'MOVED_IN',
] as const;

export const APPLICATION_REQUIRED_DOCUMENTS = [
  'SA_ID',
  'PAYSLIP',
  'BANK_STATEMENT',
  'PROOF_OF_RESIDENCE',
] as const;

export const LEASE_RENEWAL_REMINDER_DAYS = [90, 60, 30] as const;

export const ARREARS_ESCALATION_DAYS = [1, 3, 7, 14, 30] as const;

export const MAX_FILE_SIZE_MB = 10;
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
