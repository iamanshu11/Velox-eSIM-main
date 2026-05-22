'use client';

import Container from '@/components/Container';
import Button from '@/components/Button';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Calendar, User, ArrowRight, Loader } from 'lucide-react';
import { useListPublicBlogPostsQuery } from '@/store/slices/blogSlice';

const colorMap: Record<string, string> = {
  Technology: 'bg-linear-to-br from-primary-700 to-primary-500',
  Travel: 'bg-linear-to-br from-purple-500 to-pink-500',
  Education: 'bg-linear-to-br from-orange-500 to-red-500',
  'How-To': 'bg-linear-to-br from-green-500 to-emerald-500',
  News: 'bg-linear-to-br from-blue-500 to-cyan-500',
};

export default function BlogPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const { data, isLoading } = useListPublicBlogPostsQuery({ page: 1, limit: 20 });

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const posts = data?.posts || [];
  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);

  const getAuthorName = (post: any) => {
    return post.authors?.[0]?.user?.name || 'Unknown Author';
  };

  const getPublishedDate = (post: any) => {
    return new Date(post.publishedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-neutral-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 bg-linear-to-br from-gray-50 to-gray-100">
        <div className="absolute inset-0 bg-linear-to-br from-primary-100/20 via-purple-100/10 to-pink-100/20 blur-3xl" />
        <Container>
          <div className={`relative z-10 text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-5xl md:text-6xl font-black mb-6 text-gray-900">
              eSIM Insights & Updates
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Stay informed with the latest news, tips, and stories from the eSIM revolution
            </p>
          </div>
        </Container>
      </section>

      {isLoading ? (
        <section className="py-20 text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-600 mt-4">Loading articles...</p>
        </section>
      ) : posts.length === 0 ? (
        <section className="py-20 text-center">
          <p className="text-gray-600">No blog posts available yet.</p>
        </section>
      ) : (
        <>
          {/* Featured Post */}
          {featuredPost && (
            <section className="py-20">
              <Container>
                <div className={`rounded-3xl overflow-hidden border-2 border-neutral-300 shadow-md transition-all duration-1000 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="relative h-96 md:h-full bg-gray-200">
                      {featuredPost.featuredImage ? (
                        <Image
                          src={featuredPost.featuredImage}
                          alt={featuredPost.title}
                          fill
                          className="object-cover"
                          priority
                        />
                      ) : (
                        <div className={`${colorMap[featuredPost.category] || 'bg-linear-to-br from-primary-700 to-primary-500'} w-full h-full`} />
                      )}
                    </div>
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                      <span className="text-sm font-bold text-primary-700 mb-3 uppercase tracking-wide">{featuredPost.category}</span>
                      <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">{featuredPost.title}</h2>
                      <p className="text-lg text-gray-700 mb-6 leading-relaxed">{featuredPost.excerpt}</p>
                      <div className="flex items-center gap-4 mb-6 text-gray-600 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {getPublishedDate(featuredPost)}
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {getAuthorName(featuredPost)}
                        </div>
                      </div>
                      <Link href={`/blog/${featuredPost.slug}`} className="inline-flex items-center gap-2 text-gray-900 hover:text-primary-700 font-bold transition-colors">
                        Read Article <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </Container>
            </section>
          )}

          {/* Blog Posts Grid */}
          {otherPosts.length > 0 && (
            <section className="py-20">
              <Container>
                <h2 className="text-3xl font-bold mb-12 text-gray-900">Latest Articles</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {otherPosts.map((post: any, i: number) => (
                    <div
                      key={post.id}
                      className={`rounded-2xl bg-white border-2 border-neutral-300 overflow-hidden hover:border-primary-500 transition-all duration-300 hover:shadow-lg ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                      style={{ transitionDelay: isLoaded ? `${150 * i}ms` : '0ms' }}
                    >
                      <div className="relative h-48 bg-gray-200">
                        {post.featuredImage ? (
                          <Image
                            src={post.featuredImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className={`${colorMap[post.category] || 'bg-linear-to-br from-primary-700 to-primary-500'} w-full h-full`} />
                        )}
                      </div>
                      <div className="p-6">
                        <span className="text-xs font-bold text-primary-700 uppercase tracking-wide">{post.category}</span>
                        <h3 className="text-xl font-bold text-gray-900 mt-3 mb-3">{post.title}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                        <div className="flex items-center justify-between text-gray-600 text-xs mb-4">
                          <span>{getPublishedDate(post)}</span>
                          <span>{getAuthorName(post)}</span>
                        </div>
                        <Link href={`/blog/${post.slug}`} className="text-gray-900 hover:text-primary-700 font-bold text-sm transition-colors flex items-center gap-2">
                          Read More <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </Container>
            </section>
          )}
        </>
      )}

      {/* Newsletter Section */}
      <section className="py-20">
        <Container>
          <div className="rounded-3xl bg-linear-to-r from-primary-50 to-primary-100 border-2 border-neutral-300 p-12 md:p-16 text-center shadow-md">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Subscribe to Our Newsletter</h2>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              Get the latest eSIM news, travel tips, and exclusive offers delivered to your inbox every week.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border-2 border-neutral-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-700"
              />
              <Button className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 transition-all duration-300">
                Subscribe
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

