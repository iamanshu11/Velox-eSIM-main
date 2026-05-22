import { z } from 'zod';
import {
  PlanSchema,
  PaginationSchema,
  type Plan,
  type PaginationInput,
} from './api-schemas';
export {
  PlanSchema,
  PaginationSchema,
};

export type {
  Plan,
  PaginationInput,
};

export const createPlanSchema = PlanSchema.omit({
  id: true,
});

export const updatePlanSchema = createPlanSchema.partial();

export const getPlanFilterSchema = PaginationSchema.extend({
  country: z.string().optional(),
  operator: z.string().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type GetPlanFilterInput = z.infer<typeof getPlanFilterSchema>;

