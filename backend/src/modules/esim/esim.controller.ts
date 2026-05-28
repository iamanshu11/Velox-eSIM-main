import { Request, Response } from "express";
import { asyncHandler } from "@utils/errors";
import { sendSuccess, sendError } from "@utils/response";
import { esimAccessService } from "./esim.service";
import { settingsService } from "@modules/settings/settings.service";

interface DataPackage extends Record<string, unknown> {
  price?: number;
  volume?: number;
  duration?: number;
  packageName?: string;
  packageCode?: string;
  locationName?: string;
  locationCode?: string;
}

export const validateESIMAccessCredentials = asyncHandler(
  async (req: Request, res: Response) => {
    const isValid = await esimAccessService.validateCredentials();
    return sendSuccess(res, "Credentials validated", { valid: isValid });
  },
);
export const getAccountBalance = asyncHandler(
  async (req: Request, res: Response) => {
    const balance = await esimAccessService.getAccountBalance();
    return sendSuccess(res, "Balance fetched successfully", balance);
  },
);

export const getAccountSummary = asyncHandler(
  async (req: Request, res: Response) => {
    const summary = await esimAccessService.getAccountSummary();
    return sendSuccess(res, "Account summary fetched", summary);
  },
);

// API returns price in 1/10000 USD units (10000 = $1.00).
// Divide by 100 to convert to cents, then apply margin to get retail cents.
const applyProfitMarginToPackage = (pkg: DataPackage, margin: number): Record<string, unknown> => {
  const wholesaleCents = Math.round((pkg.price as number) / 100);
  const retailCents = Math.round(wholesaleCents * margin);
  return {
    ...pkg,
    wholesalePrice: wholesaleCents,
    price: retailCents,
  };
};

export const getAllDataPackages = asyncHandler(
  async (req: Request, res: Response) => {
    const { country, limit = 20, page = 1 } = req.query;

    if (!country || typeof country !== 'string') {
      return sendError(res, 'Country code is required', undefined, 400);
    }

    const settings = await settingsService.getSettings();
    
    if (!settings || !settings.profitMargin) {
      return sendError(res, "Configuration Error", "Profit margin not configured", 500);
    }
    
    const profitMargin = settings.profitMargin;

    const packages = await esimAccessService.getAllDataPackages({
      locationCode: country.toUpperCase(),
    });

    const arrayPackages = Array.isArray(packages) ? packages : [];
    
    const packagesWithMargin = (arrayPackages as unknown as DataPackage[]).map(pkg => 
      applyProfitMarginToPackage(pkg, profitMargin)
    );
    
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const pageNum = Math.max(parseInt(page as string) || 1, 1);
    const startIdx = (pageNum - 1) * limitNum;
    
    const paginatedPackages = packagesWithMargin.slice(startIdx, startIdx + limitNum);

    return sendSuccess(res, 'Packages fetched', {
      data: paginatedPackages,
      pagination: {
        total: packagesWithMargin.length,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(packagesWithMargin.length / limitNum),
      },
    });
  },
);

