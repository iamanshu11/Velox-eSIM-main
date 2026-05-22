import axios from 'axios';
import type { Request } from 'express';
import { getCountryName } from '@/lib/countryMap';

export interface CountryLocation {
  countryCode: string;
  countryName: string;
  source: 'header' | 'ip';
  ip?: string;
}

const COUNTRY_HEADER_KEYS = [
  'cf-ipcountry',
  'cf-connecting-ipcountry',
  'x-vercel-ip-country',
  'x-country-code',
  'x-geo-country-code',
  'x-appengine-country',
] as const;

const IP_HEADER_KEYS = [
  'cf-connecting-ip',
  'x-forwarded-for',
  'x-real-ip',
  'x-client-ip',
  'true-client-ip',
] as const;

const normalizeCountryCode = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toUpperCase();
  if (!normalized || normalized.length !== 2 || ['XX', 'ZZ', 'UNKNOWN', 'N/A', '-'].includes(normalized)) {
    return null;
  }

  return normalized;
};

const normalizeIp = (value: string | null | undefined): string | null => {
  if (!value) return null;

  const cleaned = value.replace(/^::ffff:/, '').trim();
  if (!cleaned || cleaned === '::1' || cleaned === '127.0.0.1' || cleaned.toLowerCase() === 'localhost') {
    return null;
  }

  return cleaned;
};

const isPrivateIp = (ip: string): boolean => {
  return (
    /^10\./.test(ip) ||
    /^127\./.test(ip) ||
    /^192\.168\./.test(ip) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) ||
    /^169\.254\./.test(ip) ||
    ip === '::1' ||
    ip.startsWith('fc00:') ||
    ip.startsWith('fd00:')
  );
};

const getHeaderCountry = (req: Request): CountryLocation | null => {
  for (const key of COUNTRY_HEADER_KEYS) {
    const value = req.headers[key] ?? req.headers[key.toLowerCase()];
    const countryCode = normalizeCountryCode(Array.isArray(value) ? value[0] : value);

    if (countryCode) {
      return {
        countryCode,
        countryName: getCountryName(countryCode),
        source: 'header',
      };
    }
  }

  return null;
};

const getClientIp = (req: Request): string | null => {
  const headerIp = IP_HEADER_KEYS.reduce<string | null>((candidate, key) => {
    if (candidate) {
      return candidate;
    }

    const value = req.headers[key] ?? req.headers[key.toLowerCase()];
    const normalizedValue = Array.isArray(value) ? value[0] : value;

    if (typeof normalizedValue !== 'string' || !normalizedValue.trim()) {
      return null;
    }

    return key === 'x-forwarded-for'
      ? normalizedValue.split(',')[0]?.trim() || null
      : normalizedValue.trim();
  }, null);

  const directIp = headerIp || req.ip || req.socket?.remoteAddress || null;
  const normalized = normalizeIp(directIp);

  if (!normalized || isPrivateIp(normalized)) {
    return null;
  }

  return normalized;
};

const lookupCountryByIp = async (ip: string): Promise<CountryLocation | null> => {
  try {
    const response = await axios.get(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      timeout: 2000,
      validateStatus: (status) => status >= 200 && status < 500,
    });

    const countryCode = normalizeCountryCode(
      response.data?.country_code || response.data?.countryCode || response.data?.country,
    );
    if (!countryCode) {
      return null;
    }

    return {
      countryCode,
      countryName: getCountryName(countryCode),
      source: 'ip',
      ip,
    };
  } catch {
    return null;
  }
};

export const resolveCountryFromRequest = async (req: Request): Promise<CountryLocation | null> => {
  const headerCountry = getHeaderCountry(req);
  if (headerCountry) {
    return headerCountry;
  }

  const ip = getClientIp(req);
  if (!ip) {
    return null;
  }

  return lookupCountryByIp(ip);
};