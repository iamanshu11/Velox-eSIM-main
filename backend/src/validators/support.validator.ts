import { z } from 'zod';
import {
  CreateTicketInputSchema,
  AddCommunicationInputSchema,
  type CreateTicketInput,
  type AddCommunicationInput,
} from './api-schemas';
export {
  CreateTicketInputSchema,
  AddCommunicationInputSchema,
};

export type {
  CreateTicketInput,
  AddCommunicationInput,
};
export const supportTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  message: z.string().min(5).max(5000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  category: z.string().optional(),
});

export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
export const ticketReplySchema = z.object({
  message: z.string().min(1).max(5000),
});

export type TicketReplyInput = z.infer<typeof ticketReplySchema>;

export const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().uuid().optional(),
});

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export const createTicketSchema = CreateTicketInputSchema;
export const addCommunicationSchema = AddCommunicationInputSchema;

