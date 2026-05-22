'use client';

import Container from '@/components/Container';
import Button from '@/components/Button';
import { useState, useEffect } from 'react';
import { Download, QrCode, Wifi, CheckCircle, Globe, Zap, DollarSign, Lock, Smartphone, Headphones } from 'lucide-react';
import Link from 'next/link';

export default function HowItWorksPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const steps = [
    {
      number: 1,
      icon: Download,
      title: 'Download the App',
      description: 'Get the Velox eSIM app from your device\'s app store and create an account.',
      color: 'from-primary-500 to-primary-800',
    },
    {
      number: 2,
      icon: QrCode,
      title: 'Choose Your Plan',
      description: 'Browse our wide selection of eSIM plans for your destination country.',
      color: 'from-purple-500 to-pink-600',
    },
    {
      number: 3,
      icon: Wifi,
      title: 'Install eSIM',
      description: 'Scan the QR code with your device and complete the installation in seconds.',
      color: 'from-orange-500 to-red-600',
    },
    {
      number: 4,
      icon: CheckCircle,
      title: 'Stay Connected',
      description: 'Select your eSIM as the primary network and enjoy seamless global connectivity.',
      color: 'from-primary-500 to-primary-700',
    },
  ];

  const features = [
    { icon: Globe, title: '190+ Countries', description: 'Coverage in over 190 destinations' },
    { icon: Zap, title: 'Instant Activation', description: 'No waiting, activate in seconds' },
    { icon: DollarSign, title: 'Best Prices', description: 'Competitive rates with no hidden fees' },
    { icon: Lock, title: 'Secure', description: 'Enterprise-grade data protection' },
    { icon: Smartphone, title: 'Multi-Device', description: 'Use on multiple compatible devices' },
    { icon: Headphones, title: '24/7 Support', description: 'Customer support whenever you need it' },
  ];

  return (
    <div className="bg-neutral-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 bg-neutral-50">
        <div className="absolute inset-0 bg-neutral-50/70 blur-3xl" />

        <Container>
          <div className={`relative z-10 text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-5xl md:text-6xl font-black mb-6 text-gray-900">
              How Velox eSIM Works
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Get connected globally in just 4 simple steps. No contracts, no complexity.
            </p>
          </div>
        </Container>
      </section>

      {/* Steps Section */}
      <section className="py-20">
        <Container>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className={`group relative rounded-2xl bg-white border border-neutral-300 p-8 shadow-md transition-all duration-500 hover:shadow-lg ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: isLoaded ? `${150 * i}ms` : '0ms' }}
                >
                  <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold shadow-lg">
                    {step.number}
                  </div>

                  <div className={`w-14 h-14 rounded-xl bg-linear-to-br ${step.color} mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-xl font-bold mb-3 text-gray-900">{step.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>

                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-0.5 bg-neutral-300" />
                  )}
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <Container>
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Why Choose Velox eSIM?</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={i}
                  className={`rounded-xl bg-white border border-neutral-300 p-6 shadow-md hover:shadow-lg transition-all duration-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: isLoaded ? `${200 * i}ms` : '0ms' }}
                >
                  <IconComponent className="w-10 h-10 text-gray-900 mb-4" />
                  <h3 className="text-lg font-black mb-2 text-gray-950">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <Container>
          <div className="rounded-3xl bg-neutral-100 border border-neutral-300 p-12 md:p-16 text-center shadow-md">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Ready to Get Connected?</h2>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              Start your journey to global connectivity today. Choose from 190+ countries and get connected instantly.
            </p>
            <Link href="/esim">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white text-lg px-8 py-4 transition-all duration-300">
                View eSIM Plans
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}

