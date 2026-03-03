import { z } from 'zod';

export const createPropertySchema = z.object({
  portfolioId: z.string().optional(),
  name: z.string().min(1, 'Property name is required').max(200),
  type: z.enum([
    'APARTMENT_COMPLEX',
    'TOWNHOUSE_COMPLEX',
    'MIXED_USE',
    'STUDENT_RESIDENCE',
    'SINGLE_RESIDENTIAL',
    'ESTATE',
  ]),
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional(),
  suburb: z.string().min(1, 'Suburb is required'),
  city: z.string().min(1, 'City is required'),
  province: z.string().min(1, 'Province is required'),
  postalCode: z.string().min(4, 'Postal code is required'),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export const createUnitSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  unitNumber: z.string().min(1, 'Unit number is required'),
  type: z.enum([
    'STUDIO',
    'ONE_BED',
    'TWO_BED',
    'THREE_BED',
    'FOUR_BED',
    'PENTHOUSE',
    'TOWNHOUSE',
    'OTHER',
  ]),
  floor: z.number().int().optional(),
  bedrooms: z.number().int().min(0).default(1),
  bathrooms: z.number().int().min(0).default(1),
  sizeSqm: z.number().positive().optional(),
  monthlyRent: z.number().positive('Monthly rent must be positive'),
  depositAmount: z.number().min(0).optional(),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  parkingBays: z.number().int().min(0).default(0),
  availableFrom: z.string().datetime().optional(),
});

export const updateUnitSchema = createUnitSchema.partial().omit({ propertyId: true });

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
