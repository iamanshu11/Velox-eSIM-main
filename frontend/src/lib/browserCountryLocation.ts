import { getCountryName } from "@/lib/countryMap";

export interface BrowserCountryLocation {
  countryCode: string;
  countryName: string;
  source: "ip";
}

let cachedLocation: BrowserCountryLocation | null | undefined;
let inFlightLookup: Promise<BrowserCountryLocation | null> | null = null;

type CountryProviderPayload = {
  country_code?: string;
  countryCode?: string;
  country?: string;
  country_name?: string;
  countryName?: string;
  success?: boolean;
};

const COUNTRY_PROVIDERS = [
  "https://ipwho.is/",
  "https://ipinfo.io/json",
  "https://ipapi.co/json/",
] as const;

const parseLocationFromPayload = (
  payload: CountryProviderPayload,
): BrowserCountryLocation | null => {
  if (payload.success === false) {
    return null;
  }

  const countryCode = (payload.country_code || payload.countryCode || payload.country)
    ?.trim()
    .toUpperCase();

  if (!countryCode || countryCode.length !== 2) {
    return null;
  }

  const countryName =
    payload.country_name?.trim() ||
    payload.countryName?.trim() ||
    getCountryName(countryCode);

  return {
    countryCode,
    countryName,
    source: "ip",
  };
};

async function fetchProviderLocation(url: string): Promise<BrowserCountryLocation | null> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as CountryProviderPayload;
    return parseLocationFromPayload(payload);
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchCountryLocation(): Promise<BrowserCountryLocation | null> {
  if (typeof window === "undefined") {
    return null;
  }

  for (const provider of COUNTRY_PROVIDERS) {
    const location = await fetchProviderLocation(provider);
    if (location) {
      return location;
    }
  }

  return null;
}

export function resolveBrowserCountryLocation(): Promise<BrowserCountryLocation | null> {
  if (cachedLocation !== undefined) {
    return Promise.resolve(cachedLocation);
  }

  if (!inFlightLookup) {
    inFlightLookup = fetchCountryLocation()
      .then((location) => {
        if (location) {
          cachedLocation = location;
        }

        return location;
      })
      .finally(() => {
        inFlightLookup = null;
      });
  }

  return inFlightLookup;
}