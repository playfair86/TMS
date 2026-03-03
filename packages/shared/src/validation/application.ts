import { z } from 'zod';

const saIdRegex = /^\d{13}$/;

export const createApplicationSchema = z.object({
  leadId: z.string().min(1),
  unitId: z.string().min(1),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number required'),
  idNumber: z
    .string()
    .regex(saIdRegex, 'SA ID must be exactly 13 digits')
    .optional(),
  dateOfBirth: z.string().datetime().optional(),
  nationality: z.string().default('ZA'),
  // Employment
  employerName: z.string().optional(),
  employerPhone: z.string().optional(),
  jobTitle: z.string().optional(),
  employmentStartDate: z.string().datetime().optional(),
  monthlyGrossIncome: z.number().positive().optional(),
  monthlyNetIncome: z.number().positive().optional(),
  // Current address
  currentAddress: z.string().optional(),
  currentLandlord: z.string().optional(),
  currentLandlordPhone: z.string().optional(),
  currentRent: z.number().min(0).optional(),
  reasonForLeaving: z.string().optional(),
  // Move-in preferences
  desiredMoveIn: z.string().datetime().optional(),
  leaseDuration: z.number().int().min(1).max(60).default(12),
  numberOfOccupants: z.number().int().min(1).default(1),
  hasPets: z.boolean().default(false),
  petDetails: z.string().optional(),
  hasVehicle: z.boolean().default(false),
  vehicleDetails: z.string().optional(),
});

export const updateApplicationSchema = createApplicationSchema
  .partial()
  .omit({ leadId: true, unitId: true });

export const addOccupantSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  idNumber: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  relationship: z.string().optional(),
  isMinor: z.boolean().default(false),
});

export const addGuarantorSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  idNumber: z.string().optional(),
  employerName: z.string().optional(),
  monthlyIncome: z.number().positive().optional(),
  relationship: z.string().optional(),
});

export const consentSchema = z.object({
  type: z.enum([
    'DATA_PROCESSING',
    'CREDIT_CHECK',
    'CRIMINAL_CHECK',
    'MARKETING',
    'ELECTRONIC_SIGNATURE',
    'TERMS_AND_CONDITIONS',
  ]),
  granted: z.boolean(),
  version: z.string().default('1.0'),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type AddOccupantInput = z.infer<typeof addOccupantSchema>;
export type AddGuarantorInput = z.infer<typeof addGuarantorSchema>;
export type ConsentInput = z.infer<typeof consentSchema>;
