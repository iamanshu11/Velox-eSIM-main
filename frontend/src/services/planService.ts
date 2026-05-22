import type { ApiResponse, Plan } from '@/types';
import { apiClient } from '@lib/apiClient';
import logger from '@lib/logger';
const convertVolumeToGB = (volumeUnits: number): number => {
  const volumeInMB = volumeUnits / 100;
  const volumeInGB = volumeInMB / 1024;
  return Math.round(volumeInGB * 10) / 10;
};
const centsToUSD = (cents: number): number => {
  return cents / 100;
};
const mapPackageToPlan = (pkg: any): Plan => ({
  id: pkg.packageCode,
  packageCode: pkg.packageCode,
  name: pkg.name,
  description: pkg.description || pkg.name,
  dataAmount: convertVolumeToGB(pkg.volume),
  dataUnit: 'GB',
  validity: pkg.duration,
  validityUnit: pkg.durationUnit?.toLowerCase() || 'days',
  price: centsToUSD(pkg.price),
  originalPrice: centsToUSD(pkg.retailPrice || pkg.price),
  country: pkg.locationNetworkList?.[0]?.locationName || pkg.location,
  countryCode: pkg.locationCode,
  operatorName: pkg.locationNetworkList?.[0]?.locationName || 'Multi-Country',
  features: [
    `${convertVolumeToGB(pkg.volume)}GB Data`,
    `${pkg.duration} ${pkg.durationUnit}`,
    `${pkg.speed} Speed`,
    pkg.smsStatus ? 'SMS Included' : 'SMS Not Included',
  ].filter(Boolean),
  isActive: pkg.activeType === 2,
});
const mapSearchResultToPlan = (result: any): Plan => ({
  id: result.packageCode || result.id || `${result.countryCode}-${Math.random()}`,
  packageCode: result.packageCode || result.id || `${result.countryCode}-${Math.random()}`,
  name: result.name || `${result.country} Plans`,
  description: result.name || `Plans for ${result.country}`,
  dataAmount: typeof result.dataAmount === 'number' ? result.dataAmount : 0,
  dataUnit: 'GB',
  validity: typeof result.validity === 'number' ? result.validity : 0,
  validityUnit: 'days',
  price: typeof result.price === 'number' ? result.price : 0,
  originalPrice: typeof result.wholesalePrice === 'number' ? result.wholesalePrice : (typeof result.price === 'number' ? result.price : 0),
  country: result.country || '',
  countryCode: result.countryCode || '',
  operatorName: result.operatorName || 'Primary Operator',
  features: [
    result.dataAmount ? `${result.dataAmount}GB Data` : '',
    result.validity ? `${result.validity} Days` : '',
    result.speed ? `${result.speed} Speed` : '',
  ].filter(Boolean),
  isActive: true,
});

export const planService = {
async getAllPlans(): Promise<Plan[]> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(`/esims/packages`);
      
      let packages = response?.data?.packages || response?.data?.packageList || response?.data;
      
      if (!Array.isArray(packages)) {
        logger.warn('[PlanService] Invalid response structure, expected array');
        return [];
      }

      return packages.map(mapPackageToPlan);
    } catch (error) {
      logger.error('[PlanService] Error fetching plans', error);
      throw error;
    }
  },
async getPlanById(id: string): Promise<Plan> {
    try {
      const plans = await this.getAllPlans();
      const plan = plans.find((p) => p.id === id);
      
      if (!plan) {
        throw new Error(`Plan not found: ${id}`);
      }
      
      return plan;
    } catch (error) {
      logger.error('[PlanService] Error fetching plan by ID', error);
      throw error;
    }
  },
async searchPlans(query: string): Promise<Plan[]> {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }
      
      const response = await apiClient.get<ApiResponse<any>>(`/esims/search?q=${encodeURIComponent(query.trim())}&limit=50`);
      
      const results = Array.isArray(response?.data) ? response.data : [];

      return results.map(mapSearchResultToPlan);
    } catch (error) {
      logger.error('[PlanService] Error searching plans', error);
      return [];
    }
  },
async searchByCountry(countryCode: string): Promise<Plan[]> {
    try {
      const plans = await this.getAllPlans();
      return plans.filter((p) => p.countryCode.includes(countryCode));
    } catch (error) {
      logger.error('[PlanService] Error searching by country', error);
      throw error;
    }
  },
async search(query: string): Promise<Plan[]> {
    try {
      const plans = await this.getAllPlans();
      const lowerQuery = query.toLowerCase();
      
      return plans.filter((p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.country.toLowerCase().includes(lowerQuery) ||
        p.features.some((f) => f.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      logger.error('[PlanService] Error searching plans', error);
      throw error;
    }
  },
filterByPrice(plans: Plan[], minPrice: number, maxPrice: number): Plan[] {
    return plans.filter((p) => p.price >= minPrice && p.price <= maxPrice);
  },
filterByData(plans: Plan[], minGB: number, maxGB: number): Plan[] {
    return plans.filter((p) => p.dataAmount >= minGB && p.dataAmount <= maxGB);
  },
filterByValidity(plans: Plan[], minDays: number, maxDays: number): Plan[] {
    return plans.filter((p) => p.validity >= minDays && p.validity <= maxDays);
  },
sort(
    plans: Plan[],
    sortBy: 'price-asc' | 'price-desc' | 'data-desc' | 'duration-asc' | 'duration-desc'
  ): Plan[] {
    const sorted = [...plans];
    
    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'data-desc':
        sorted.sort((a, b) => b.dataAmount - a.dataAmount);
        break;
      case 'duration-asc':
        sorted.sort((a, b) => a.validity - b.validity);
        break;
      case 'duration-desc':
        sorted.sort((a, b) => b.validity - a.validity);
        break;
    }
    
    return sorted;
  },
  async createPlan(): Promise<Plan> {
    throw new Error('Cannot create plans - read-only API');
  },

  async updatePlan(): Promise<Plan> {
    throw new Error('Cannot update plans - read-only API');
  },

  async deletePlan(): Promise<void> {
    throw new Error('Cannot delete plans - read-only API');
  },
};

export default planService;
