'use client';

import Container from '@/components/Container';
import Button from '@/components/Button';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Globe, Zap, Lock, Gem } from 'lucide-react';
import { useCounter } from '@/hooks/useCounter';

export default function AboutPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const values = [
    {
      title: 'Accessibility',
      description: 'Making global connectivity affordable and accessible to everyone, everywhere.',
      icon: Globe,
    },
    {
      title: 'Innovation',
      description: 'Constantly pushing boundaries to deliver cutting-edge eSIM technology.',
      icon: Zap,
    },
    {
      title: 'Reliability',
      description: 'Ensuring 99.9% uptime and seamless connections worldwide, 24/7.',
      icon: Lock,
    },
    {
      title: 'Customer Focus',
      description: 'Your success is our priority. We provide exceptional support always.',
      icon: Gem,
    },
  ];

  return (
    <div className="bg-neutral-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 bg-neutral-50">
        <div className="absolute inset-0 bg-neutral-50/70 blur-3xl" />

        <Container>
          <div className={`relative z-10 text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-5xl md:text-6xl font-black mb-6">
              About Velox eSIM
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Revolutionizing global connectivity one eSIM at a time
            </p>
          </div>
        </Container>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <Container>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <h2 className="text-4xl font-bold mb-6">Our Story</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-4">
                Founded in 2020, Velox eSIM emerged from a simple vision: to make global connectivity as simple as downloading an app.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed mb-4">
                We recognized that traditional SIM cards were becoming obsolete, and we wanted to build a platform that leveraged eSIM technology to empower travelers, digital nomads, and businesses worldwide.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                Today, we serve millions of users across 190+ countries, proud to be at the forefront of the eSIM revolution.
              </p>
            </div>

            <div className={`relative h-80 rounded-2xl bg-neutral-100 border border-neutral-300 flex items-center justify-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div className="text-gray-400 text-center">
                <p className="font-semibold">Global Connectivity</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Our Core Values</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => {
              const IconComponent = value.icon;
              return (
                <div
                  key={i}
                  className={`rounded-2xl bg-white border border-neutral-300 p-8 shadow-md hover:shadow-lg transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: isLoaded ? `${150 * i}ms` : '0ms' }}
                >
                  <div className="mb-4"><IconComponent className="w-12 h-12 text-gray-900" /></div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{value.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <Container>
          <StatsSection />
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <Container>
          <div className="rounded-3xl bg-neutral-100 border border-neutral-300 p-12 md:p-16 text-center shadow-md">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Join the Global Community</h2>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              Be part of the eSIM revolution and experience connectivity like never before.
            </p>
            <Link href="/register">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white text-lg px-8 py-4 transition-all duration-300">
                Get Started Now
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}

function StatsSection() {
  const users = useCounter({ target: 2, duration: 2000, suffix: 'M+' });
  const countries = useCounter({ target: 190, duration: 2000, suffix: '+' });
  const team = useCounter({ target: 50, duration: 2000, suffix: '+' });

  return (
    <div ref={users.ref} className="rounded-2xl bg-neutral-100 border border-neutral-300 p-12 shadow-md">
      <div className="grid md:grid-cols-4 gap-8 text-center">
        <div>
          <div className="text-4xl font-black text-gray-900">{users.count}</div>
          <p className="text-gray-600 mt-2">Active Users</p>
        </div>
        <div>
          <div className="text-4xl font-black text-gray-900">{countries.count}</div>
          <p className="text-gray-600 mt-2">Countries</p>
        </div>
        <div>
          <div className="text-4xl font-black text-gray-900">{team.count}</div>
          <p className="text-gray-600 mt-2">Team Members</p>
        </div>
        <div>
          <div className="text-4xl font-black text-gray-900">99.9%</div>
          <p className="text-gray-600 mt-2">Uptime</p>
        </div>
      </div>
    </div>
  );
}

