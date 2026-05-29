'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import { Globe, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import Container from '@/components/Container';
import Button from '@/components/Button';
import { PlansGroupedByValidity } from '@/components/PlansGroupedByValidity';
import { PackageData } from '@/components/PackageCard';
import logger from '@/lib/logger';
import type { Country, ApiResponse } from '@/types';

interface SearchAPIResult {
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
const mapSearchResultToDisplay = (result: SearchAPIResult): PackageData => ({
  id: result.id,
  packageCode: result.packageCode,
  name: result.name,
  volume: Math.round(result.dataAmount * 1024 * 100),
  duration: result.validity,
  durationUnit: 'days',
  dataAmount: result.dataAmount,
  validity: result.validity,
  price: Math.round(result.price * 100),
  wholesalePrice: Math.round(result.wholesalePrice * 100),
  speed: result.speed,
  operatorName: result.operatorName,
  description: result.name,
});

export default function CountryPlansPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params['slug'] as string;
  
  const [currentCountry, setCurrentCountry] = useState<Country | null>(null);
  const [plans, setPlans] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPlan = (selectedPackage: PackageData) => {
    if (!selectedPackage.packageCode || !selectedPackage.price) {
      logger.error('[CountryPlans] Package missing required fields', { pkg: selectedPackage });
      setError('Invalid package data. Please refresh and try again.');
      return;
    }

    logger.info('[CountryPlans] Selecting package', {
      id: selectedPackage.id,
      packageCode: selectedPackage.packageCode,
      price: selectedPackage.price,
      volume: selectedPackage.volume,
      countryCode: currentCountry?.code,
    });
    const planQuery = new URLSearchParams({
      planId: selectedPackage.id,
      packageCode: selectedPackage.packageCode,
      countryCode: currentCountry?.code || '',
      duration: (selectedPackage.duration || 1).toString(),
      volume: (selectedPackage.volume || 0).toString(),
      price: selectedPackage.price.toString(),
      dataAmount: (selectedPackage.dataAmount || 0).toString(),
      validity: (selectedPackage.duration || 1).toString(),
      country: currentCountry?.name || '',
      operatorName: 'Network Operator',
    }).toString();
    
    router.push(`/checkout?${planQuery}`);
  };

  useEffect(() => {
    const loadCountryAndPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        const countriesResponse = await apiClient.get<ApiResponse<Country[]>>('/esims/countries?limit=200');
        const countriesList = Array.isArray(countriesResponse?.data) 
          ? countriesResponse.data 
          : [];
        const countrySlugPart = slug.replace('-esim', '');
        const countryName = countrySlugPart
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        const foundCountry = (countriesList as Country[]).find(
          (c: Country) => c.name.toLowerCase() === countryName.toLowerCase()
        );

        if (!foundCountry) {
          setError(`Country "${countryName}" not found`);
          setLoading(false);
          return;
        }

        setCurrentCountry(foundCountry);
        const searchResponse = await apiClient.get<ApiResponse<SearchAPIResult[]>>(
          `/esims/search?q=${encodeURIComponent(countryName)}&limit=100`
        );

        let searchResults: SearchAPIResult[] = [];
        if (Array.isArray(searchResponse?.data)) {
          searchResults = searchResponse.data as SearchAPIResult[];
        }
        const displayPlans = searchResults.map(mapSearchResultToDisplay);
        
        setPlans(displayPlans);
        
        if (displayPlans.length === 0) {
          logger.warn('[CountryPlans] No packages found', {
            country: foundCountry.name,
            searchQuery: countryName,
          });
          setError(`No plans available for ${foundCountry.name}`);
        }

        logger.info('[CountryPlans] Loaded packages', {
          country: foundCountry.name,
          count: displayPlans.length,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load plans';
        setError(errorMsg);
        logger.error('[CountryPlans] Error loading packages:', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadCountryAndPlans();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 pt-24">
        <Container>
          <div className="text-center py-20">
            <div className="inline-block">
              <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-primary-600 animate-spin mb-4" />
              <p className="text-gray-600 font-semibold">Loading plans...</p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (!loading && (error?.toLowerCase().includes('not found') || (!currentCountry && !error))) {
    notFound();
  }

  if (error || !currentCountry) {
    return (
      <div className="min-h-screen bg-neutral-50 pt-24">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error || 'Country not found'}
            </h2>
            <Link href="/esim">
              <Button className="mt-6 bg-black hover:bg-gray-900 text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to eSIM Store
              </Button>
            </Link>
          </motion.div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="pb-12 border-b border-gray-100">
        <Container>
          <Link href="/esim" className="inline-flex items-center gap-2 text-primary-700 hover:text-primary-800 mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold">Back to eSIM Store</span>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h1 className="text-5xl md:text-6xl font-black text-gray-900">
              eSIM Plans for
              <br />
              <span className="bg-linear-to-r from-primary-900 to-primary-600 bg-clip-text text-transparent">
                {currentCountry.name}
              </span>
            </h1>
            
            <p className="text-lg text-gray-600 max-w-2xl">
              Choose your perfect eSIM plan with flexible data, validity, and pricing. All plans include high-speed connectivity.
            </p>
          </motion.div>
        </Container>
      </div>

      {/* Plans Section */}
      <div className="py-20">
        <Container>
          {loading ? (
            <div className="space-y-10">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[...Array(4)].map((_, j) => (
                      <div
                        key={j}
                        className="h-24 bg-gray-200 rounded-xl animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : plans.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-10"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">
                  Available Plans
                </h2>
                <p className="text-lg text-gray-600">
                  {plans.length} plan{plans.length !== 1 ? 's' : ''} available for flexible connectivity
                </p>
              </div>

              <PlansGroupedByValidity
                plans={plans}
                onSelectPlan={handleSelectPlan}
              />
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold mb-4">
                No plans available for {currentCountry?.name} yet.
              </p>
              <Link href="/esim">
                <Button className="bg-primary-700 hover:bg-primary-800 text-white">
                  Browse All Plans
                </Button>
              </Link>
            </div>
          )}
        </Container>
      </div>
    </div>
  );
}

