'use client';

import { motion } from 'framer-motion';
import { Globe, Zap, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useGetCountriesAutocompleteQuery } from '@/store/slices/esimSlice';

interface Country {
  id: string;
  code: string;
  name: string;
}

export function CountriesShowcase() {
  const { data: countriesData = [], isFetching, error: fetchError } = useGetCountriesAutocompleteQuery();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const countries = useMemo<Country[]>(() => {
    return Array.isArray(countriesData)
      ? countriesData.map((country: any) => ({
          id: country.code,
          code: country.code.toUpperCase(),
          name: country.name,
        }))
      : [];
  }, [countriesData]);

  const filteredCountries = useMemo<Country[]>(() => {
    if (!searchQuery.trim()) {
      return countries;
    }

    const lowercaseQuery = searchQuery.toLowerCase();
    return countries.filter((country) => {
      const lowerCode = country.code.toLowerCase();
      const lowerName = country.name.toLowerCase();

      if (lowerCode.includes(lowercaseQuery)) return true;
      if (lowerName.startsWith(lowercaseQuery)) return true;
      return false;
    });
  }, [countries, searchQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setSelectedIndex(-1);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (document.activeElement !== searchInputRef.current) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCountries.length - 1 ? prev + 1 : prev,
        );
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      }

      if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        const selected = filteredCountries[selectedIndex];
        if (selected) {
          const slug = selected.name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '');
          window.location.href = `/${slug}-esim`;
        }
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredCountries, countries]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };
  const animationKey = searchQuery;

  const fetchErrorMessage =
    typeof fetchError === 'string'
      ? fetchError
      : fetchError
      ? JSON.stringify(fetchError)
      : null;

  if (isFetching) {
    return (
      <div className="rounded-3xl bg-linear-to-br from-primary-50 to-primary-100 p-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(20)].map((_, idx) => (
            <div key={idx} className="h-24 bg-primary-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (fetchErrorMessage) {
    return (
      <div className="text-center py-16 rounded-3xl bg-linear-to-br from-primary-50 to-primary-100">
        <Globe className="w-16 h-16 text-primary-300 mx-auto mb-4" />
        <p className="text-primary-700 font-semibold">{fetchErrorMessage}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Premium Section Background Container */}
      <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-primary-50 via-primary-100/30 to-primary-100 -z-10" />
      
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-bl from-primary-200/40 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-linear-to-tr from-primary-100/30 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="px-8 py-12 md:px-12 md:py-16 relative z-10">
        
        {/* Top Accent Line */}
        <div className="h-1 w-16 bg-linear-to-r from-primary-700 to-primary-500 rounded-full mb-8" />

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search countries..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-12 pr-10 py-3 rounded-xl border-2 border-primary-200 focus:border-primary-600 focus:outline-none bg-white text-primary-900 placeholder-primary-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-400 hover:text-primary-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="mt-2 flex gap-4 flex-wrap text-sm text-primary-700">
            <span>↓↑ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Clear</span>
            <span className="hidden md:inline opacity-60">· Cmd+K to focus</span>
          </div>
        </motion.div>

        {/* Results Count */}
        <div className="mb-6 text-sm font-semibold text-primary-700">
          {searchQuery.trim()
            ? `${filteredCountries.length} result${filteredCountries.length !== 1 ? 's' : ''} for "${searchQuery}"`
            : `${countries.length} countries available`}
        </div>

        {/* Countries Grid */}
        {filteredCountries.length > 0 ? (
          <motion.div
            key={animationKey}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {filteredCountries.map((country, index) => {
              const slug = country.name
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]/g, '');
              return (
              <Link key={country.code} href={`/${slug}-esim`}>
                <motion.div
                  variants={itemVariants}
                  className="relative cursor-pointer"
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {/* Premium Card Design */}
                  <div
                    title={country.name}
                    className={`relative h-24 bg-white rounded-2xl p-4 flex items-center gap-3 border-2 shadow-sm overflow-hidden transition-all ${
                    selectedIndex === index
                      ? 'border-primary-600 shadow-lg scale-105'
                      : 'border-primary-200 hover:border-primary-300'
                  }`}>
                    
                    {/* Subtle linear background */}
                    <div className="absolute inset-0 bg-linear-to-br from-white to-primary-50/50 -z-10 rounded-2xl" />

                    {/* Left: Circular Flag Badge */}
                    <div className="relative shrink-0">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-sm bg-gray-100">
                        {/* plain <img> avoids Next.js Image intrinsic-size fighting object-cover */}
                        <img
                          src={`https://flagcdn.com/w160/${country.code.toLowerCase()}.png`}
                          alt={`${country.name} flag`}
                          className="w-full h-full object-cover object-center"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>

                    {/* Right: Content Section */}
                    <div className="relative z-10 flex-1 min-w-0">
                      {/* Country Name */}
                      <h3 className="text-sm font-bold text-primary-900 leading-tight truncate">
                        {country.name}
                      </h3>
                      
                      {/* Country Code with accent dot */}
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-600"></div>
                        <span className="text-xs font-semibold text-primary-700">
                          {country.code}
                        </span>
                      </div>
                    </div>

                    {/* Right Corner Accent Icon */}
                    <div className="shrink-0 w-6 h-6 rounded-lg bg-linear-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 text-primary-700" />
                    </div>

                    {/* Top subtle border accent */}
                    <div className="absolute top-0 inset-x-0 h-0.5 bg-linear-to-r from-transparent via-primary-200/50 to-transparent" />
                  </div>
                </motion.div>
              </Link>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Globe className="w-16 h-16 text-primary-300 mx-auto mb-4" />
            <p className="text-primary-700 font-semibold">No countries found matching "{searchQuery}"</p>
            <p className="text-primary-500 text-sm mt-2">Try a different search term</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

