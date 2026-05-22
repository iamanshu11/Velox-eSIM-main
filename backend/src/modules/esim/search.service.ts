import { esimAccessService, DataPackage } from './esim.service';
import { settingsService } from '@modules/settings/settings.service';
import { getCountryName } from '../../lib/countryMap';

interface SearchResult {
  id: string;
  packageCode: string;
  name: string;
  country: string;
  countryCode: string;
  operatorName: string;
  price: number;
  wholesalePrice: number;
  dataAmount: number;
  validity: number;
  speed: string;
}
const levenshteinDistance = (a: string, b: string): number => {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  const matrix: number[][] = [];

  for (let i = 0; i <= bLower.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= aLower.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bLower.length; i++) {
    for (let j = 1; j <= aLower.length; j++) {
      if (bLower.charAt(i - 1) === aLower.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[bLower.length][aLower.length];
};

const calculateMatchScore = (query: string, text: string): number => {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  if (textLower === queryLower) return 1;

  if (textLower.startsWith(queryLower)) return 0.9;

  if (queryLower.length <= 3) {
    const maxLen = Math.max(queryLower.length, textLower.length);
    const distance = levenshteinDistance(queryLower, textLower);
    const similarity = 1 - distance / maxLen;
    return similarity > 0.6 ? similarity : 0;
  }

  return 0;
};

export const searchPlansByCountry = async (
  query: string,
  limit = 10
): Promise<SearchResult[]> => {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const settings = await settingsService.getSettings();
    if (!settings || !settings.profitMargin) {
      throw new Error('Profit margin not configured in settings');
    }

    const packages = await esimAccessService.getAllDataPackages();
    const packageArray = Array.isArray(packages) ? packages : [];

    if (packageArray.length === 0) {
      return [];
    }

    const countryPackagesMap = new Map<
      string,
      {
        country: string;
        countryCode: string;
        packages: DataPackage[];
      }
    >();

    packageArray.forEach((pkg: DataPackage) => {
      const pkgWithLocationCode = pkg as DataPackage & { locationCode?: string };
      const countryCode = (pkgWithLocationCode.locationCode || pkg.location || '') as string;
      
      const countryName = getCountryName(countryCode);

      if (countryCode && countryName && countryName !== countryCode) {
        if (!countryPackagesMap.has(countryCode)) {
          countryPackagesMap.set(countryCode, {
            country: countryName,
            countryCode,
            packages: [],
          });
        }
        countryPackagesMap.get(countryCode)!.packages.push(pkg);
      }
    });

    const searchResults: {
      country: string;
      countryCode: string;
      score: number;
      packages: DataPackage[];
    }[] = [];

    countryPackagesMap.forEach((value, countryCode) => {
      const countryNameScore = calculateMatchScore(query, value.country);
      const countryCodeScore = calculateMatchScore(query, countryCode);
      const maxScore = Math.max(countryNameScore, countryCodeScore);

      if (maxScore > 0.4) {
        searchResults.push({
          country: value.country,
          countryCode,
          score: maxScore,
          packages: value.packages,
        });
      }
    });

    searchResults.sort((a, b) => b.score - a.score);

    const formattedResults: SearchResult[] = [];

    for (const result of searchResults.slice(0, limit)) {
      for (const pkg of result.packages) {
        if (!pkg) continue;

        const wholesalePriceInCents = Math.round((pkg.price || 0) / 100);
        const retailPriceInCents = Math.round(
          wholesalePriceInCents * settings.profitMargin
        );

        const dataAmountGB = pkg.volume 
          ? pkg.volume / (1024 ** 3) 
          : 0;

        formattedResults.push({
          id: pkg.packageCode || `${result.countryCode}-${Math.random()}`,
          packageCode: pkg.packageCode || '',
          name: pkg.name || `${result.country} Plans`,
          country: result.country,
          countryCode: result.countryCode,
          operatorName: pkg.operatorList?.[0]?.operatorName || pkg.locationNetworkList?.[0]?.locationName || 'Primary Operator',
          price: retailPriceInCents / 100,
          wholesalePrice: wholesalePriceInCents / 100,
          dataAmount: dataAmountGB,
          validity: pkg.duration || 0,
          speed: pkg.speed || 'High',
        });
      }
    }

    return formattedResults;
  } catch (error) {
    console.error('[SearchService] Error searching plans:', error);
    throw error;
  }
};

export const getAllCountries = async (): Promise<
  { name: string; code: string }[]
> => {
  try {
    const packages = await esimAccessService.getAllDataPackages();
    const packageArray = Array.isArray(packages) ? packages : [];

    const countriesMap = new Map<string, string>();

    packageArray.forEach((pkg: DataPackage) => {
      const pkgWithLocationCode = pkg as DataPackage & { locationCode?: string };
      const countryCode = (pkgWithLocationCode.locationCode || pkg.location || '') as string;
      
      const countryName = getCountryName(countryCode);
      
      if (countryCode && countryName && countryName !== countryCode) {
        countriesMap.set(countryCode, countryName);
      }
    });

    return Array.from(countriesMap.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('[SearchService] Error getting countries:', error);
    throw error;
  }
};
