import axios, { AxiosInstance } from "axios";
import { createHash } from "crypto";
import prisma from "@config/database";
import { AppError } from "@utils/errors";
import logger from "@utils/logger";
import { settingsService } from "@modules/settings/settings.service";


export interface ESimAccessResponse<T = unknown> {
  success: boolean;
  errorCode: string | null;
  errorMsg: string | null;
  obj?: T;
}

export interface LocationNetwork {
  locationName: string;
  locationLogo: string;
  operatorList: Array<{
    operatorName: string;
    networkType: string;
  }>;
}

export interface DataPackage {
  packageCode: string;
  slug: string;
  name: string;
  price: number;
  currencyCode: string;
  volume: number;
  smsStatus: number;
  dataType: number;
  unusedValidTime: number;
  duration: number;
  durationUnit: string;
  location: string;
  locationCode?: string;
  description: string;
  activeType: number;
  favorite: boolean;
  retailPrice: number;
  speed: string;
  locationNetworkList: LocationNetwork[];
  operatorList: Array<{
    operatorName: string;
    networkType: string;
  }>;
  ipExport: string;
  supportTopUpType: number;
  fupPolicy?: string;
}

export interface GetPackagesRequest {
  locationCode?: string;
  type?: "BASE" | "TOPUP";
  packageCode?: string;
  slug?: string;
  iccid?: string;
  dataType?: number;
}

export interface GetPackagesResponse {
  packageList: DataPackage[];
}

export interface PackageInfo {
  packageCode: string;
  count: number;
  price?: number;
  periodNum?: number;
}

export interface CreateOrderRequest {
  transactionId: string;
  amount?: number;
  packageInfoList: PackageInfo[];
}

export interface CreateOrderResponse {
  orderNo: string;
  transactionId: string;
}

export interface Point {
  pageNum: number;
  pageSize: number;
  total?: number;
}

export interface PackageDetail {
  packageName: string;
  packageCode: string;
  slug: string;
  duration: number;
  volume: number;
  locationCode: string;
  createTime?: string;
}

export interface ESimProfile {
  esimTranNo: string;
  orderNo: string;
  transactionId?: string;
  imsi?: string;
  iccid: string;
  msisdn?: string;
  smsStatus: number;
  dataType: number;
  ac: string;
  qrCodeUrl: string;
  shortUrl?: string;
  smdpStatus: string;
  eid: string;
  activeType: number;
  dataUsage?: number;
  activateTime?: string;
  expiredTime: string;
  totalVolume: number;
  totalDuration: number;
  durationUnit: string;
  orderUsage: number;
  esimStatus: string;
  pin?: string;
  puk?: string;
  apn?: string;
  packageList: PackageDetail[];
}

export interface QueryProfilesRequest {
  orderNo?: string;
  esimTranNo?: string;
  iccid?: string;
  startTime?: string;
  endTime?: string;
  pager: Point;
}

export interface QueryProfilesResponse {
  esimList: ESimProfile[];
  pager: Point;
}

export interface CancelProfileRequest {
  esimTranNo?: string;
  iccid?: string;
}

export interface SuspendProfileRequest {
  esimTranNo?: string;
  iccid?: string;
}

export interface UnsuspendProfileRequest {
  esimTranNo?: string;
  iccid?: string;
}

export interface RevokeProfileRequest {
  esimTranNo?: string;
  iccid?: string;
}

export interface BalanceQueryResponse {
  balance: number;
}

export interface TopUpRequest {
  esimTranNo?: string;
  iccid?: string;
  packageCode: string;
  transactionId: string;
  amount?: string;
}

export interface TopUpResponse {
  transactionId: string;
  iccid: string;
  expiredTime: string;
  totalVolume: number;
  totalDuration: number;
  orderUsage: number;
}

export interface SetWebhookRequest {
  webhook: string;
}

export interface SendSmsRequest {
  esimTranNo?: string;
  iccid?: string;
  message: string;
}

export interface ESimUsage {
  esimTranNo: string;
  dataUsage: number;
  totalData: number;
  lastUpdateTime: string;
}

export interface UsageCheckRequest {
  esimTranNoList: string[];
}

export interface UsageCheckResponse {
  esimUsageList: ESimUsage[];
}

export interface SubLocation {
  code: string;
  name: string;
}

export interface Location {
  code: string;
  name: string;
  type: number;
  subLocationList?: SubLocation[];
}

export interface SupportedRegionsResponse {
  locationList: Location[];
}

export type WebhookNotifyType =
  | "CHECK_HEALTH"
  | "ORDER_STATUS"
  | "SMDP_EVENT"
  | "ESIM_STATUS"
  | "DATA_USAGE"
  | "VALIDITY_USAGE";

export interface WebhookOrderStatusContent {
  orderNo: string;
  orderStatus: string;
}

export interface WebhookSmdpEventContent {
  eid: string;
  iccid: string;
  esimStatus: string;
  smdpStatus: string;
  orderNo: string;
  esimTranNo: string;
  transactionId: string;
}

export interface WebhookESimStatusContent {
  orderNo: string;
  esimTranNo: string;
  transactionId: string;
  iccid: string;
  esimStatus: string;
  smdpStatus: string;
}

export interface WebhookDataUsageContent {
  orderNo: string;
  transactionId: string;
  esimTranNo: string;
  iccid: string;
  totalVolume: number;
  orderUsage: number;
  remain: number;
  lastUpdateTime: string;
  remainThreshold: number;
}

export interface WebhookValidityUsageContent {
  orderNo: string;
  transactionId: string;
  iccid: string;
  durationUnit: string;
  totalDuration: number;
  expiredTime: string;
  remain: number;
}

export interface WebhookPayload {
  notifyType: WebhookNotifyType;
  eventGenerateTime?: string;
  notifyId?: string;
  content:
    | WebhookOrderStatusContent
    | WebhookSmdpEventContent
    | WebhookESimStatusContent
    | WebhookDataUsageContent
    | WebhookValidityUsageContent
    | Record<string, unknown>;
}

export interface GetPackagesListResponse {
  packageList: DataPackage[];
}

export interface ResellOrderData {
  orderId: string;
  apiOrderNo: string;
  transactionId: string;
  userId: string;
  packageInfoList: PackageInfo[];
  totalAmount: number;
  profitAmount: number;
  costAmount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  eSIMProfiles?: ESimProfile[];
  createdAt: Date;
  completedAt?: Date;
}


const BASE_URL = "https://api.esimaccess.com/api/v1/open";
let apiClient: AxiosInstance | null = null;

const initializeClient = async (): Promise<AxiosInstance> => {
  if (apiClient) {
    return apiClient;
  }

  const settings = await settingsService.getSettings();

  if (!settings.esimAccessCode) {
    throw new AppError(
      500,
      "eSIM Access API credentials not configured. Please set esimAccessCode in settings.",
    );
  }

  const accessCode = settings.esimAccessCode;
  const secretKey = settings.esimSecretKey || "";

  apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
      "Content-Type": "application/json",
      "RT-AccessCode": accessCode,
    },
    timeout: 30000,
  });

  // Add per-request signing interceptor (eSIMaccess requires MD5 auth signature)
  apiClient.interceptors.request.use((config) => {
    if (secretKey) {
      const timestamp = Date.now().toString();
      const signature = createHash("md5")
        .update(`${accessCode}${secretKey}${timestamp}`)
        .digest("hex");
      config.headers["RT-RequestTimestamp"] = timestamp;
      config.headers["RT-Signature"] = signature;
    }
    return config;
  });

  return apiClient;
};

const callAPI = async <T>(endpoint: string, payload: unknown = {}): Promise<T> => {
  try {
    const client = await initializeClient();
    const response = await client.post<ESimAccessResponse<T>>(
      endpoint,
      payload,
    );

    if (!response.data.success) {
      throw new AppError(
        400,
        response.data.errorMsg || `API Error: ${response.data.errorCode}`,
      );
    }

    if (endpoint === "/package/list" && Array.isArray(response.data.obj)) {
      const firstPkg = (response.data.obj as DataPackage[])[0];
      if (firstPkg && process.env.NODE_ENV !== 'production') {
        logger.debug(`[eSIMaccess RAW] /package/list first package:`, {
          packageCode: firstPkg.packageCode,
          price: firstPkg.price,
          priceType: typeof firstPkg.price,
          retailPrice: firstPkg.retailPrice,
          volume: firstPkg.volume,
          duration: firstPkg.duration,
        });
      }
    }

    return response.data.obj as T;
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }

    const errorMsg =
      err instanceof Error
        ? err.message
        : "Unknown error occurred with eSIM Access API";
    logger.error(`[eSIM Access API] Error on ${endpoint}:`, errorMsg);
    throw new AppError(500, errorMsg);
  }
};


export const getAllDataPackages = async (
  filters?: {
    locationCode?: string;
    type?: "BASE" | "TOPUP";
    packageCode?: string;
    slug?: string;
    iccid?: string;
    dataType?: number;
  },
  pageNum: number = 1,
  pageSize: number = 200,
): Promise<DataPackage[]> => {
  const validatedPageSize = Math.max(5, Math.min(500, pageSize));

  const payload: Record<string, unknown> = {
    locationCode: filters?.locationCode || "",
    type: filters?.type || "",
    packageCode: filters?.packageCode || "",
    pager: {
      pageNum,
      pageSize: validatedPageSize,
    },
  };

  if (filters?.slug) payload.slug = filters.slug;
  if (filters?.iccid) payload.iccid = filters.iccid;
  if (filters?.dataType !== undefined) payload.dataType = filters.dataType;

  const result = await callAPI<GetPackagesListResponse>("/package/list", payload);
  return result?.packageList || [];
};

export const getTopUpPackages = async (
  esimTranNo: string,
): Promise<DataPackage[]> => {
  return getAllDataPackages(
    {
      type: "TOPUP",
      iccid: esimTranNo,
    },
    1,
    200,
  );
};


export const createOrder = async (
  request: CreateOrderRequest,
): Promise<CreateOrderResponse> => {
  return callAPI<CreateOrderResponse>("/esim/order", request);
};

export const placeOrder = async (data: {
  packageInfoList: Array<{
    packageCode: string;
    count: number;
    price?: number;
    periodNum?: number;
  }>;
  amount?: number;
}): Promise<CreateOrderResponse> => {
  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return createOrder({
    transactionId,
    amount: data.amount,
    packageInfoList: data.packageInfoList,
  });
};


export const queryESIMProfiles = async (
  pageNum: number = 1,
  pageSize: number = 50,
  filters?: {
    orderNo?: string;
    esimTranNo?: string;
    iccid?: string;
    startTime?: string;
    endTime?: string;
  },
): Promise<QueryProfilesResponse> => {
  const validatedPageSize = Math.max(5, Math.min(500, pageSize));

  const payload: QueryProfilesRequest = {
    orderNo: filters?.orderNo || "",
    esimTranNo: filters?.esimTranNo || "",
    iccid: filters?.iccid || "",
    pager: {
      pageNum,
      pageSize: validatedPageSize,
      total: undefined,
    },
  };

  if (filters?.startTime) payload.startTime = filters.startTime;
  if (filters?.endTime) payload.endTime = filters.endTime;

  return callAPI<QueryProfilesResponse>("/esim/query", payload);
};

export const getProfileByOrderNo = async (
  orderNo: string,
): Promise<ESimProfile[]> => {
  const result = await queryESIMProfiles(1, 50, { orderNo });
  return result.esimList || [];
};

export const getProfileByEsimTranNo = async (
  esimTranNo: string,
): Promise<ESimProfile | undefined> => {
  const result = await queryESIMProfiles(1, 5, { esimTranNo });
  return result.esimList?.[0];
};

export const getProfileByIccid = async (
  iccid: string,
): Promise<ESimProfile | undefined> => {
  const result = await queryESIMProfiles(1, 5, { iccid });
  return result.esimList?.[0];
};


export const cancelESIMProfile = async (
  esimTranNoOrIccid: string,
  isIccid: boolean = false,
): Promise<boolean> => {
  const payload: Record<string, unknown> = {};

  if (isIccid) {
    payload.iccid = esimTranNoOrIccid;
  } else {
    payload.esimTranNo = esimTranNoOrIccid;
  }

  await callAPI("/esim/cancel", payload);
  return true;
};

export const suspendESIMProfile = async (
  esimTranNoOrIccid: string,
  isIccid: boolean = false,
): Promise<boolean> => {
  const payload: Record<string, unknown> = {};

  if (isIccid) {
    payload.iccid = esimTranNoOrIccid;
  } else {
    payload.esimTranNo = esimTranNoOrIccid;
  }

  await callAPI("/esim/suspend", payload);
  return true;
};

export const unsuspendESIMProfile = async (
  esimTranNoOrIccid: string,
  isIccid: boolean = false,
): Promise<boolean> => {
  const payload: Record<string, unknown> = {};

  if (isIccid) {
    payload.iccid = esimTranNoOrIccid;
  } else {
    payload.esimTranNo = esimTranNoOrIccid;
  }

  await callAPI("/esim/unsuspend", payload);
  return true;
};

export const revokeESIMProfile = async (
  esimTranNoOrIccid: string,
  isIccid: boolean = false,
): Promise<boolean> => {
  const payload: Record<string, unknown> = {};

  if (isIccid) {
    payload.iccid = esimTranNoOrIccid;
  } else {
    payload.esimTranNo = esimTranNoOrIccid;
  }

  await callAPI("/esim/revoke", payload);
  return true;
};


export const getAccountBalance = async (): Promise<BalanceQueryResponse> => {
  return callAPI<BalanceQueryResponse>("/balance/query", {});
};

export const getBalanceFormatted = async (): Promise<{
  balance: number;
  currency: string;
}> => {
  const result = await getAccountBalance();
  return {
    balance: result.balance / 10000,
    currency: "USD",
  };
};


export const topupESIM = async (
  request: TopUpRequest,
): Promise<TopUpResponse> => {
  return callAPI<TopUpResponse>("/esim/topup", request);
};

export const topupESIMWithTransactionId = async (data: {
  esimTranNo?: string;
  iccid?: string;
  packageCode: string;
  amount?: number;
}): Promise<TopUpResponse> => {
  const transactionId = `TOPUP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return topupESIM({
    esimTranNo: data.esimTranNo,
    iccid: data.iccid,
    packageCode: data.packageCode,
    transactionId,
    amount: data.amount ? String(data.amount) : undefined,
  });
};


export const setWebhook = async (webhookUrl: string): Promise<boolean> => {
  await callAPI("/webhook/save", {
    webhook: webhookUrl,
  });
  return true;
};

export const getWebhookUrl = async (): Promise<string | null> => {
  try {
    const result = await callAPI<Record<string, unknown>>("/webhook/query", {});
    return (result?.webhook as string) || null;
  } catch {
    return null;
  }
};


export const sendSMSToESIM = async (
  esimTranNoOrIccid: string,
  message: string,
  isIccid: boolean = false,
): Promise<boolean> => {
  const payload: Record<string, unknown> = {
    message,
  };

  if (isIccid) {
    payload.iccid = esimTranNoOrIccid;
  } else {
    payload.esimTranNo = esimTranNoOrIccid;
  }

  await callAPI("/esim/sendSms", payload);
  return true;
};


export const checkDataUsage = async (
  esimTranNoList: string[],
): Promise<UsageCheckResponse> => {
  const payload: UsageCheckRequest = {
    esimTranNoList: esimTranNoList.slice(0, 10),
  };

  return callAPI<UsageCheckResponse>("/esim/usage/query", payload);
};

export const checkESIMUsage = async (
  esimTranNo: string,
): Promise<ESimUsage | undefined> => {
  const result = await checkDataUsage([esimTranNo]);
  return result.esimUsageList?.[0];
};


export const getSupportedLocations = async (): Promise<Location[]> => {
  const result = await callAPI<SupportedRegionsResponse>("/location/list", {});
  return result?.locationList || [];
};

export const getLocationsByType = async (type: number): Promise<Location[]> => {
  const locations = await getSupportedLocations();
  return locations.filter((loc) => loc.type === type);
};

export const getCountries = async (): Promise<Location[]> => {
  return getLocationsByType(1);
};

export const getRegions = async (): Promise<Location[]> => {
  return getLocationsByType(2);
};


export const validateCredentials = async (): Promise<boolean> => {
  try {
    await getAccountBalance();
    return true;
  } catch {
    return false;
  }
};

export const resetClient = (): void => {
  apiClient = null;
};

export const verifyWebhookPayload = (payload: WebhookPayload): boolean => {
  if (!payload.notifyType || !payload.content) {
    return false;
  }
  return true;
};

export const getAccountSummary = async () => {
  const [balance, locations, profilesPage] = await Promise.all([
    getAccountBalance(),
    getSupportedLocations(),
    queryESIMProfiles(1, 5),
  ]);

  return {
    balance: balance.balance / 10000,
    totalLocations: locations.length,
    totalProfiles: profilesPage.pager.total || 0,
  };
};

export const getAllProfiles = async (
  pageSize: number = 100,
): Promise<ESimProfile[]> => {
  const allProfiles: ESimProfile[] = [];
  let pageNum = 1;
  let totalPages = 1;

  while (pageNum <= totalPages) {
    const result = await queryESIMProfiles(pageNum, pageSize);
    allProfiles.push(...result.esimList);

    totalPages = Math.ceil((result.pager.total || 0) / pageSize);
    pageNum++;
  }

  return allProfiles;
};

export const getAllPackages = async (
  pageSize: number = 200,
): Promise<DataPackage[]> => {
  const allPackages: DataPackage[] = [];
  let pageNum = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await getAllDataPackages({}, pageNum, pageSize);

    if (result.length === 0) {
      hasMore = false;
    } else {
      allPackages.push(...result);
      pageNum++;
    }
  }

  return allPackages;
};


export class ESimService {

  async getOrdersWithPricing(pageNum: number = 1, pageSize: number = 50) {
    const TIMEOUT_MS = 10000;
    
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Order fetching timeout - API took too long')), TIMEOUT_MS)
      );

      const response = await Promise.race([
        queryESIMProfiles(pageNum, pageSize),
        timeoutPromise
      ]) as {esimList?: Array<{esimStatus?: string}>; pager?: {total?: number}};

      if (!response.esimList || response.esimList.length === 0) {
        return {
          orders: [],
          pagination: {
            pageNum,
            pageSize,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
        };
      }

      const settings = await settingsService.getSettings();
      
      if (!settings || !settings.profitMargin) {
        throw new Error("Profit margin not configured in settings");
      }
      
      const profitMargin = settings.profitMargin;

      const orders = await Promise.allSettled(
        response.esimList.map(async (profile) => {
          try {
            const castProfile = profile as ESimProfile;
            const costPrice = await this.getRealPackageCost(castProfile);
            const sellingPrice = costPrice * profitMargin;
            const profit = sellingPrice - costPrice;

            const orderTimestamp =
              castProfile.packageList?.[0]?.createTime ||
              castProfile.activateTime ||
              castProfile.expiredTime;

            return {
              id: castProfile.esimTranNo || castProfile.orderNo,
              orderNo: castProfile.orderNo,
              esimTranNo: castProfile.esimTranNo,
              iccid: castProfile.iccid,
              quantity: 1,
              status: this.normalizeStatus(castProfile.esimStatus),
              costPrice: parseFloat(costPrice.toFixed(2)),
              totalPrice: parseFloat(sellingPrice.toFixed(2)),
              profit: parseFloat(profit.toFixed(2)),
              createdAt: this.formatTimestamp(orderTimestamp),
              profileStatus: castProfile.smdpStatus,
              totalVolume: castProfile.totalVolume,
              totalDuration: castProfile.totalDuration,
              durationUnit: castProfile.durationUnit,
              expiredTime: castProfile.expiredTime,
              packageList: castProfile.packageList,
            };
          } catch (profileError) {
            logger.warn(`[ESimService] Error processing individual profile:`, profileError);
            const castProfile = profile as ESimProfile;
            return {
              id: castProfile.esimTranNo || castProfile.orderNo,
              orderNo: castProfile.orderNo,
              esimTranNo: castProfile.esimTranNo,
              iccid: castProfile.iccid,
              quantity: 1,
              status: this.normalizeStatus(castProfile.esimStatus),
              costPrice: 0,
              totalPrice: 0,
              profit: 0,
              createdAt: this.formatTimestamp(castProfile.expiredTime),
              profileStatus: castProfile.smdpStatus,
              totalVolume: castProfile.totalVolume,
              totalDuration: castProfile.totalDuration,
              durationUnit: castProfile.durationUnit,
              expiredTime: castProfile.expiredTime,
              packageList: castProfile.packageList,
            };
          }
        }),
      );

      const successfulOrders = orders
        .filter((result) => result.status === 'fulfilled')
        .map((result) => (result as PromiseFulfilledResult<unknown>).value);

      const total = response.pager?.total || response.esimList.length;
      const totalPages = Math.ceil(total / pageSize);
      const hasMore = pageNum < totalPages;

      return {
        orders: successfulOrders,
        pagination: {
          pageNum,
          pageSize,
          total,
          totalPages,
          hasMore,
        },
      };
    } catch (error) {
      logger.error("[ESimService] Error fetching orders:", error);
      throw error;
    }
  }

  private fallbackPricingEstimate(profile: ESimProfile): number {
    const totalDataGB = (profile.totalVolume || 0) / (1024 * 1024 * 1024);
    const totalDays = profile.totalDuration || 30;

    let costPerGB = 0.89;

    if (totalDataGB <= 0.5) {
      costPerGB = 1.0;
    } else if (totalDataGB <= 1) {
      costPerGB = 0.89;
    } else if (totalDataGB <= 2) {
      costPerGB = 0.75;
    } else if (totalDataGB <= 3) {
      costPerGB = 0.667;
    } else if (totalDataGB <= 5) {
      costPerGB = 0.6;
    } else if (totalDataGB <= 10) {
      costPerGB = 0.5;
    }

    if (totalDays <= 7) {
      costPerGB *= 0.33;
    } else if (totalDays <= 14) {
      costPerGB *= 0.6;
    }

    return Math.max(totalDataGB * costPerGB, 0.1);
  }

  private normalizeStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      CREATE: "Pending",
      PAYING: "Paying",
      PAID: "Paid",
      GETTING_RESOURCE: "Allocating",
      GOT_RESOURCE: "Ready",
      IN_USE: "Active",
      USED_UP: "Expired",
      USED_EXPIRED: "Expired",
      CANCEL: "Cancelled",
      REVOKE: "Revoked",
      SUSPEND: "Suspended",
    };

    return statusMap[status] || status;
  }

  private formatTimestamp(timestamp?: string): string {
    if (!timestamp) {
      return new Date().toISOString();
    }

    try {
      const date = new Date(timestamp);

      const formatter = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Dhaka",
      });

      const parts = formatter.formatToParts(date);
      const result: Record<string, unknown> = {};
      parts.forEach((part) => {
        result[part.type] = part.value;
      });

      return `${result.year}-${result.month}-${result.day} ${result.hour}:${result.minute}:${result.second}`;
    } catch {
      return new Date().toISOString();
    }
  }

  private async getRealPackageCost(profile: ESimProfile): Promise<number> {
    if (!profile?.packageList || profile.packageList.length === 0) {
      logger.warn(
        `[ESimService] Profile ${profile.orderNo} has no packageList`,
      );
      return 0.1;
    }

    const packageInfo = profile.packageList[0];
    const packageCode = packageInfo.packageCode;

    try {
      const result = await getAllDataPackages({ packageCode }, 1, 1);
      if (result && result.length > 0) {
        const pkg = result[0];
        const costUSD = pkg.price / 10000;
        return Math.max(costUSD, 0.1);
      }
    } catch (error) {
      logger.warn(
        `[ESimService] Real-time API lookup failed for ${packageCode}:`,
        error,
      );
    }

    logger.warn(
      `[ESimService] Using fallback pricing for package ${packageCode}`,
    );
    return this.fallbackPricingEstimate(profile);
  }

  async getOrderByOrderNo(orderNo: string) {
    try {
      const response = await queryESIMProfiles(1, 100, { orderNo });

      if (!response.esimList || response.esimList.length === 0) {
        return null;
      }

      const profile = response.esimList[0];
      const settings = await settingsService.getSettings();
      
      if (!settings || !settings.profitMargin) {
        throw new Error("Profit margin not configured in settings");
      }
      
      const profitMargin = settings.profitMargin;

      const costPrice = await this.getRealPackageCost(profile);
      const sellingPrice = costPrice * profitMargin;

      const orderTimestamp =
        profile.packageList?.[0]?.createTime || profile.activateTime;

      return {
        id: profile.esimTranNo || profile.orderNo,
        orderNo: profile.orderNo,
        esimTranNo: profile.esimTranNo,
        iccid: profile.iccid,
        quantity: 1,
        status: this.normalizeStatus(profile.esimStatus),
        costPrice: parseFloat(costPrice.toFixed(2)),
        totalPrice: parseFloat(sellingPrice.toFixed(2)),
        profit: parseFloat((sellingPrice - costPrice).toFixed(2)),
        createdAt: this.formatTimestamp(orderTimestamp),
        profileStatus: profile.smdpStatus,
        totalVolume: profile.totalVolume,
        expiredTime: profile.expiredTime,
        packageList: profile.packageList,
      };
    } catch (error) {
      logger.error("[ESimService] Error fetching order:", error);
      throw error;
    }
  }

  async getPackages(locationCode?: string) {
    return getAllDataPackages({ locationCode }, 1, 200);
  }
private transformProfileToDetail(
    profile: ESimProfile,
    transactionAmount?: number,
    countryCode?: string,
    createdAt?: string,
    liveUsage?: ESimUsage
  ) {
    const packageCodes = Array.from(
      new Set(
        profile.packageList?.map((pkg: PackageDetail) => pkg.packageCode) || []
      )
    ).join(", ");

    const dataUsage = liveUsage?.dataUsage ?? profile.dataUsage ?? 0;
    const rawDataUsagePercent = profile.totalVolume > 0 
      ? Math.round((dataUsage / profile.totalVolume) * 100)
      : 0;
    const dataUsagePercent = Math.max(0, Math.min(100, rawDataUsagePercent));

    return {
      id: profile.esimTranNo || profile.orderNo,
      orderNo: profile.orderNo,
      esimTranNo: profile.esimTranNo,

      iccid: profile.iccid,
      msisdn: profile.msisdn || undefined,
      imsi: profile.imsi || undefined,
      eid: profile.eid || undefined,

      status: this.normalizeStatus(profile.esimStatus),
      esimStatus: profile.esimStatus,
      profileStatus: profile.smdpStatus,

      packageCodes: packageCodes || "Unknown",
      smsStatus: profile.smsStatus === 1 ? "Enabled" : "Disabled",
      dataType: profile.dataType === 1 ? "4G" : "LTE",

      totalVolume: profile.totalVolume,
      dataUsage,
      dataUsagePercent: dataUsagePercent,
      remainingVolume: Math.max(0, profile.totalVolume - dataUsage),

      totalDuration: profile.totalDuration,
      durationUnit: profile.durationUnit,

      activatedAt: profile.activateTime,
      expiresAt: this.calculatePackageExpiryDate(profile.activateTime, profile.totalDuration, profile.durationUnit),
      profileExpiresAt: profile.expiredTime,
      daysUntilExpiry: this.calculateDaysUntilExpiry(
        this.calculatePackageExpiryDate(profile.activateTime, profile.totalDuration, profile.durationUnit)
      ),

      qrCodeUrl: profile.qrCodeUrl,
      shortUrl: profile.shortUrl,
      ac: profile.ac,

      apn: profile.apn || undefined,
      pin: profile.pin || undefined,

      price: transactionAmount,

      createdAt: createdAt,
      plan: {
        name: profile.packageList?.[0]?.packageName || `${(profile.totalVolume / (1024 * 1024 * 1024)).toFixed(1)}GB ${profile.totalDuration}${profile.durationUnit}`,
        countryCode: countryCode || 'GLOBAL',
      },

      packages: profile.packageList?.map((pkg: PackageDetail) => ({
        code: pkg.packageCode,
        name: pkg.slug,
        volume: pkg.volume,
        duration: pkg.duration,
        location: pkg.locationCode,
      })) || [],
    };
  }
private calculatePackageExpiryDate(
    activateTime?: string,
    totalDuration?: number,
    durationUnit?: string
  ): string | undefined {
    if (activateTime && totalDuration && durationUnit === 'DAY') {
      try {
        const activateDate = new Date(activateTime);
        activateDate.setDate(activateDate.getDate() + totalDuration);
        return activateDate.toISOString();
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
private calculateDaysUntilExpiry(expiredTime?: string): number {
    if (!expiredTime) return 0;
    try {
      const expiryDate = new Date(expiredTime);
      const now = new Date();
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    } catch {
      return 0;
    }
  }

  async getUserMyESIMs(userId: string, pageNum: number = 1, pageSize: number = 50) {
    try {
      logger.info('[getUserMyESIMs] Starting fetch', { userId, pageNum, pageSize });
      
      const orders = await prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      });

      let total = await prisma.order.count({ where: { userId } });
      logger.info('[getUserMyESIMs] Found orders in database', { userId, count: orders.length, total });

      if (orders.length === 0 && total === 0) {
        logger.info(`[getUserMyESIMs] No orders found for user ${userId}, checking transactions`);
        
        const transactions = await prisma.transaction.findMany({
          where: { 
            userId,
            transactionType: 'ESIM_PURCHASE',
            status: 'completed',
          },
          orderBy: { createdAt: 'desc' },
          skip: (pageNum - 1) * pageSize,
          take: pageSize,
        });

        total = await prisma.transaction.count({
          where: { 
            userId,
            transactionType: 'ESIM_PURCHASE',
            status: 'completed',
          },
        });

        logger.info('[getUserMyESIMs] Found transactions', { userId, count: transactions.length, total });

        if (transactions.length === 0) {
          logger.info(`[getUserMyESIMs] No transactions found for user ${userId}, returning empty list`);
          return {
            orders: [],
            pagination: {
              pageNum,
              pageSize,
              total: 0,
              totalPages: 0,
              hasMore: false,
            },
          };
        }

        const enrichedOrders = await Promise.all(
          transactions.map(async (txn) => {
            const metadata = txn.metadata as Record<string, unknown> | null;
            const esimOrderNo = metadata?.esimOrderNo as string || txn.id;
            
            try {
              if (esimOrderNo && esimOrderNo !== txn.id) {
                const profiles = await getProfileByOrderNo(esimOrderNo);
                if (profiles && profiles.length > 0) {
                  const profile = profiles[0];
                  return this.transformProfileToDetail(
                    profile,
                    txn.amount,
                    metadata?.countryCode as string,
                    txn.createdAt.toISOString()
                  );
                }
              }
            } catch (err) {
              logger.warn(`[getUserMyESIMs] Failed to fetch profile for transaction ${txn.id}:`, err);
            }

            return {
              id: txn.id,
              orderNo: esimOrderNo,
              status: 'active',
              price: txn.amount,
              currency: 'USD',
              paymentStatus: 'paid',
              createdAt: txn.createdAt.toISOString(),
              plan: {
                name: 'eSIM Purchase',
                countryCode: metadata?.countryCode as string || 'GLOBAL',
              },
            };
          })
        );

        const totalPages = Math.ceil(total / pageSize);
        logger.info('[getUserMyESIMs] Returning enriched transactions', { userId, totalPages, pageNum });
        return {
          orders: enrichedOrders,
          pagination: {
            pageNum,
            pageSize,
            total,
            totalPages,
            hasMore: pageNum < totalPages,
          },
        };
      }

      if (orders.length === 0) {
        logger.info('[getUserMyESIMs] No orders on current page, returning empty', { userId, pageNum });
        return {
          orders: [],
          pagination: {
            pageNum,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            hasMore: false,
          },
        };
      }

      logger.info('[getUserMyESIMs] Fetching settings for profit margin', { userId });
      const settings = await settingsService.getSettings();
      if (!settings || !settings.profitMargin) {
        const errorMsg = "Profit margin not configured in settings";
        logger.error('[getUserMyESIMs] ' + errorMsg, { userId });
        throw new Error(errorMsg);
      }

      const profitMargin = settings.profitMargin;
      logger.info('[getUserMyESIMs] Got profit margin', { userId, profitMargin });

      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          try {
            const metadata = (order.metadata as Record<string, unknown>) || {};
            const externalOrderNo = metadata?.externalOrderNo as string;
            
            if (externalOrderNo) {
              logger.info(`[getUserMyESIMs] Fetching profile for externalOrderNo: ${externalOrderNo}`, { orderId: order.id });
              const profiles = await getProfileByOrderNo(externalOrderNo);
              
              if (profiles && profiles.length > 0) {
                const profile = profiles[0];
                logger.info(`[getUserMyESIMs] ✓ Found profile for order`, { 
                  orderId: order.id, 
                  iccid: profile.iccid,
                  dataUsage: profile.dataUsage,
                  totalVolume: profile.totalVolume,
                });
                
                const costPrice = await this.getRealPackageCost(profile);
                const sellingPrice = costPrice * profitMargin;
                const profit = sellingPrice - costPrice;

                const liveUsage = profile.esimTranNo
                  ? await checkESIMUsage(profile.esimTranNo).catch(() => undefined)
                  : undefined;

                const details = this.transformProfileToDetail(
                  profile,
                  parseFloat(sellingPrice.toFixed(2)),
                  metadata?.countryCode as string,
                  order.createdAt.toISOString(),
                  liveUsage
                );

                logger.info(`[getUserMyESIMs] Transformed profile details`, {
                  orderId: order.id,
                  dataUsagePercent: details.dataUsagePercent,
                  dataUsage: details.dataUsage,
                  totalVolume: details.totalVolume,
                  liveUsageLastUpdate: liveUsage?.lastUpdateTime,
                });

                return {
                  ...details,
                  costPrice: parseFloat(costPrice.toFixed(2)),
                  profit: parseFloat(profit.toFixed(2)),
                };
              } else {
                logger.warn(`[getUserMyESIMs] No profile found for externalOrderNo: ${externalOrderNo}`, { orderId: order.id });
                return {
                  id: order.id,
                  orderNo: order.orderNo,
                  status: order.status,
                  esimStatus: undefined,
                  profileStatus: undefined,
                  totalPrice: order.totalAmount || 0,
                  currency: order.currency,
                  paymentStatus: order.paymentStatus,
                  createdAt: order.createdAt.toISOString(),
                  plan: {
                    name: 'eSIM Order',
                    countryCode: (order.metadata as Record<string, unknown>)?.countryCode || 'GLOBAL',
                  },
                  dataUsagePercent: 0,
                  dataUsage: 0,
                  totalVolume: 0,
                  remainingVolume: 0,
                };
              }
            } else {
              logger.warn(`[getUserMyESIMs] No externalOrderNo in metadata for order`, { orderId: order.id, metadata });
              return {
                id: order.id,
                orderNo: order.orderNo,
                status: order.status,
                esimStatus: undefined,
                profileStatus: undefined,
                totalPrice: order.totalAmount || 0,
                currency: order.currency,
                paymentStatus: order.paymentStatus,
                createdAt: order.createdAt.toISOString(),
                plan: {
                  name: 'eSIM Order',
                  countryCode: (order.metadata as Record<string, unknown>)?.countryCode || 'GLOBAL',
                },
                dataUsagePercent: 0,
                dataUsage: 0,
                totalVolume: 0,
                remainingVolume: 0,
              };
            }
          } catch (err) {
            logger.warn(`[getUserMyESIMs] Failed to fetch profile for order ${order.orderNo}:`, { error: err instanceof Error ? err.message : String(err) });
            return {
              id: order.id,
              esimStatus: undefined,
              profileStatus: undefined,
              totalPrice: order.totalAmount || 0,
              currency: order.currency,
              paymentStatus: order.paymentStatus,
              createdAt: order.createdAt.toISOString(),
              plan: {
                name: 'eSIM Order',
                countryCode: (order.metadata as Record<string, unknown>)?.countryCode || 'GLOBAL',
              },
              dataUsagePercent: 0,
              dataUsage: 0,
              totalVolume: 0,
              remainingVolume: 0,
            };
          }

          logger.info(`[getUserMyESIMs] Unexpected: fell through all conditions`, { orderId: order.id, orderNo: order.orderNo });
          return {
            id: order.id,
            orderNo: order.orderNo,
            status: order.status,
            esimStatus: undefined,
            profileStatus: undefined,
            totalPrice: order.totalAmount || 0,
            currency: order.currency,
            paymentStatus: order.paymentStatus,
            createdAt: order.createdAt.toISOString(),
            plan: {
              name: 'eSIM Order',
              countryCode: (order.metadata as Record<string, unknown>)?.countryCode || 'GLOBAL',
            },
            dataUsagePercent: 0,
            dataUsage: 0,
            totalVolume: 0,
            remainingVolume: 0,
          };
        }),
      );

      const totalPages = Math.ceil(total / pageSize);
      logger.info('[getUserMyESIMs] Returning enriched orders', { userId, totalPages, pageNum, count: enrichedOrders.length });

      return {
        orders: enrichedOrders,
        pagination: {
          pageNum,
          pageSize,
          total,
          totalPages,
          hasMore: pageNum < totalPages,
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      logger.error('[getUserMyESIMs] Error fetching user eSIMs', { 
        userId,
        error: errorMsg, 
        errorType: error instanceof Error ? 'Error' : typeof error,
        fullError: error,
      });
      throw error;
    }
  }

  async placeOrder(orderData: {
    packageCode: string;
    quantity: number;
    transactionId: string;
  }) {
    return createOrder({
      transactionId: orderData.transactionId,
      packageInfoList: [
        {
          packageCode: orderData.packageCode,
          count: orderData.quantity,
        },
      ],
    });
  }
async getPopularPackages(limit: number = 12) {
    try {
      const db = await import('@config/database').then(m => m.db);
      const { settingsService } = await import('@modules/settings/settings.service');
      
      const allPackages = await getAllDataPackages();
      
      if (!Array.isArray(allPackages) || allPackages.length === 0) {
        return [];
      }

      const settings = await settingsService.getSettings();
      const profitMargin = settings?.profitMargin || 1.5;

      const orders = await db.order.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          status: {
            in: ['completed', 'active'],
          },
        },
        select: {
          metadata: true,
        },
      });

      const packageCounts: Record<string, number> = {};
      orders.forEach(order => {
        const packageCode = (order.metadata as Record<string, unknown>)?.packageCode;
        if (packageCode && typeof packageCode === 'string') {
          packageCounts[packageCode] = (packageCounts[packageCode] || 0) + 1;
        }
      });

      const topPackageCodes = Object.entries(packageCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([code]) => code);

      const popularPackages = topPackageCodes
        .map(code => {
          const pkg = allPackages.find(p => p.packageCode === code);
          const wholesaleCents = pkg ? Math.round(pkg.price / 100) : 0;
          return {
            ...pkg,
            purchaseCount: packageCounts[code],
            wholesalePrice: wholesaleCents,
            price: pkg ? Math.round(wholesaleCents * profitMargin) : 0,
          };
        })
        .filter(pkg => pkg.packageCode);

      if (popularPackages.length < limit) {
        const usedCodes = new Set(popularPackages.map(p => p.packageCode));
        const additionalPackages = allPackages
          .filter(pkg => !usedCodes.has(pkg.packageCode))
          .sort((a, b) => (a.price || 0) - (b.price || 0))
          .slice(0, limit - popularPackages.length)
          .map(pkg => {
            const wholesaleCents = Math.round(pkg.price / 100);
            return {
              ...pkg,
              purchaseCount: 0,
              wholesalePrice: wholesaleCents,
              price: Math.round(wholesaleCents * profitMargin),
            };
          });

        return [...popularPackages, ...additionalPackages];
      }

      return popularPackages.slice(0, limit);
    } catch (error) {
      logger.error('[ESimService] Error getting popular packages:', error);
      try {
        const allPackages = await getAllDataPackages();
        const { settingsService } = await import('@modules/settings/settings.service');
        const settings = await settingsService.getSettings();
        const profitMargin = settings?.profitMargin || 1.5;

        return Array.isArray(allPackages)
          ? allPackages
              .sort((a, b) => (a.price || 0) - (b.price || 0))
              .slice(0, limit)
              .map(pkg => {
                const wholesaleCents = Math.round(pkg.price / 100);
                return {
                  ...pkg,
                  purchaseCount: 0,
                  wholesalePrice: wholesaleCents,
                  price: Math.round(wholesaleCents * profitMargin),
                };
              })
          : [];
      } catch {
        return [];
      }
    }
  }

  async getPackagesByRegion(specificRegion?: string, limit: number = 100) {
    try {
      const { settingsService } = await import('@modules/settings/settings.service');

      const REGIONAL_BUNDLES: Record<string, string> = {
        'Africa (25+ areas)': 'AF-29',

        'Asia (20 areas)': 'AS-20',
        'Asia (12 areas)': 'AS-12',
        'Asia (7 areas)': 'AS-7',

        'Central Asia (4 areas)': 'CA-4',

        'Europe (42 areas)': 'EU-42',
        'Europe (35 areas)': 'EU-35',
        'Europe (30 areas)': 'EU-30',

        'Global (130+ areas)': 'GL-139',
        'Global (120+ areas)': 'GL-120',

        'Middle East & North Africa': 'ME-12',
        'Middle East (13 areas)': 'ME-13',
        'Gulf Region (6 areas)': 'ME-6',

        'North America (3 areas)': 'NA-3',
        'South America (18 areas)': 'SA-18',
        'Caribbean (20+ areas)': 'CB-25',
      };

      const packagesByRegion: Record<string, DataPackage[]> = {};
      const settings = await settingsService.getSettings();
      const profitMargin = settings?.profitMargin || 1.5;

      const regionsToFetch = specificRegion 
        ? [specificRegion]
        : Object.keys(REGIONAL_BUNDLES);

      for (const regionName of regionsToFetch) {
        const locationCode = REGIONAL_BUNDLES[regionName];
        
        if (!locationCode) {
          logger.warn(`[RegionalPackages] Region ${regionName} not mapped to location code`);
          continue;
        }

        try {
          const packages = await getAllDataPackages({
            locationCode,
            type: undefined,
            packageCode: '',
            slug: '',
            iccid: '',
            dataType: undefined,
          }, 1, limit);

          if (Array.isArray(packages) && packages.length > 0) {
            packagesByRegion[regionName] = packages
              .sort((a, b) => (a.price as number) - (b.price as number))
              .map(pkg => {
                // API price is in 1/10000 USD units; divide by 100 → cents, then apply margin
                const wholesaleCents = Math.round((pkg.price as number) / 100);
                const newPrice = Math.round(wholesaleCents * profitMargin);
                return {
                  ...pkg,
                  wholesalePrice: wholesaleCents,
                  price: newPrice,
                  region: regionName,
                };
              });
          }
        } catch (err) {
          logger.warn(`[RegionalPackages] Error fetching packages for ${regionName} (${locationCode}):`, 
            err instanceof Error ? err.message : String(err));
          packagesByRegion[regionName] = [];
        }
      }

      if (specificRegion) {
        return packagesByRegion[specificRegion] || [];
      }

      return packagesByRegion;
    } catch (error) {
      logger.error('[ESimService] Error getting packages by region:', error);
      return specificRegion ? [] : {};
    }
  }
}


export const esimAccessService = {
  getAllDataPackages,
  getTopUpPackages,
  createOrder,
  placeOrder,
  queryESIMProfiles,
  getProfileByOrderNo,
  getProfileByEsimTranNo,
  getProfileByIccid,
  getAllProfiles,
  cancelESIMProfile,
  suspendESIMProfile,
  unsuspendESIMProfile,
  revokeESIMProfile,
  getAccountBalance,
  getBalanceFormatted,
  topupESIM,
  topupESIMWithTransactionId,
  setWebhook,
  getWebhookUrl,
  sendSMSToESIM,
  checkDataUsage,
  checkESIMUsage,
  getSupportedLocations,
  getLocationsByType,
  getCountries,
  getRegions,
  getAllPackages,
  validateCredentials,
  resetClient,
  verifyWebhookPayload,
  getAccountSummary,
};

export const esimService = new ESimService();
export default esimService;
