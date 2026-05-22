'use client';

import Container from '@/components/Container';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Calendar, User, Plane, Sparkles, DollarSign, MapPin, Shield, Smartphone } from 'lucide-react';

const ARTICLE_ICONS: Record<string, React.ReactNode> = {
  Plane: <Plane className="w-8 h-8" />,
  Sparkles: <Sparkles className="w-8 h-8" />,
  DollarSign: <DollarSign className="w-8 h-8" />,
  MapPin: <MapPin className="w-8 h-8" />,
  Shield: <Shield className="w-8 h-8" />,
  Smartphone: <Smartphone className="w-8 h-8" />,
};

export default function MagazinePage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const articles = [
    {
      id: 1,
      title: '5 Essential Travel Tips for Digital Nomads',
      excerpt: 'Discover the best practices for staying connected while traveling the world.',
      author: 'Sarah Johnson',
      date: 'Feb 2, 2026',
      icon: 'Plane',
      category: 'Travel',
      readTime: '5 min read',
    },
    {
      id: 2,
      title: 'The Future of eSIM Technology',
      excerpt: 'Exploring the latest innovations in global connectivity solutions.',
      author: 'Mike Chen',
      date: 'Jan 28, 2026',
      icon: 'Sparkles',
      category: 'Technology',
      readTime: '7 min read',
    },
    {
      id: 3,
      title: 'Budget Travel: How eSIMs Save You Money',
      excerpt: 'Learn how to save up to 70% on roaming charges with strategic eSIM planning.',
      author: 'Emma Davis',
      date: 'Jan 15, 2026',
      icon: 'DollarSign',
      category: 'Budget',
      readTime: '6 min read',
    },
    {
      id: 4,
      title: 'Top 10 eSIM-Friendly Destinations',
      excerpt: 'Countries with the best eSIM coverage and infrastructure for travelers.',
      author: 'Lisa Wong',
      date: 'Jan 8, 2026',
      icon: 'MapPin',
      category: 'Destinations',
      readTime: '4 min read',
    },
    {
      id: 5,
      title: 'Data Security: Protecting Your Connection',
      excerpt: 'Everything you need to know about staying secure on eSIM networks worldwide.',
      author: 'John Smith',
      date: 'Dec 28, 2025',
      icon: 'Shield',
      category: 'Security',
      readTime: '8 min read',
    },
    {
      id: 6,
      title: 'eSIM vs Physical SIM: A Complete Comparison',
      excerpt: 'Understand the advantages and disadvantages of making the switch to eSIM.',
      author: 'Alex Rodriguez',
      date: 'Dec 15, 2025',
      icon: 'Smartphone',
      category: 'Education',
      readTime: '6 min read',
    },
  ];

  return (
    <div className="bg-neutral-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 bg-neutral-50">
        <div className="absolute inset-0 bg-neutral-50/70 blur-3xl" />

        <Container>
          <div className={`relative z-10 text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-5xl md:text-6xl font-black mb-6 text-gray-900">
              Velox eSIM Magazine
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Insights, tips, and stories from the global connectivity revolution
            </p>
          </div>
        </Container>
      </section>

      {/* Featured Article */}
      <section className="py-12">
        <Container>
          <div className={`rounded-3xl overflow-hidden bg-white border border-neutral-300 shadow-md hover:shadow-lg transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="grid md:grid-cols-2 gap-0">
              <div className="h-64 md:h-full bg-neutral-100 border-r border-neutral-300 flex items-center justify-center">
                <div className="text-center text-gray-600">Featured Article</div>
              </div>
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="inline-block mb-4 px-3 py-1 rounded-full bg-neutral-200 border border-neutral-300 text-gray-700 text-xs font-semibold w-fit">
                  Featured Article
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">{articles[0].title}</h2>
                <p className="text-gray-600 text-lg mb-6">{articles[0].excerpt}</p>
                <div className="flex items-center gap-6 mb-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {articles[0].author}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {articles[0].date}
                  </div>
                  <span>{articles[0].readTime}</span>
                </div>
                <Link href={`/magazine/${articles[0].id}`}>
                  <button className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-700 transition-colors font-semibold group">
                    Read More
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Articles Grid */}
      <section className="py-20">
        <Container>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.slice(1).map((article, i) => (
              <Link key={article.id} href={`/magazine/${article.id}`}>
                <div
                  className={`rounded-2xl bg-white border border-neutral-300 overflow-hidden hover:shadow-lg transition-all duration-500 group cursor-pointer shadow-md ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: isLoaded ? `${150 * (i + 1)}ms` : '0ms' }}
                >
                  <div className="h-40 bg-neutral-100 flex items-center justify-center text-sm text-gray-500 font-medium">
                    {ARTICLE_ICONS[article.icon]}
                  </div>
                  <div className="p-6">
                    <div className="mb-3 inline-block px-2 py-1 rounded-full bg-neutral-200 border border-neutral-300 text-gray-700 text-xs font-semibold">
                      {article.category}
                    </div>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-gray-700 transition-colors line-clamp-2 text-gray-900">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{article.excerpt}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-300">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {article.date}
                      </div>
                      <span className="text-xs text-gray-600">{article.readTime}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <Container>
          <div className="rounded-3xl bg-neutral-100 border border-neutral-300 p-12 md:p-16 text-center shadow-md">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Never Miss an Update</h2>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter for the latest eSIM tips, travel stories, and industry insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-3 rounded-lg bg-white border border-neutral-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
              />
              <button className="px-6 py-3 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-semibold transition-all duration-300 whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

