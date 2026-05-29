'use client';

import { Suspense } from 'react';
import Hero from '@/components/Hero';
import PackageShowcase from '@/components/PackageShowcase';
import Link from 'next/link';
import Image from 'next/image';
import {
  Zap,
  Globe,
  CreditCard,
  ShoppingCart,
  QrCode,
  Wifi,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

// ── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Zap,
    title: 'Instant Activation',
    body: 'Get online in under 2 minutes. Purchase, scan QR, and start browsing immediately upon arrival.',
    accent: '#fb3d77',
    bg: 'bg-[#ffd9e4]',
  },
  {
    icon: Globe,
    title: 'Global Coverage',
    body: 'Seamless roaming in over 190 countries with local rates and multiple network redundancy.',
    accent: '#0058be',
    bg: 'bg-[#d8e2ff]',
  },
  {
    icon: CreditCard,
    title: 'No Hidden Fees',
    body: 'Transparent prepaid plans. No contracts, no monthly bills, and absolutely no surprises.',
    accent: '#545c72',
    bg: 'bg-[#dae2fd]',
  },
];

const DESTINATIONS = [
  {
    region: 'Asia',
    city: 'Tokyo, Japan',
    price: 'From $4.50 / GB',
    image: '/videos/eSim-hero/eSim-20.jpg',
  },
  {
    region: 'Americas',
    city: 'Rio, Brazil',
    price: 'From $6.00 / GB',
    image: '/videos/eSim-hero/eSim-70.jpg',
  },
  {
    region: 'Europe',
    city: 'Paris, France',
    price: 'From $3.90 / GB',
    image: '/videos/eSim-hero/eSim-120.jpg',
  },
];

const STEPS = [
  {
    num: '1',
    icon: ShoppingCart,
    title: 'Choose Your Plan',
    body: 'Select your destination and data package that fits your trip duration and usage.',
  },
  {
    num: '2',
    icon: QrCode,
    title: 'Scan QR Code',
    body: 'Receive your eSIM QR code instantly via email. Scan it in your phone settings to install.',
  },
  {
    num: '3',
    icon: Wifi,
    title: 'Connect Instantly',
    body: 'Toggle your new line on and enjoy high-speed data as soon as you land.',
  },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────

function PackageShowcaseSkeleton() {
  return (
    <div className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="bg-[#f7f9fb]">

      {/* Hero */}
      <Hero />

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-14 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-14 space-y-3">
            <h2 className="font-sora text-3xl md:text-4xl font-bold text-[#191c1e]">
              Engineered for Performance
            </h2>
            <p className="text-[#574048] max-w-2xl mx-auto text-base md:text-lg">
              Skip the physical store and stay connected everywhere with our enterprise-grade eSIM technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map(({ icon: Icon, title, body, accent, bg }) => (
              <div
                key={title}
                className="p-8 rounded-2xl border border-gray-100 hover:border-[#fb3d77]/30 hover:shadow-lg transition-all duration-200 group"
              >
                <div
                  className={`w-14 h-14 ${bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200`}
                >
                  <Icon className="w-7 h-7" style={{ color: accent }} />
                </div>
                <h3 className="font-sora text-xl font-bold text-[#191c1e] mb-3">{title}</h3>
                <p className="text-[#574048] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Plans showcase ───────────────────────────────────────────────── */}
      <section className="bg-[#f7f9fb]">
        <Suspense fallback={<PackageShowcaseSkeleton />}>
          <PackageShowcase />
        </Suspense>
      </section>

      {/* ── Trending Destinations ────────────────────────────────────────── */}
      <section className="py-14 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-end mb-10">
            <div className="space-y-2">
              <h2 className="font-sora text-2xl sm:text-3xl md:text-4xl font-bold text-[#191c1e]">
                Trending Destinations
              </h2>
              <p className="text-[#574048] text-sm sm:text-base">
                Our most popular hotspots for digital nomads and travelers.
              </p>
            </div>
            <Link
              href="/esim"
              className="hidden sm:flex items-center gap-1 text-[#0058be] font-bold hover:text-[#fb3d77] transition-colors text-sm whitespace-nowrap ml-4"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {DESTINATIONS.map(({ region, city, price, image }) => (
              <Link href="/esim" key={city}>
                <div className="group relative overflow-hidden rounded-2xl aspect-[4/5] sm:aspect-[3/4] shadow-md cursor-pointer">
                  <Image
                    src={image}
                    alt={city}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 w-full p-5 text-white">
                    <p className="font-mono text-[10px] opacity-70 mb-1 uppercase tracking-[0.2em]">
                      {region}
                    </p>
                    <h3 className="font-sora text-lg sm:text-xl font-bold">{city}</h3>
                    <div className="mt-3 inline-block px-3 py-1 bg-[#fb3d77] rounded-full">
                      <p className="text-xs font-bold">{price}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/esim"
              className="inline-flex items-center gap-1 text-[#0058be] font-bold hover:text-[#fb3d77] transition-colors"
            >
              View All Coverage
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="py-14 md:py-20 bg-[#f7f9fb] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="font-sora text-2xl sm:text-3xl md:text-4xl font-bold text-[#191c1e]">
              Simple 3-Step Setup
            </h2>
            <p className="text-[#574048] mt-3 text-base md:text-lg">
              Stay connected without the fuss of traditional SIM cards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-12 relative">
            {/* Connecting dashed line — sm+ only */}
            <div
              className="hidden sm:block absolute top-10 left-[calc(16.6%+40px)] right-[calc(16.6%+40px)] h-0.5 border-t-2 border-dashed border-gray-300"
              aria-hidden
            />

            {STEPS.map(({ num, icon: Icon, title, body }) => (
              <div key={num} className="text-center space-y-5">
                <div className="relative inline-block">
                  <div className="w-20 h-20 bg-white border-2 border-[#fb3d77]/20 rounded-full flex items-center justify-center text-[#fb3d77] text-3xl font-bold font-sora shadow-sm">
                    {num}
                  </div>
                  <div className="absolute -top-2 -right-2 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                    <Icon className="w-5 h-5 text-[#0058be]" />
                  </div>
                </div>
                <h3 className="font-sora text-lg sm:text-xl font-bold text-[#191c1e]">{title}</h3>
                <p className="text-[#574048] px-2 sm:px-4 leading-relaxed text-sm sm:text-base">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="py-14 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="bg-[#fb3d77] rounded-2xl sm:rounded-[2.5rem] px-6 sm:px-8 py-12 md:py-16 md:px-16 text-center text-white relative overflow-hidden shadow-2xl">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, transparent 70%)',
              }}
            />
            <div className="relative z-10 space-y-6 sm:space-y-8 max-w-3xl mx-auto">
              <h2 className="font-sora text-2xl sm:text-4xl md:text-5xl font-bold text-white">
                Ready for your next adventure?
              </h2>
              <p className="text-white/90 text-base sm:text-xl">
                Join millions of travelers who have chosen the faster, smarter way to stay connected globally.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/esim">
                  <button className="w-full sm:w-auto bg-white text-[#fb3d77] px-8 sm:px-10 py-4 rounded-xl font-bold hover:scale-105 transition-transform inline-flex items-center justify-center gap-2">
                    Get Your eSIM Now
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                <Link href="/contact">
                  <button className="w-full sm:w-auto bg-white/15 text-white px-8 sm:px-10 py-4 rounded-xl font-bold border border-white/30 hover:bg-white/25 transition-all">
                    Contact Enterprise
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
