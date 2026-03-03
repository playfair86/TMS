import { z } from 'zod';

export const createLeaseSchema = z.object({
  applicationId: z.string().optional(),
  tenantId: z.string().min(1),
  unitId: z.string().min(1),
  templateId: z.string().optional(),
  leaseType: z.enum(['FIXED_TERM', 'MONTH_TO_MONTH', 'STUDENT', 'CO_LIVING']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  monthlyRent: z.number().positive(),
  depositAmount: z.number().min(0),
  escalationPct: z.number().min(0).max(100).default(0),
  noticePeriodDays: z.number().int().min(0).default(30),
});

export const signLeaseSchema = z.object({
  signature: z.string().min(1, 'Signature is required'),
});

export const terminateLeaseSchema = z.object({
  terminationReason: z.string().min(1, 'Reason is required'),
  moveOutDate: z.string().datetime(),
});

export type CreateLeaseInput = z.infer<typeof createLeaseSchema>;
export type SignLeaseInput = z.infer<typeof signLeaseSchema>;
export type TerminateLeaseInput = z.infer<typeof terminateLeaseSchema>;
