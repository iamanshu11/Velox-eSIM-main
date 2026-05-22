'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { COUNTRY_CODE_TO_NAME } from '@/lib/countryMap';
import CountryFlagIcon from './CountryFlagIcon';
import { useEffect } from 'react';

interface CoverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  countryCodes: string[];
  regionName?: string;
}

export function CoverageModal({
  isOpen,
  onClose,
  countryCodes,
  regionName = 'Region',
}: CoverageModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const countries = countryCodes
    .map((code) => ({
      code: code.trim().toUpperCase(),
      name: COUNTRY_CODE_TO_NAME[code.trim().toUpperCase()] || code.trim().toUpperCase(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-9998"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-9999 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              {/* Header */}
              <div className="bg-linear-to-r from-primary-900 via-primary-800 to-primary-700 px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-white">Coverage Areas</h2>
                  <p className="text-primary-100 text-xs mt-0.5">
                    {regionName} • {countries.length} countr{countries.length === 1 ? 'y' : 'ies'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-primary-700 rounded-lg transition-colors text-white shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Countries List */}
              <div className="overflow-y-auto flex-1 px-4 py-4">
                <div className="space-y-2">
                  {countries.map((country, idx) => (
                    <motion.div
                      key={country.code}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.01 }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                      {/* Flag - Circular */}
                      <div className="relative h-10 w-10 rounded-full overflow-hidden shadow-sm shrink-0 ring-1 ring-primary-200">
                        <CountryFlagIcon
                          countryCode={country.code}
                          size={40}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Country Name */}
                      <span className="font-medium text-slate-900 text-sm">
                        {country.name}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-primary-100 px-4 py-3 bg-primary-50 shrink-0">
                <button
                  onClick={onClose}
                  className="w-full bg-primary-900 hover:bg-primary-800 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
