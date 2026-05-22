import logger from '@/lib/logger';

export interface CountryInfo {
  name: string;
  code: string;
}

let countryCache: CountryInfo[] = [];

export const getCountryBySlug = async (slug: string): Promise<CountryInfo | null> => {
  if (countryCache.length === 0) {
    await loadCountryCache();
  }

  const countryName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return countryCache.find(
    c => c.name.toLowerCase() === countryName.toLowerCase()
  ) || null;
};

export const loadCountryCache = async () => {
  try {
    countryCache = [];
  } catch (error) {
    logger.error('[Country Mapping] Failed to load countries', error);
  }
};
