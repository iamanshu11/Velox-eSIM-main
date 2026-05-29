'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useGetCountriesAutocompleteQuery } from '@/store/slices/esimSlice';

interface Country {
  id: string;
  code: string;
  name: string;
}
const FEATURED_COUNTRY_CODES = [
  'US', 'GB', 'CA', 'AU',   
  'FR', 'DE', 'IT', 'ES',   
  'JP', 'SG', 'IN', 'BR',   
];

export default function FeaturedCountries() {
  const { data: countriesData = [], isFetching, error: fetchError } =
    useGetCountriesAutocompleteQuery();
  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    const allCountries = Array.isArray(countriesData)
      ? countriesData.map((country: any) => ({
          id: country.code,
          code: country.code.toUpperCase(),
          name: country.name,
        }))
      : [];

    const featured = FEATURED_COUNTRY_CODES
      .map(code => allCountries.find((c: Country) => c.code === code))
      .filter((c): c is Country => c !== undefined);

    setCountries(featured);
  }, [countriesData]);

  if (isFetching) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(12)].map((_, idx) => (
          <div key={idx} className="h-24 bg-primary-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (fetchError || countries.length === 0) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
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

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-3"
      >
        <div className="flex items-center justify-center gap-2">
          <Globe className="w-5 h-5 text-primary-700" />
          <h2 className="text-4xl md:text-5xl font-black text-primary-700">
            Popular Destinations
          </h2>
        </div>
        <p className="text-lg text-primary-700 max-w-2xl mx-auto">
          Get eSIM plans for 12 of our most popular destinations. Browse all 190+ countries available.
        </p>
      </motion.div>

      {/* Featured Countries Grid */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={containerVariants}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {countries.map((country) => {
          const slug = country.name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '');

          return (
            <Link key={country.code} href={`/${slug}-esim`}>
              <motion.div
                variants={itemVariants}
                className="relative cursor-pointer group"
              >
                {/* Card */}
                <div className="relative h-24 bg-white rounded-2xl p-4 flex items-center gap-3 border-2 border-primary-100 hover:border-primary-300 shadow-sm hover:shadow-md transition-all duration-300 group-hover:scale-105">
                  
                  {/* Subtle linear background */}
                  <div className="absolute inset-0 bg-linear-to-br from-white to-primary-50/50 -z-10 rounded-2xl" />

                  {/* Circular Flag Badge */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm bg-gray-100">
                      <img
                        src={`https://flagcdn.com/w160/${country.code.toLowerCase()}.png`}
                        alt={`${country.name} flag`}
                        className="w-full h-full object-cover object-center"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="relative z-10 flex-1 min-w-0">
                    {/* Country Name */}
                    <h3 className="text-sm font-bold text-primary-800 leading-tight truncate">
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
                  <div className="shrink-0 w-6 h-6 rounded-lg bg-linear-to-br from-primary-100 to-primary-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="w-3.5 h-3.5 text-primary-700" />
                  </div>

                  {/* Top subtle border accent */}
                  <div className="absolute top-0 inset-x-0 h-0.5 bg-linear-to-r from-transparent via-primary-200/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>
            </Link>
          );
        })}
      </motion.div>

      {/* View All CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex justify-center pt-8"
      >
        <Link
          href="/esim"
          className="inline-flex items-center gap-3 px-8 py-4 bg-primary-800 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary-600/25 hover:bg-primary-900 transition-all duration-300 group"
        >
          <span>View All Destinations</span>
          <Globe className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
        </Link>
      </motion.div>
    </div>
  );
}
