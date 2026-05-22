import { z } from 'zod';

export const UserRoleEnum = z.enum(['ADMIN', 'CUSTOMER']);
export const OrderStatusEnum = z.enum(['Ready', 'Active', 'Suspended', 'Expired', 'Disabled']);
export const ProfileStatusEnum = z.enum(['RELEASED', 'ENABLED', 'DISABLED', 'SUSPENDED', 'EXPIRED']);
export const PaymentStatusEnum = z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']);
export const PaymentMethodEnum = z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'STRIPE', 'BANK_TRANSFER']);
export const TicketStatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
export const TicketPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
const EmailSchema = z
  .string()
  .email('Invalid email format')
  .toLowerCase()
  .refine(
    email => !email.includes('..') && !email.startsWith('.'),
    'Invalid email format'
  );
const StrongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*]/, 'Password must contain at least one special character (!@#$%^&*)');
const PasswordSchema = z.string().min(8, 'Password must be at least 8 characters');
const NameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters')
  .trim();
export const PaginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

export const CountryLocationSchema = z.object({
  countryCode: z.string().length(2),
  countryName: z.string().min(1),
  source: z.enum(['header', 'ip']),
});

export type CountryLocationInput = z.infer<typeof CountryLocationSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: EmailSchema,
  name: NameSchema,
  role: UserRoleEnum,
  avatar: z.string().url().optional().nullable(),
  emailVerified: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

export const RegisterInputSchema = z.object({
  email: EmailSchema,
  password: StrongPasswordSchema,
  name: NameSchema,
  phone: z.string().min(7).max(20).optional(),
  location: CountryLocationSchema.optional(),
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  location: CountryLocationSchema.optional(),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

export const ChangePasswordInputSchema = z
  .object({
    oldPassword: PasswordSchema,
    newPassword: StrongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>;

export const UpdateProfileInputSchema = z.object({
  name: NameSchema.optional(),
  phone: z.string().min(7).max(20).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;
export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: EmailSchema,
  name: NameSchema.nullable(),
  role: UserRoleEnum,
  avatar: z.string().url().optional().nullable(),
  emailVerified: z.boolean(),
  createdAt: z.date(),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthResponseSchema = z.object({
  user: AuthUserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const PackageListItemSchema = z.object({
  packageName: z.string(),
  packageCode: z.string(),
  slug: z.string(),
  duration: z.number().positive(),
  volume: z.number().positive(),
  locationCode: z.string(),
  createTime: z.string().datetime(),
  esimTranNo: z.string(),
  transactionId: z.string(),
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderNo: z.string(),
  esimTranNo: z.string().optional(),
  iccid: z.string(),
  quantity: z.number().int().positive(),
  status: OrderStatusEnum,
  profileStatus: ProfileStatusEnum,
  costPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  profit: z.number(),
  totalVolume: z.number().nonnegative(),
  totalDuration: z.number().nonnegative(),
  durationUnit: z.string(),
  expiredTime: z.string().datetime(),
  packageList: z.array(PackageListItemSchema).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Order = z.infer<typeof OrderSchema>;

export const CreateOrderInputSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Quantity cannot exceed 100'),
  notes: z.string().max(500).optional(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

export const UpdateOrderInputSchema = z.object({
  status: OrderStatusEnum.optional(),
  notes: z.string().max(500).optional(),
});

export type UpdateOrderInput = z.infer<typeof UpdateOrderInputSchema>;

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  paymentId: z.string(),
  userId: z.string().uuid(),
  orderId: z.string().uuid(),
  method: PaymentMethodEnum,
  amount: z.number().positive(),
  status: PaymentStatusEnum,
  transactionId: z.string().optional(),
  cardLast4: z.string().regex(/^\d{4}$/).optional(),
  cardBrand: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Payment = z.infer<typeof PaymentSchema>;

export const CreatePaymentInputSchema = z.object({
  orderId: z.string().uuid(),
  method: PaymentMethodEnum,
  amount: z.number().positive(),
  paymentMethodId: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentInputSchema>;

export const CommunicationSchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  userId: z.string().uuid(),
  message: z.string().min(1, 'Message cannot be empty').max(5000),
  attachments: z.array(z.string().url()).default([]),
  isInternal: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Communication = z.infer<typeof CommunicationSchema>;

export const TicketSchema = z.object({
  id: z.string().uuid(),
  ticketNumber: z.string(),
  userId: z.string().uuid(),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  status: TicketStatusEnum,
  priority: TicketPriorityEnum,
  category: z.string(),
  communications: z.array(CommunicationSchema).optional(),
  assignedTo: z.string().uuid().optional(),
  resolvedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Ticket = z.infer<typeof TicketSchema>;

export const CreateTicketInputSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  priority: TicketPriorityEnum.default('MEDIUM'),
  category: z.string().min(1, 'Category is required'),
});

export type CreateTicketInput = z.infer<typeof CreateTicketInputSchema>;

export const AddCommunicationInputSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(5000),
  isInternal: z.boolean().default(false),
});

export type AddCommunicationInput = z.infer<typeof AddCommunicationInputSchema>;

export const WalletSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  balance: z.number().nonnegative(),
  currency: z.string().length(3).toUpperCase(),
  lastUpdated: z.date(),
});

export type Wallet = z.infer<typeof WalletSchema>;

export const TopUpWalletInputSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  paymentMethodId: z.string().optional(),
});

export type TopUpWalletInput = z.infer<typeof TopUpWalletInputSchema>;

export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.unknown().optional(),
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  error: z.string().optional(),
  code: z.string().optional(),
});

export const PaginatedResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.array(z.unknown()),
  pagination: z.object({
    total: z.number().nonnegative(),
    page: z.number().positive(),
    limit: z.number().positive(),
    totalPages: z.number().nonnegative(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
});

export const AnalyticsMetricsSchema = z.object({
  totalRevenue: z.number().nonnegative(),
  totalOrders: z.number().nonnegative(),
  totalCustomers: z.number().nonnegative(),
  totalESIMs: z.number().nonnegative(),
  growth: z.number(),
  activeESIMs: z.number().nonnegative().optional(),
  expiredESIMs: z.number().nonnegative().optional(),
});

export type AnalyticsMetrics = z.infer<typeof AnalyticsMetricsSchema>;

export const PlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  dataAmount: z.number().positive(),
  dataUnit: z.string(),
  validity: z.number().positive(),
  validityUnit: z.string(),
  price: z.number().nonnegative(),
  originalPrice: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  country: z.string(),
  countryCode: z.string(),
  operatorName: z.string(),
  features: z.array(z.string()),
  isActive: z.boolean(),
});

export type Plan = z.infer<typeof PlanSchema>;

export const AllSchemas = {
  registerInput: RegisterInputSchema,
  loginInput: LoginInputSchema,
  changePasswordInput: ChangePasswordInputSchema,
  updateProfileInput: UpdateProfileInputSchema,
  createOrderInput: CreateOrderInputSchema,
  updateOrderInput: UpdateOrderInputSchema,
  createPaymentInput: CreatePaymentInputSchema,
  createTicketInput: CreateTicketInputSchema,
  addCommunicationInput: AddCommunicationInputSchema,
  topUpWalletInput: TopUpWalletInputSchema,
  successResponse: SuccessResponseSchema,
  errorResponse: ErrorResponseSchema,
  paginatedResponse: PaginatedResponseSchema,
};
