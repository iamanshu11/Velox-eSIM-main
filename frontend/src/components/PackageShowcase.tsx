'use client';

import CountryFlagIcon from '@/components/CountryFlagIcon';
import { motion } from 'framer-motion';
import { Compass, Globe, Zap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Container from './Container';
import { getCountryName } from '@/lib/countryMap';
import { countryNameToSlug } from '@/utils/countrySlug';
import {
  useGetCountriesAutocompleteQuery,
  useGetGlobalPackagesQuery,
  useGetPopularPackagesQuery,
  useGetRegionalPackagesQuery,
} from '@/store/slices/esimSlice';

interface Package {
  packageCode: string;
  name: string;
  location: string;
  locationCode?: string;
  code?: string;
  price: number;
  volume: number;
  duration: number;
  durationUnit: string;
  purchaseCount?: number;
  region?: string;
}

const TABS = [
  { id: 'popular', label: 'Popular', icon: Zap },
  { id: 'local', label: 'Local', icon: Globe },
  { id: 'regional', label: 'Regional', icon: Compass },
  { id: 'global', label: 'Global', icon: Globe },
] as const;

type TabId = typeof TABS[number]['id'];

const getCountryHref = (pkg: Package) => {
  const isGlobal = Boolean(
    (pkg.location && String(pkg.location).toUpperCase().startsWith('GL')) ||
    (pkg.name && String(pkg.name).toLowerCase().includes('global'))
  );

  if (isGlobal) {
    const countryCode = encodeURIComponent((pkg as any).locationCode || pkg.location || '');
    const pkgCode = encodeURIComponent(pkg.packageCode);
    const countryName = encodeURIComponent(pkg.name || 'Global');
    const price = encodeURIComponent(String(pkg.price ?? 0));
    const duration = encodeURIComponent(String(pkg.duration ?? ''));
    const dataAmount = encodeURIComponent(String((pkg as any).volumeGB ?? 0));
    return `/checkout?planId=${pkgCode}&packageCode=${pkgCode}&price=${price}&duration=${duration}&dataAmount=${dataAmount}&countryCode=${countryCode}&country=${countryName}`;
  }

  const countryNameFromLocation = pkg.location ? getCountryName(pkg.location) : '';
  const resolvedCountryName =
    pkg.code && pkg.name && pkg.name !== 'Global'
      ? pkg.name
      : countryNameFromLocation && countryNameFromLocation !== pkg.location
        ? countryNameFromLocation
        : pkg.name || pkg.location || 'Global';

  return `/${countryNameToSlug(resolvedCountryName)}-esim`;
};

export default function PackageShowcase() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') as TabId || 'popular';
  const [activeTab, setActiveTab] = useState<TabId>('popular');

  useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams);
    params.set('tab', tabId);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const {
    data: popularPackages = [],
    isFetching: popularLoading,
    error: popularError,
  } = useGetPopularPackagesQuery(undefined, {
    skip: activeTab !== 'popular',
  });

  const {
    data: localCountries = [],
    isFetching: localLoading,
    error: localError,
  } = useGetCountriesAutocompleteQuery(undefined, {
    skip: activeTab !== 'local' && activeTab !== 'popular',
  });

  const {
    data: globalPackages = [],
    isFetching: globalLoading,
    error: globalError,
  } = useGetGlobalPackagesQuery(undefined, {
    skip: activeTab !== 'global',
  });

  const {
    data: regionalPackages = {},
    isFetching: regionalLoading,
    error: regionalError,
  } = useGetRegionalPackagesQuery(undefined, {
    skip: activeTab !== 'regional',
  });

  const isLoading =
    activeTab === 'popular'
      ? popularLoading
      : activeTab === 'local'
      ? localLoading
      : activeTab === 'global'
      ? globalLoading
      : regionalLoading;

  const error =
    activeTab === 'popular'
      ? popularError
      : activeTab === 'local'
      ? localError
      : activeTab === 'global'
      ? globalError
      : regionalError;

  const errorMessage =
    typeof error === 'string'
      ? error
      : error
      ? JSON.stringify(error)
      : null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="bg-primary-100 rounded-2xl h-24 animate-pulse opacity-60"
            />
          ))}
        </div>
      );
    }

    if (errorMessage) {
      return (
        <div className="text-center py-12">
          <p className="text-primary-700 text-sm font-medium">{errorMessage}</p>
        </div>
      );
    }

    let content: Package[] = [];
    let title = '';
    let description = '';

    if (activeTab === 'popular') {
      content = popularPackages;
      title = 'Get eSIMs for popular locations';
      description = 'Explore our most popular eSIMs — packages start from the shown price.';
    } else if (activeTab === 'global') {
      content = globalPackages;
      title = 'Get global eSIMs';
      description = `Global coverage — ${globalPackages.length} total plans from Global 130+ and Global 120+ areas.`;
    } else if (activeTab === 'local') {
      const localCountryPackages: Package[] = localCountries.slice(0, 12).map((country) => ({
        packageCode: country.code || country.locationCode || country.name,
        name: country.name,
        location: country.code || '',
        locationCode: country.locationCode,
        code: country.code,
        price: 0,
        volume: 0,
        duration: 0,
        durationUnit: '',
      }));
      content = localCountryPackages;
      title = 'Get eSIMs for local locations';
      description = 'Browse individual countries — lowest prices available.';
    } else if (activeTab === 'regional') {
      title = 'Get regional eSIMs';
      description = 'Browse eSIM plans organized by region — find the perfect plan for your destination.';
    }
    if (activeTab === 'regional') {
      const regionsList = Object.keys(regionalPackages);
      
      return (
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-700 mb-5 shadow-[0_10px_24px_rgba(67,161,240,0.10)] ring-1 ring-white/60">
            <Compass className="w-3.5 h-3.5" />
            Velox eSIM Solutions
          </div>
          <h3 className="text-3xl md:text-4xl font-black text-slate-700 mb-3 leading-tight max-w-2xl">
            {title}
          </h3>
          <p className="text-slate-700 text-base md:text-lg mb-10 max-w-2xl leading-relaxed">
            {description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {regionsList.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-slate-700 font-medium">No regions available</p>
              </div>
            ) : (
              regionsList.map((regionName, regionIdx) => {
                const packages = regionalPackages[regionName] || [];
                const packageCount = packages.length;

                return (
                  <Link
                    href={`/esim?region=${encodeURIComponent(regionName)}`}
                    key={regionName}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: regionIdx * 0.02 }}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white/82 rounded-2xl px-5 py-4 flex flex-col gap-3 shadow-[0_16px_32px_rgba(15,23,42,0.07)] hover:shadow-[0_22px_42px_rgba(15,23,42,0.1)] transition-all cursor-pointer h-full w-full backdrop-blur-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid place-items-center h-11 w-11 rounded-2xl bg-primary-100 text-primary-700">
                          <Compass className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-slate-700 block line-clamp-1 text-sm">
                            {regionName}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2 py-1 text-[11px] font-semibold mt-2">
                            {packageCount} plan{packageCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-50/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-700 mb-5 shadow-[0_10px_24px_rgba(67,161,240,0.10)] ring-1 ring-white/60">
          <Zap className="w-3.5 h-3.5" />
          Velox eSIM Solutions
        </div>
        <h3 className="text-3xl md:text-4xl font-black text-slate-700 mb-3 leading-tight max-w-2xl">
          {title}
        </h3>
        <p className="text-slate-700 text-base md:text-lg mb-10 max-w-2xl leading-relaxed">
          {description}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {content.slice(0, 15).map((pkg, idx) => {
            const name = pkg.name || pkg.location || 'Global';
            const countryHref = getCountryHref(pkg);
            const isGlobalPackage = Boolean(
              pkg.locationCode?.startsWith('GL') ||
              (pkg.name && pkg.name.toLowerCase().includes('global'))
            );
            const globalLabel =
              pkg.locationCode === 'GL-139'
                ? 'Global (130+ areas)'
                : pkg.locationCode === 'GL-120'
                ? 'Global (120+ areas)'
                : pkg.locationCode || pkg.location;

            return (
              <Link href={countryHref} key={`${pkg.packageCode}-${idx}`}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/82 rounded-2xl px-5 py-4 flex flex-col gap-3 shadow-[0_16px_32px_rgba(15,23,42,0.07)] hover:shadow-[0_22px_42px_rgba(15,23,42,0.1)] transition-all cursor-pointer h-full w-full backdrop-blur-md"
                >
                  <div className="flex items-center gap-3">
                    {isGlobalPackage ? (
                      <div className="grid place-items-center h-11 w-11 rounded-2xl bg-primary-100 text-primary-700">
                        <Globe className="w-5 h-5" />
                      </div>
                    ) : (
                      <CountryFlagIcon countryCode={pkg.location} size={28} />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-slate-700 block line-clamp-1 text-sm">
                        {name}
                      </span>
                      {isGlobalPackage && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2 py-1 text-[11px] font-semibold mt-2">
                          {globalLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="py-16 md:py-24">
      <Container>
        {/* Tabs */}
        <div className="flex gap-3 md:gap-4 mb-10 pb-4 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative overflow-hidden flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 cursor-pointer font-semibold text-sm md:text-base transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-primary-900 text-white shadow-none'
                      : 'text-slate-700 bg-white/90 hover:bg-primary-50 ring-1 ring-white/60'
                  }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Green Container */}
        <div className="relative overflow-hidden rounded-4xl bg-linear-to-br from-white via-primary-50/45 to-primary-50/20 px-6 md:px-10 py-10 md:py-12 shadow-[0_36px_100px_rgba(67,161,240,0.09)] ring-1 ring-white/60 backdrop-blur-xl">
          <div className="absolute -top-24 right-0 h-56 w-56 rounded-full bg-primary-100/40 blur-3xl" />
          <div className="absolute -bottom-24 left-0 h-56 w-56 rounded-full bg-primary-200/40 blur-3xl" />

          <div className="relative z-10 w-full">
            {renderContent()}
          </div>
          
          {/* View all button */}
          <div className="hidden lg:block absolute top-10 right-10 z-10">
            <Link href="/esim">
              <button className="bg-white/90 text-slate-700 font-bold px-6 py-3 rounded-full hover:bg-primary-50 transition-colors whitespace-nowrap shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
                View all locations
              </button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
