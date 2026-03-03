import { z } from 'zod';

export const createLeadSchema = z.object({
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  assignedAgentId: z.string().optional(),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number required'),
  idNumber: z.string().optional(),
  source: z
    .enum([
      'WEBSITE',
      'WALK_IN',
      'AGENT_REFERRAL',
      'PROPERTY24',
      'PRIVATE_PROPERTY',
      'GUMTREE',
      'SOCIAL_MEDIA',
      'PHONE',
      'EMAIL',
      'OTHER',
    ])
    .default('WEBSITE'),
  sourceDetail: z.string().optional(),
  monthlyIncome: z.number().positive().optional(),
  desiredMoveIn: z.string().datetime().optional(),
  desiredBedrooms: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const updateLeadStatusSchema = z.object({
  status: z.enum([
    'NEW',
    'CONTACTED',
    'QUALIFIED',
    'APPLIED',
    'SCREENED',
    'APPROVED',
    'LEASE_SIGNED',
    'MOVED_IN',
    'LOST',
  ]),
  lostReason: z.string().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;
