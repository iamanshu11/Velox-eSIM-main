import { z } from 'zod';
import {
  CreatePaymentInputSchema,
  type CreatePaymentInput,
} from './api-schemas';
export {
  CreatePaymentInputSchema,
};

export type {
  CreatePaymentInput,
};

export const updatePaymentSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED']).optional(),
  transactionId: z.string().optional(),
  errorMessage: z.string().max(500).optional(),
});

export const processWebhookSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  data: z.record(z.any()),
});

export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type ProcessWebhookInput = z.infer<typeof processWebhookSchema>;
export const createPaymentSchema = CreatePaymentInputSchema;

