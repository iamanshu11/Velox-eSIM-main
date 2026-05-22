export type UserRole = 'ADMIN' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface Plan {
  id: string;
  packageCode: string;
  name: string;
  description?: string;
  dataAmount: number;
  dataUnit: string;
  validity: number;
  validityUnit: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  country: string;
  countryCode: string;
  region?: string;
  operatorName: string;
  features: string[];
  isActive: boolean;
}

export interface eSIM {
  id: string;
  iccid: string;
  eid?: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'ACTIVATED' | 'SUSPENDED' | 'EXPIRED' | 'DEACTIVATED';
  planId: string;
  plan?: Plan;
  mobileNumber?: string;
  activatedDate?: string;
  expiryDate?: string;
  dataUsed: number;
  operatorName: string;
  countryCode: string;
}

export interface OrderItem {
  id: string;
  planId: string;
  plan?: Plan;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNo: string;
  esimTranNo?: string;
  iccid: string;
  quantity: number;
  status: 'Ready' | 'Active' | 'Suspended' | 'Expired' | 'Disabled' | 'active' | 'CANCELLED';
  costPrice?: number;
  price?: number;
  totalPrice?: number;
  profit?: number;
  createdAt: string;
  profileStatus?: 'RELEASED' | 'ENABLED' | 'DISABLED' | 'SUSPENDED' | 'EXPIRED';
  esimStatus?: string;

  msisdn?: string;
  imsi?: string;
  eid?: string;

  totalVolume?: number;
  dataUsage?: number;
  dataUsagePercent?: number;
  remainingVolume?: number;

  totalDuration?: number;
  durationUnit?: string;
  daysUntilExpiry?: number;

  activatedAt?: string;
  expiresAt?: string;
  profileExpiresAt?: string;
  expiredTime?: string;

  packageCodes?: string;
  smsStatus?: string;
  dataType?: string;

  qrCodeUrl?: string;
  shortUrl?: string;
  ac?: string;
  apn?: string;
  pin?: string;

  plan?: {
    name: string;
    countryCode: string;
  };
  
  packageList?: Array<{
    packageName?: string;
    packageCode: string;
    slug: string;
    duration?: number;
    volume?: number;
    locationCode?: string;
    createTime?: string;
    esimTranNo?: string;
    transactionId?: string;
    code?: string;
    name?: string;
    location?: string;
  }>;

  packages?: Array<{
    code: string;
    name: string;
    volume: number;
    duration?: number;
    location?: string;
  }>;
}

export interface Payment {
  id: string;
  paymentId: string;
  userId: string;
  orderId: string;
  method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'STRIPE' | 'BANK_TRANSFER';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  cardLast4?: string;
  cardBrand?: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
    issuedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  userId: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: string;
  communications?: Communication[];
  assignedTo?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Communication {
  id: string;
  ticketId: string;
  userId: string;
  user?: User;
  message: string;
  attachments: string[];
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface Country {
  name: string;
  code: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface Location {
  code?: string;
  locationCode?: string;
  name: string;
  continent?: string;
  region?: string;
  type?: number;
  subLocationList?: Array<{
    code: string;
    name: string;
  }>;
}

export interface DataPackage {
  packageCode: string;
  slug: string;
  locationCode: string;
  locationName: string;
  dataSize: string;
  dataUnit: string;
  validity: number;
  validityUnit: string;
  price: number;
  description?: string;
}

export interface ESimProfile {
  orderNo: string;
  esimTranNo: string;
  iccid: string;
  uploadUrl?: string;
  status: string;
  statusCode: number;
  activationCode?: string;
  qrCode?: string;
  dataUsed?: number;
  dataTotal?: number;
  validDate?: string;
  invalidDate?: string;
  carrier?: string;
  packageList?: DPPackage[];
  esimStatus?: string;
  orderUsage?: number;
  totalVolume?: number;
  ac?: string;
  qrCodeUrl?: string;
  expiredTime?: string;
  totalDuration?: number;
  durationUnit?: string;
}

export interface DPPackage {
  packageCode: string;
  packageName?: string;
  slug: string;
  dataSize: string;
  dataUnit: string;
  validity: number;
  validityUnit: string;
  price: number;
}

export interface DashboardSummary {
  balance: number;
  recentOrders: ESimProfile[];
  countriesCount: number;
}

export interface AccountInfo {
  accountBalance: number;
  accountName?: string;
  email?: string;
}

export interface AnalyticsMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  growth: number;
  activeEsims?: number;
  expiredEsims?: number;
}

export interface RevenueAnalytics {
  period: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  data: DailyRevenue[];
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

export interface UserGrowth {
  period: string;
  newUsers: number;
  totalUsers: number;
  data: DailyGrowth[];
}

export interface DailyGrowth {
  date: string;
  newUsers: number;
}

export interface PlanPopularity {
  packageCode: string;
  slug: string;
  name: string;
  orders: number;
  revenue: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  failedOrders: number;
  averageOrderValue: number;
  topCountries: CountryOrder[];
}

export interface CountryOrder {
  country: string;
  orders: number;
  revenue: number;
}

export interface PaymentStats {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  totalAmount: number;
  paymentMethods: PaymentMethod[];
}

export interface PaymentMethod {
  method: string;
  count: number;
  amount: number;
}

export interface Settings {
  id: string;
  siteTitle: string;
  siteDescription: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  logo?: string;
  favicon?: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfitMargin {
  id: string;
  margin: number;
  marginType: 'FIXED' | 'PERCENTAGE';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEvent {
  id: string;
  eventType: string;
  payload: Record<string, any>;
  status: 'PENDING' | 'DELIVERED' | 'FAILED';
  retries: number;
  createdAt: string;
  deliveredAt?: string;
}

export interface UploadResponse {
  url: string;
  publicId: string;
  format?: string;
  width?: number;
  height?: number;
  size?: number;
}

export interface Wallet {
  id?: string;
  balance: number;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
}
export function extractApiData<T>(response: ApiResponse<T> | undefined): T | null {
  if (!response || !response.success) return null;
  return response.data ?? null;
}
export function isApiSuccess<T>(response: ApiResponse<T> | undefined): response is ApiResponse<T> & { success: true } {
  return response?.success === true;
}
export function hasApiData<T>(response: ApiResponse<T> | undefined): response is ApiResponse<T> & { data: T } {
  return response?.success === true && response?.data !== undefined;
}
export function getPaginationInfo<T>(response: PaginatedResponse<T> | undefined) {
  return response?.pagination ?? {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  };
}
export function hasNextPage<T>(response: PaginatedResponse<T> | undefined): boolean {
  return response?.pagination?.hasNextPage ?? false;
}
export function hasPreviousPage<T>(response: PaginatedResponse<T> | undefined): boolean {
  return response?.pagination?.hasPrevPage ?? false;
}
export function getTotalPages<T>(response: PaginatedResponse<T> | undefined): number {
  return response?.pagination?.totalPages ?? 0;
}
export function isValidOrderQuantity(quantity: unknown): quantity is number {
  return typeof quantity === 'number' && quantity >= 1 && quantity <= 100 && Number.isInteger(quantity);
}
export function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
export function isStrongPassword(password: unknown): password is string {
  if (typeof password !== 'string' || password.length < 8) return false;
  return (
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*]/.test(password)
  );
}
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}
export function formatDate(date: string | Date, locale: string = 'en-US'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
export function formatDateTime(date: string | Date, locale: string = 'en-US'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
export function isOrderExpired(order: Order): boolean {
  if (!order.expiredTime) return false;
  return new Date(order.expiredTime) < new Date();
}
export function isOrderActive(order: Order): boolean {
  return order.status === 'Active' && !isOrderExpired(order);
}
export function getUserDisplayName(user: User | null | undefined): string {
  return user?.name || user?.email || 'Guest';
}
export function isUserAdmin(user: User | null | undefined): boolean {
  return user?.role === 'ADMIN';
}
export function getPaymentStatusColor(status: string): 'green' | 'yellow' | 'red' | 'gray' {
  switch (status) {
    case 'COMPLETED':
      return 'green';
    case 'PENDING':
      return 'yellow';
    case 'FAILED':
    case 'REFUNDED':
      return 'red';
    default:
      return 'gray';
  }
}
export function getOrderStatusColor(status: string): 'green' | 'yellow' | 'red' | 'gray' {
  switch (status) {
    case 'Active':
    case 'Ready':
      return 'green';
    case 'Suspended':
      return 'yellow';
    case 'Expired':
    case 'Disabled':
      return 'red';
    default:
      return 'gray';
  }
}
