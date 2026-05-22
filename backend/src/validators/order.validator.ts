import {
  CreateOrderInputSchema,
  UpdateOrderInputSchema,
  PaginationSchema,
  type CreateOrderInput,
  type UpdateOrderInput,
  type PaginationInput,
} from './api-schemas';
export {
  CreateOrderInputSchema,
  UpdateOrderInputSchema,
  PaginationSchema,
};

export type {
  CreateOrderInput,
  UpdateOrderInput,
  PaginationInput,
};
export const createOrderSchema = CreateOrderInputSchema;
export const updateOrderSchema = UpdateOrderInputSchema;
export const getOrderFilterSchema = PaginationSchema;

export type GetOrderFilterInput = PaginationInput;

