'use client';

import Container from '@/components/Container';
import Button from '@/components/Button';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Calendar, User, ArrowLeft, Loader } from 'lucide-react';
import { useGetPublicBlogPostQuery } from '@/store/slices/blogSlice';

const colorMap: Record<string, string> = {
  Technology: 'bg-linear-to-br from-primary-700 to-primary-500',
  Travel: 'bg-linear-to-br from-purple-500 to-pink-500',
  Education: 'bg-linear-to-br from-orange-500 to-red-500',
  'How-To': 'bg-linear-to-br from-green-500 to-emerald-500',
  News: 'bg-linear-to-br from-blue-500 to-cyan-500',
};

export default function BlogArticlePage() {
  const params = useParams();
  const id = params.id as string;
  const [isLoaded, setIsLoaded] = useState(false);
  const { data: post, isLoading, isError } = useGetPublicBlogPostQuery(id, { skip: !id });

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-neutral-50 min-h-screen flex items-center justify-center">
        <Container>
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-600 mt-4">Loading article...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="bg-neutral-50 min-h-screen flex items-center justify-center">
        <Container>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Article Not Found</h1>
            <p className="text-gray-600 mb-8">The article you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/blog">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3">
                Back to Blog
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const getAuthorName = () => {
    return post.authors?.[0]?.user?.name || 'Unknown Author';
  };

  const getPublishedDate = () => {
    return new Date(post.publishedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-neutral-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className={`${colorMap[post.category] || 'bg-linear-to-br from-primary-700 to-primary-500'} absolute inset-0 opacity-10 blur-3xl`} />
        <Container>
          <div className={`relative z-10 max-w-4xl transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Link href="/blog" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
            <span className="text-sm font-bold text-primary-700 uppercase tracking-wide mb-3 block">{post.category}</span>
            <h1 className="text-5xl md:text-6xl font-black mb-6 text-gray-900 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-6 text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {getPublishedDate()}
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {getAuthorName()}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Featured Image */}
      <section className="py-12">
        <Container>
          <div className="relative rounded-2xl h-96 shadow-lg bg-gray-200 overflow-hidden">
            {post.featuredImage ? (
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className={`${colorMap[post.category] || 'bg-linear-to-br from-primary-700 to-primary-500'} w-full h-full`} />
            )}
          </div>
        </Container>
      </section>

      {/* Article Content */}
      <section className="py-20">
        <Container>
          <div className={`prose prose-lg max-w-none text-gray-700 transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <article 
              className="space-y-6"
              dangerouslySetInnerHTML={{ 
                __html: post.content
                  .replace(/<h2>/g, '<h2 class="text-3xl font-bold text-gray-900 mt-8 mb-4">')
                  .replace(/<h3>/g, '<h3 class="text-2xl font-bold text-gray-900 mt-6 mb-3">')
                  .replace(/<p>/g, '<p class="text-gray-700 leading-relaxed">')
                  .replace(/<ul>/g, '<ul class="list-disc list-inside space-y-2">')
                  .replace(/<li>/g, '<li class="text-gray-700">')
                  .replace(/<ol>/g, '<ol class="list-decimal list-inside space-y-2">')
                  .replace(/<table>/g, '<table class="w-full border-collapse border border-gray-300">')
                  .replace(/<tr>/g, '<tr class="border border-gray-300">')
                  .replace(/<th>/g, '<th class="border border-gray-300 bg-gray-100 p-3 text-left font-bold text-gray-900">')
                  .replace(/<td>/g, '<td class="border border-gray-300 p-3 text-gray-700">')
              }}
            />
          </div>
        </Container>
      </section>

      {/* Related Articles CTA */}
      <section className="py-20 bg-gray-50">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Back to Blog</h2>
            <Link href="/blog">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3">
                View All Articles
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
