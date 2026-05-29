'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, X, Zap, Globe, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { getAllCountries } from '@/lib/countryMap';
import { motion } from 'framer-motion';

interface Plan {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  operatorName: string;
  price: number;
}

interface SearchBarProps {
  plans?: Plan[];
  onSearch?: (query: string) => void;
  className?: string;
}

const ALL_COUNTRIES = getAllCountries();

const buildInstantCountryResults = (searchQuery: string): Plan[] => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  if (normalizedQuery.length < 2) {
    return [];
  }

  const exactCodeMatches = ALL_COUNTRIES.filter(({ code }) => code.toLowerCase() === normalizedQuery);

  const rankedMatches = exactCodeMatches.length > 0
    ? exactCodeMatches
    : ALL_COUNTRIES
        .filter(({ code, name }) => {
          const normalizedCode = code.toLowerCase();
          const normalizedName = name.toLowerCase();

          if (normalizedCode.startsWith(normalizedQuery)) {
            return true;
          }

          if (normalizedName.startsWith(normalizedQuery)) {
            return true;
          }

          return normalizedQuery.length >= 3 && normalizedName.includes(normalizedQuery);
        })
        .sort((left, right) => {
          const leftName = left.name.toLowerCase();
          const rightName = right.name.toLowerCase();
          const leftCode = left.code.toLowerCase();
          const rightCode = right.code.toLowerCase();

          const getRank = (code: string, name: string): number => {
            if (code === normalizedQuery) return 0;
            if (name.startsWith(normalizedQuery)) return 1;
            if (code.startsWith(normalizedQuery)) return 2;
            return 3;
          };

          return getRank(leftCode, leftName) - getRank(rightCode, rightName) || left.name.localeCompare(right.name);
        });

  return rankedMatches.slice(0, 8).map(({ code, name }) => ({
    id: `instant-${code}`,
    name,
    country: name,
    countryCode: code,
    operatorName: '',
    price: 0,
  }));
};

const getPlanSignature = (plan: Plan): string => `${plan.countryCode.toUpperCase()}|${plan.country.toLowerCase()}`;

const mergePlanLists = (primary: Plan[], secondary: Plan[]): Plan[] => {
  const merged: Plan[] = [];
  const seen = new Set<string>();

  for (const plan of [...primary, ...secondary]) {
    const signature = getPlanSignature(plan);
    if (seen.has(signature)) {
      continue;
    }

    seen.add(signature);
    merged.push(plan);
  }

  return merged;
};

const arePlanListsEqual = (left: Plan[], right: Plan[]): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((plan, index) => getPlanSignature(plan) === getPlanSignature(right[index]));
};

export default function SearchBar({ onSearch, className = '' }: SearchBarProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRequestIdRef = useRef(0);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredPlans, setFilteredPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);
  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      searchRequestIdRef.current += 1;
      setFilteredPlans([]);
      setLoading(false);
      return;
    }
    const instantResults = buildInstantCountryResults(trimmedQuery);
    setFilteredPlans(instantResults);
    if (trimmedQuery.length < 2) {
      searchRequestIdRef.current += 1;
      setLoading(false);
      return;
    }

    const requestId = ++searchRequestIdRef.current;

    const searchPlans = async (searchQuery: string, activeRequestId: number) => {
      try {
        setLoading(true);
        const response = await apiClient.get<any>(
          `/esims/search?q=${encodeURIComponent(searchQuery)}&limit=8`
        );

        if (activeRequestId !== searchRequestIdRef.current) {
          return;
        }

        const results = Array.isArray(response?.data) ? response.data : [];
        const seenCountries = new Set<string>();
        const uniqueResults = results.filter((result: any) => {
          const countryCode = result.countryCode?.toUpperCase();
          if (seenCountries.has(countryCode)) {
            return false;
          }
          seenCountries.add(countryCode);
          return true;
        });
        const plans: Plan[] = uniqueResults.map((result: any) => ({
          id: result.id || result.packageCode,
          name: result.name || result.country,
          country: result.country,
          countryCode: result.countryCode,
          operatorName: result.operatorName || 'Unknown',
          price: result.price || 0,
        }));

        const mergedPlans = mergePlanLists(instantResults, plans);

        if (!arePlanListsEqual(mergedPlans, filteredPlans)) {
          setFilteredPlans(mergedPlans);
        }
      } catch (error) {
        if (activeRequestId !== searchRequestIdRef.current) {
          return;
        }
        if (buildInstantCountryResults(searchQuery).length === 0) {
          setFilteredPlans([]);
        }
      } finally {
        if (activeRequestId === searchRequestIdRef.current) {
          setLoading(false);
        }
      }
    };

    void searchPlans(trimmedQuery, requestId);
  }, [query]);

  const handleCountryClick = (countryName: string) => {
    const updated = [countryName, ...recentSearches.filter(s => s !== countryName)].slice(0, 5);
    setRecentSearches(updated);

    const slug = countryName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
    router.push(`/${slug}-esim`);
    setIsOpen(false);
    setQuery('');
  };

  const handleCountrySearch = () => {
    if (query.trim()) {
      const updated = [query.trim(), ...recentSearches.filter(s => s !== query.trim())].slice(0, 5);
      setRecentSearches(updated);

      const slug = query.trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
      router.push(`/${slug}-esim`);
      setIsOpen(false);
      setQuery('');
    }
  };

  const clearSearch = () => {
    setQuery('');
    setFilteredPlans([]);
    setIsOpen(false);
  };

  const clearAllHistory = () => {
    setRecentSearches([]);
  };

  const removeFromHistory = (search: string) => {
    const updated = recentSearches.filter(s => s !== search);
    setRecentSearches(updated);
  };

  const handleRecentSearch = (search: string) => {
    setQuery(search);
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative">
        {/* Animated background container */}
        <motion.div
          className="absolute -inset-1 bg-linear-to-r from-primary-500/20 to-primary-300/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ pointerEvents: 'none' }}
        />

        {/* Main search input container */}
        <div className="relative bg-white rounded-2xl border border-primary-100/60 hover:border-primary-300/60 transition-all duration-300 group">
          {/* Search Icon */}
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-700 pointer-events-none transition-colors duration-300" />

          {/* Input Field */}
          <input
            type="text"
            placeholder="Search destinations..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              onSearch?.(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredPlans.length > 0) {
                  const first = filteredPlans[0];
                  handleCountryClick(first.country);
                } else if (query.trim()) {
                  handleCountrySearch();
                }
              }
            }}
            onFocus={() => {
              setIsOpen(true);
              if (!query && recentSearches.length > 0) {
                setIsOpen(true);
              }
            }}
            className="w-full pl-14 pr-14 py-4 sm:py-5 text-primary-900 placeholder-primary-500 focus:outline-none rounded-2xl transition-all duration-300 text-base sm:text-lg font-medium"
          />

          {/* Clear Button */}
          {query && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-primary-50 rounded-lg transition-all duration-200 text-primary-500 hover:text-primary-700"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        {/* Dropdown Results */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-primary-100 overflow-hidden z-50 max-h-[70vh] flex flex-col"
          >
            {loading && filteredPlans.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block"
                >
                  <Zap className="w-6 h-6 text-primary-700" />
                </motion.div>
                <p className="text-primary-700 mt-3 font-medium">Searching plans...</p>
              </div>
            ) : query.trim() && filteredPlans.length > 0 ? (
              <div className="overflow-y-auto flex-1">
                {/* Results header */}
                <div className="px-6 py-3 bg-primary-50/50 border-b border-primary-100 sticky top-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold text-primary-700 uppercase tracking-wider">Results</p>
                    {loading && (
                      <p className="text-[11px] font-semibold text-primary-500 uppercase tracking-wider">
                        Live results updating
                      </p>
                    )}
                  </div>
                </div>

                {filteredPlans.map((plan, idx) => (
                  <motion.button
                    key={plan.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() =>
                      handleCountryClick(plan.country)
                    }
                    className="w-full px-6 py-4 hover:bg-primary-50 transition-colors duration-200 border-b border-primary-100 last:border-b-0 flex items-center justify-between gap-4 text-left cursor-pointer group/item"
                  >
                    <div className="flex-1 flex items-center gap-4">
                      <div className="relative w-10 h-7 rounded-md overflow-hidden bg-gray-100 shrink-0">
                        <img
                          src={`https://flagcdn.com/w160/${plan.countryCode.toLowerCase()}.png`}
                          alt={`${plan.country} flag`}
                          className="w-full h-full object-cover object-center"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-primary-800 text-base">
                          {plan.country}
                        </div>
                        <div className="text-xs text-primary-600 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {plan.countryCode}
                          {plan.operatorName ? ` • ${plan.operatorName}` : ''}
                        </div>
                      </div>
                    </div>
                    <motion.div
                      className="flex items-center gap-2 shrink-0 text-primary-700 opacity-0 group-hover/item:opacity-100 transition-all duration-200"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </motion.button>
                ))}
              </div>
            ) : query.trim() && filteredPlans.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-6 h-6 text-primary-400" />
                </div>
                <p className="text-primary-700 font-medium mb-1">No destinations found</p>
                <p className="text-sm text-primary-600 mb-4">Searching for &quot;{query}&quot;</p>
                <button
                  onClick={handleCountrySearch}
                  className="inline-block bg-primary-700 hover:bg-primary-800 text-white font-bold text-sm px-6 py-2.5 rounded-xl mb-2 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Search Anyway
                </button>
                <br />
                <Link
                  href="/esim"
                  className="text-primary-700 hover:text-primary-800 font-semibold text-sm inline-block mt-2"
                >
                  Browse all plans →
                </Link>
              </div>
            ) : !query && recentSearches.length > 0 ? (
              <div className="overflow-y-auto flex-1 flex flex-col">
                {/* Recent header with clear button */}
                <div className="px-6 py-3 bg-primary-50/50 border-b border-primary-100 flex items-center justify-between sticky top-0">
                  <p className="text-xs font-bold text-primary-700 uppercase tracking-wider">Recent Searches</p>
                  <motion.button
                    onClick={clearAllHistory}
                    className="text-xs text-primary-500 hover:text-red-500 font-semibold transition-colors duration-200"
                  >
                    Clear All
                  </motion.button>
                </div>

                <div className="overflow-y-auto flex-1">
                  {recentSearches.map((search, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleRecentSearch(search)}
                      className="w-full px-6 py-3 hover:bg-primary-50 transition-colors duration-200 border-b border-primary-100 last:border-b-0 flex items-center justify-between gap-3 text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Zap className="w-4 h-4 text-primary-400 shrink-0" />
                        <span className="text-primary-700 font-medium truncate">{search}</span>
                      </div>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(search);
                        }}
                        className="text-primary-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0 p-1"
                        aria-label="Remove from history"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </div>
    </div>
  );
}
