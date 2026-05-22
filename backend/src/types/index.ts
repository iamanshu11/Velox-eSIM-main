import { Request } from 'express';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface CustomUser {
  userId: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: CustomUser;
  cookies: Record<string, string>;
  body: Record<string, unknown>;
}

export interface PaginationQuery {
  page: number;
  limit: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface FilterQuery {
  [key: string]: unknown;
}

export interface ApiError {
  code: string;
  statusCode: number;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message: string;
}

export type ApiResponseData<T> = ApiResponse<T>;
export interface OrderData {
  id: string;
  userId: string;
  orderNo: string;
  esimOrderId: string;
  iccid: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderListResponse {
  orders: OrderData[];
  total: number;
  page: number;
  limit: number;
}
export interface PaymentData {
  id: string;
  userId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  transactionId: string;
  createdAt: Date;
}

export interface PaymentListResponse {
  payments: PaymentData[];
  total: number;
  page: number;
  limit: number;
}
export interface ESIMData {
  id: string;
  iccid: string;
  msisdn?: string;
  imsi?: string;
  operatorName: string;
  countryCode: string;
  dataVolume: number;
  dataUsed: number;
  validityDays: number;
  status: string;
  activatedAt?: Date;
  expiresAt?: Date;
}

export interface ESIMListResponse {
  esims: ESIMData[];
  total: number;
  page: number;
  limit: number;
}
export interface AnalyticsMetrics {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalESIMs: number;
  ordersByStatus?: Record<string, number>;
  revenueByCountry?: Record<string, number>;
  topCountries?: Array<{ country: string; count: number }>;
}
export interface HttpErrorResponse {
  success: false;
  message: string;
  error: string;
  code?: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

declare global {
  namespace Express {
    interface Request {
      user?: CustomUser;
    }
  }
}
export enum ESIMStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  REVOKED = 'REVOKED',
  CANCELLED = 'CANCELLED',
}
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ACTIVATED = 'ACTIVATED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}
export interface WebhookContent {
  [key: string]: string | number | boolean | undefined;
  esimOrderId?: string;
  orderNo?: string;
  esimTranNo?: string;
  iccid?: string;
  status?: string;
  dataUsed?: number;
  dataRemaining?: number;
  expiryDate?: string;
  daysRemaining?: number;
  smdpEvent?: string;
  smdpStatus?: string;
}
