'use client';

import { Suspense } from 'react';
import Hero from '@/components/Hero';
import PackageShowcase from '@/components/PackageShowcase';

export const dynamic = 'force-dynamic';

function PackageShowcaseSkeleton() {
  return (
    <div className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-primary-50">
      {/* Hero with embedded SearchBar - extends from top with negative margin to override layout padding */}
      <div className="-mt-16">
        <Hero />
      </div>

      {/* Package Showcase Section */}
      <section className="relative z-10 w-full bg-primary-50">
        <Suspense fallback={<PackageShowcaseSkeleton />}>
          <PackageShowcase />
        </Suspense>
      </section>
    </div>
  );
}




