"use client";

import Button from "@/components/Button";
import Container from "@/components/Container";
import { CountriesShowcase } from "@/components/CountriesShowcase";
import { Section3D } from "@/components/Section3D";
import { motion } from "framer-motion";
import { Globe, Shield, Wifi, Zap } from "lucide-react";
import Link from "next/link";

export function FeaturedPlans() {
  const features = [
    {
      icon: <Wifi className="w-8 h-8" />,
      title: "Global Coverage",
      description:
        "eSIM plans available in 140+ countries and regions worldwide",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Activation",
      description: "Start using your eSIM within minutes of purchase",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Flexible Plans",
      description: "1GB to 50GB data with validity from 7 days to 90 days",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Reliable",
      description: "Industry-leading eSIM provider with 99.9% uptime",
    },
  ];

  return (
    <div className="pt-20 bg-white relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-linear-to-br from-neutral-200/30 to-transparent rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-linear-to-br from-neutral-200/20 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <Container>
        {/* Section Header */}

        {/* Countries Grid Section */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10"
        >
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-4xl md:text-5xl font-bold text-gray-900">
                  Explore Our Destinations
                </h3>
                <p className="text-gray-700 mt-2 text-lg">
                  Connect in 190+ countries with local coverage and 24/7 support
                </p>
              </div>
              <motion.div whileHover={{ x: 4 }}>
                <Link href="/esim">
                  <Button className="bg-black hover:bg-gray-900 text-white shadow-md hover:shadow-lg transition-all duration-300">
                    View All Countries
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>

          <CountriesShowcase />
        </motion.div>
        <Section3D className="text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="inline-flex items-center gap-3 bg-linear-to-r from-neutral-200/50 to-neutral-100/50 text-gray-900 px-6 py-3 rounded-full mb-6 border border-neutral-300 backdrop-blur-sm">
              <Wifi className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">
                Featured Velox eSIM Plans
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
              Stay Connected
              <br />
              <span className="bg-linear-to-r from-gray-900 via-gray-700 to-gray-600 bg-clip-text text-transparent">
                Anywhere, Anytime
              </span>
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Get high-speed internet connectivity with affordable eSIM plans
              from the world&apos;s leading providers. 140+ countries, instant
              activation.
            </p>
          </motion.div>
        </Section3D>
        {/* Features Grid */}

        <Section3D className="mb-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0 }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 },
              },
            }}
            className="grid grid-cols-1 mt-10 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title || idx}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <div className="group relative p-8 rounded-2xl bg-linear-to-br from-neutral-50/80 to-white border border-neutral-200 hover:border-neutral-300 shadow-sm hover:shadow-md transition-all duration-500 backdrop-blur-sm h-full">
                  <div className="absolute inset-0 bg-linear-to-br from-neutral-100/30 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10">
                    <div className="text-gray-900 mb-4 text-5xl opacity-80 group-hover:opacity-100 transition-opacity">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Section3D>

        {/* CTA Section */}
        <Section3D className="mt-24">
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.4 }}
            className="relative p-12 md:p-16 bg-white border-2 border-neutral-300 rounded-3xl text-center shadow-lg overflow-hidden"
          >
            <div className="relative z-10">
              <h3 className="text-4xl md:text-5xl font-black mb-6 text-gray-900">
                Explore All eSIM Plans
              </h3>
              <p className="text-gray-700 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                Choose from thousands of plans across 190+ countries. Get
                instant activation, transparent pricing, and 24/7 support.
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/esim">
                  <Button className="bg-gray-900 text-white hover:bg-gray-800 font-bold px-10 py-4 text-lg shadow-lg transition-all duration-300">
                    Browse All Plans
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </Section3D>
      </Container>
    </div>
  );
}

export default FeaturedPlans;
