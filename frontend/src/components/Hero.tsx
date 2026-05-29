'use client';

import React from 'react';
import { ArrowRight, Signal, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import SearchBar from './SearchBar';

const AVATARS = [
  { initials: 'JK', bg: 'from-[#fb3d77] to-[#d23284]' },
  { initials: 'MR', bg: 'from-[#0058be] to-[#2170e4]' },
  { initials: 'AS', bg: 'from-[#545c72] to-[#6c748b]' },
];

const Hero: React.FC = () => {
  return (
    <section className="bg-mesh py-14 sm:py-20 md:py-28 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">

        {/* ── Left column ────────────────────────────────────────────────── */}
        <div className="relative z-10 space-y-6 sm:space-y-8">

          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d8e2ff] text-[#001a42]">
            <span className="pulse-node w-2 h-2 rounded-full bg-[#0058be] inline-block" />
            <span className="font-mono text-xs font-medium tracking-[0.05em] uppercase">
              Global Connectivity Live
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-sora text-4xl sm:text-5xl lg:text-[3.25rem] font-bold leading-[1.1] tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#fb3d77] to-[#0058be]">
              Connectivity, Redefined.
            </span>
            <br />
            <span className="text-[#191c1e]">Travel the world without limits.</span>
          </h1>

          {/* Subtext */}
          <p className="text-[#574048] text-base sm:text-lg max-w-lg leading-relaxed">
            Experience the next generation of mobile freedom. Instant activation,
            enterprise-grade security, and 5G coverage across 190+ countries.
            No physical cards, no roaming fees.
          </p>

          {/* Country / destination search */}
          <SearchBar />

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/esim" className="flex-shrink-0">
              <button className="velox-btn-primary w-full sm:w-auto group">
                Start Exploring Plans
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/device-compatibility" className="flex-shrink-0">
              <button className="velox-btn-outline w-full sm:w-auto">
                Check Compatibility
              </button>
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-6 pt-2">
            <div className="flex -space-x-3">
              {AVATARS.map((a, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br ${a.bg} flex items-center justify-center text-white text-xs font-bold`}
                >
                  {a.initials}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-bold text-[#191c1e]">Trusted by 2M+ travelers</p>
              <div className="flex text-yellow-400 gap-0.5 mt-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column — phone mockup ──────────────────────────────── */}
        <div className="relative hidden lg:block">
          {/* Ambient glow orbs */}
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-[#fb3d77]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-[#0058be]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Glass phone card */}
          <div className="relative glass-card p-4 rounded-[2rem] shadow-2xl rotate-2">
            <Image
              src="/images/hero.png"
              alt="Velox eSIM — global connectivity"
              width={560}
              height={560}
              priority
              className="rounded-[1.5rem] w-full h-[420px] object-cover"
            />

            {/* Floating 5G chip */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-10 bg-white p-3.5 rounded-2xl shadow-xl border border-gray-100 -rotate-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#fb3d77]/10 flex items-center justify-center text-[#fb3d77]">
                  <Signal className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">5G Active</p>
                  <p className="text-[10px] text-gray-500">London, UK</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
