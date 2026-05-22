'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import CountryFlagIcon from '@/components/CountryFlagIcon';
import { getCountryCode, getCountryName } from '@/lib/countryMap';

interface CountrySelectProps {
  value: string;
  onChange: (country: string) => void;
  countries: string[];
  placeholder?: string;
}

export default function CountrySelect({
  value,
  onChange,
  countries,
  placeholder = 'Select country...',
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const countryNames = useMemo(() => {
    return countries
      .map(country => {
        if (country.length === 2 && /^[A-Z]{2}$/.test(country)) {
          return getCountryName(country);
        }
        return country;
      })
      .filter(Boolean)
      .sort();
  }, [countries]);

  const filteredCountries = useMemo(() => {
    return countryNames.filter((countryName) => {
      const code = getCountryCode(countryName);
      return (
        countryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (code && code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [countryNames, searchTerm]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (countryName: string) => {
    onChange(countryName);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('ALL');
    setSearchTerm('');
  };

  const selectedCountry = useMemo(() => {
    if (value !== 'ALL' && value) {
      if (value.length === 2 && /^[A-Z]{2}$/.test(value)) {
        return getCountryName(value);
      }
      return value;
    }
    return null;
  }, [value]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 border-2 border-primary-200 rounded-lg focus:outline-none focus:border-primary-700 transition bg-white text-primary-900 flex items-center justify-between hover:border-primary-400 duration-200"
      >
        <div className="flex items-center gap-2 flex-1 text-left">
          {selectedCountry ? (
            <>
              <CountryFlagIcon
                countryCode={getCountryCode(selectedCountry) || selectedCountry}
              />
              <span className="font-medium">{selectedCountry}</span>
            </>
          ) : (
            <span className="text-primary-500">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedCountry && (
            <div
              onClick={handleClear}
              className="hover:bg-primary-50 p-1 rounded transition cursor-pointer"
            >
              <X className="w-4 h-4 text-primary-500" />
            </div>
          )}
          <ChevronDown
            className={`w-4 h-4 text-primary-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
              }`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-primary-200 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-primary-100">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search countries..."
                className="w-full px-3 py-2 border border-primary-200 rounded focus:outline-none focus:border-primary-700 text-sm"
                autoFocus
              />
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto">
              {/* All Option */}
              <button
                onClick={() => handleSelect('ALL')}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-primary-50 transition ${value === 'ALL'
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-primary-900'
                  }`}
              >
                <div className="w-5 h-5 rounded border-2 border-primary-200 flex items-center justify-center">
                  {value === 'ALL' && (
                    <div className="w-3 h-3 bg-primary-700 rounded-sm" />
                  )}
                </div>
                <span>All Countries</span>
              </button>

              {/* Country Options */}
              {filteredCountries.length > 0 ? (
                filteredCountries.map((countryName) => {
                  const code = getCountryCode(countryName);
                  return (
                    <button
                      key={countryName}
                      onClick={() => handleSelect(countryName)}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-primary-50 transition ${selectedCountry === countryName
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : 'text-primary-900'
                        }`}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <CountryFlagIcon countryCode={code || countryName} />
                        <div className="flex flex-col">
                          <span className="font-medium">{countryName}</span>
                          {code && <span className="text-xs text-primary-500">{code}</span>}
                        </div>
                      </div>
                      {selectedCountry === countryName && (
                        <div className="w-2 h-2 bg-primary-700 rounded-full" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-6 text-center text-primary-500 text-sm">
                  No countries found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
