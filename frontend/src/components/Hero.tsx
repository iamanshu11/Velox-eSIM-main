'use client';

import AnimatedCounter from '@/components/AnimatedCounter';
import SearchBar from '@/components/SearchBar';
import { motion } from 'framer-motion';
import { ArrowRight, Globe, Shield, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const STATS = [
  { icon: Globe, value: 150, suffix: '+', label: 'Countries Covered' },
  { icon: Zap, value: 2, suffix: ' min', label: 'Instant Setup' },
  { icon: Shield, value: 100, suffix: '%', label: 'Digital Only' },
];

const Hero: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  return (
    <div className="relative w-full min-h-svh overflow-visible">
      {/* Full-screen background image */}
      <Image
        src="/images/hero.png"
        alt="Global eSIM connectivity"
        fill
        priority
        quality={95}
        className="object-cover"
      />

      {/* Animated radial glow */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle 500px at 15% 55%, rgba(67,161,240,0.10) 0%, transparent 70%)',
        }}
        animate={{ opacity: [0.4, 0.75, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content */}
      <div className="relative w-full min-h-svh flex z-10">
        <motion.div
          className="w-full lg:w-[45%] pt-28 sm:pt-32 lg:pt-36 pl-6 sm:pl-10 lg:pl-20 pr-6 sm:pr-10 flex flex-col justify-start pb-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >

          {/* Main headline */}
          <motion.div variants={itemVariants} className="mb-5">
            <p className="text-xs sm:text-sm font-bold text-primary-600 uppercase tracking-[0.15em] mb-3">
              Finding Your Next Destination?
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] font-black text-slate-950 leading-[1.1] tracking-tight">
              Where Do You Need an
              <span className="block text-primary-700 drop-shadow-sm mt-1">
                eSIM Plan?
              </span>
            </h1>
          </motion.div>

          {/* Subheadline */}
          <motion.div variants={itemVariants} className="mb-7">
            <p className="text-base sm:text-lg text-slate-600 font-medium max-w-lg leading-relaxed">
              Search your destination and get instant eSIM activation — no physical SIM needed.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div variants={itemVariants} className="mb-6">
            <SearchBar />
          </motion.div>

          {/* Stats */}
          <motion.div variants={itemVariants} className="mb-8 flex flex-wrap gap-3">
            {STATS.map(({ icon: Icon, value, suffix, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/75 backdrop-blur-sm border border-white/60 shadow-[0_8px_24px_rgba(15,23,42,0.07)]"
              >
                <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-xl font-black text-primary-700 leading-none">
                    <AnimatedCounter from={0} to={value} suffix={suffix} />
                  </p>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* CTA buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
            <Link href="/esim">
              <motion.button
                className="px-8 py-4 bg-primary-700 text-white font-bold text-base rounded-2xl shadow-[0_16px_40px_rgba(67,161,240,0.28)] hover:shadow-[0_20px_48px_rgba(67,161,240,0.34)] hover:bg-primary-800 transition-all duration-300 flex items-center gap-3 whitespace-nowrap"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <motion.button
              className="px-8 py-4 bg-white/80 backdrop-blur-sm text-slate-800 font-bold text-base rounded-2xl shadow-[0_10px_28px_rgba(15,23,42,0.08)] hover:bg-white hover:shadow-[0_14px_36px_rgba(15,23,42,0.12)] transition-all duration-300 border border-white/70 whitespace-nowrap"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Learn More
            </motion.button>
          </motion.div>

          {/* Micro trust note */}
          <motion.p
            variants={itemVariants}
            className="mt-4 text-xs text-slate-500 font-medium"
          >
            No commitments · Instant activation · Works on any unlocked phone
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
