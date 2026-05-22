"use client";

import { Suspense } from "react";
import Container from "@/components/Container";
import { CountriesShowcase } from "@/components/CountriesShowcase";
import { CoverageModal } from "@/components/CoverageModal";
import { motion } from "framer-motion";
import { Zap, ArrowLeft, Globe } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useGetRegionalPackagesQuery } from "@/store/slices/esimSlice";
import { useState } from "react";

function ESimPageSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50 animate-pulse">
      <div className="pt-32 pb-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          <div className="h-12 bg-gray-200 rounded w-48" />
          <div className="h-20 bg-gray-200 rounded w-3/4" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

function ESimPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const regionParam = searchParams.get("region");
  const [coverageModal, setCoverageModal] = useState<{
    isOpen: boolean;
    countryCodes: string[];
  }>({ isOpen: false, countryCodes: [] });

  const {
    data: regionalPackages = {},
    isFetching: loading,
    error,
  } = useGetRegionalPackagesQuery();

  const selectedRegion = regionParam ? decodeURIComponent(regionParam) : null;
  const packages = selectedRegion
    ? regionalPackages[selectedRegion] || []
    : null;
  if (selectedRegion && packages !== null) {
    return (
      <div className="min-h-screen bg-neutral-50">
        {/* Hero Section */}
        <div className="pt-24 pb-16 border-b border-gray-100 relative overflow-hidden">
          {/* Background gradient orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-linear-to-br from-primary-100/30 to-transparent rounded-full blur-3xl animate-pulse" />
            <div
              className="absolute bottom-0 right-1/4 w-96 h-96 bg-linear-to-br from-primary-100/30 to-transparent rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: "2s" }}
            />
          </div>

          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative z-10 space-y-6"
            >
              {/* Back Button - Use browser history */}
              <motion.button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-primary-700 hover:text-primary-800 font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to regions</span>
              </motion.button>

              {/* Accent Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-linear-to-r from-primary-50 to-primary-100 text-primary-800 px-4 py-2 rounded-full border border-primary-200/50 backdrop-blur-sm w-fit"
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm font-bold uppercase tracking-wider">
                  eSIM Plans
                </span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="text-6xl md:text-7xl font-black leading-tight"
              >
                <span className="text-gray-900">Plans for</span>
                <br />
                <span className="bg-linear-to-r from-primary-900 via-primary-700 to-primary-900 bg-clip-text text-transparent">
                  {selectedRegion}
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-gray-600 max-w-2xl leading-relaxed"
              >
                Browse all available eSIM plans for {selectedRegion}. Choose the
                perfect plan for your connectivity needs.
              </motion.p>
            </motion.div>
          </Container>
        </div>

        {/* Packages Section */}
        <div className="py-20">
          <Container>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-primary-100 rounded-2xl h-40 animate-pulse opacity-60"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 font-semibold">
                  Failed to load packages
                </p>
              </div>
            ) : packages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600 text-lg">
                  No packages available for this region
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <h2 className="text-3xl font-bold text-slate-700">
                  {packages.length} Plan{packages.length !== 1 ? "s" : ""}{" "}
                  Available
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  {packages.map((pkg, idx) => {
                    const name = pkg.name || selectedRegion;
                    const locationCodes = pkg.location ? pkg.location.split(',') : [];
                    return (
                      <div key={`${pkg.packageCode}-${idx}`}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.02 }}
                          className="bg-white/82 rounded-2xl px-5 py-4 flex flex-col gap-3 shadow-[0_16px_32px_rgba(15,23,42,0.07)] hover:shadow-[0_22px_42px_rgba(15,23,42,0.1)] transition-all h-full w-full backdrop-blur-md"
                        >
                          <div className="flex-1">
                            <span className="font-bold text-slate-700 block line-clamp-2 text-sm">
                              {name}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-slate-600">
                              <span className="font-semibold text-slate-700">
                                ${(pkg.price / 100).toFixed(2)}
                              </span>
                              <span className="text-slate-500"> /</span>
                              <span className="text-slate-600">
                                {pkg.volumeGB || pkg.volume}GB
                              </span>
                            </div>
                            <div className="text-right text-slate-600">
                              <span className="font-semibold text-slate-700">
                                {pkg.duration}
                              </span>
                              <span className="text-slate-500">
                                {" "}
                                {pkg.durationUnit}
                              </span>
                            </div>
                          </div>

                          {/* Coverage and Checkout Buttons */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                            <button
                              onClick={() =>
                                setCoverageModal({
                                  isOpen: true,
                                  countryCodes: locationCodes,
                                })
                              }
                              className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-lg text-xs transition-colors"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              Coverage
                            </button>
                            <Link
                              href={`/checkout?packageCode=${pkg.packageCode}&price=${pkg.price}&dataAmount=${pkg.volumeGB}&duration=${pkg.duration}&validity=${pkg.duration}&country=${encodeURIComponent(selectedRegion)}&operatorName=Network%20Operator`}
                            >
                              <button className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-2 px-3 rounded-lg text-xs transition-colors">
                                Buy
                              </button>
                            </Link>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Container>
        </div>

        {/* Coverage Modal */}
        <CoverageModal
          isOpen={coverageModal.isOpen}
          onClose={() =>
            setCoverageModal({ isOpen: false, countryCodes: [] })
          }
          countryCodes={coverageModal.countryCodes}
          regionName={selectedRegion || ''}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <div className="pt-24 pb-16 border-b border-gray-100 relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-linear-to-br from-primary-100/30 to-transparent rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-linear-to-br from-primary-100/30 to-transparent rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 space-y-6"
          >
            {/* Accent Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-linear-to-r from-primary-50 to-primary-100 text-primary-800 px-4 py-2 rounded-full border border-primary-200/50 backdrop-blur-sm w-fit"
            >
              <Zap className="w-4 h-4" />
              <span className="text-sm font-bold uppercase tracking-wider">
                Velox eSIM Solutions
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-6xl md:text-7xl font-black leading-tight"
            >
              <span className="text-gray-900">Browse All</span>
              <br />
              <span className="bg-linear-to-r from-primary-900 via-primary-700 to-primary-900 bg-clip-text text-transparent">
                eSIM Destinations
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 max-w-2xl leading-relaxed"
            >
              Select your destination and discover flexible eSIM plans tailored
              to your connectivity needs. Seamless connectivity, local coverage,
              and 24/7 support.
            </motion.p>
          </motion.div>
        </Container>
      </div>

      {/* Countries Section */}
      <div className="py-20">
        <Container>
          <CountriesShowcase />
        </Container>
      </div>
    </div>
  );
}

export default function ESimPage() {
  return (
    <Suspense fallback={<ESimPageSkeleton />}>
      <ESimPageContent />
    </Suspense>
  );
}
