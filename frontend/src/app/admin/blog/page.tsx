'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import BlogListTab from '@/components/Blog/BlogListTab';

export default function AdminBlogPage() {
  return (
    <div className="w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary-50 rounded-lg">
            <BookOpen className="w-6 h-6 text-primary-700" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
        </div>
        <p className="text-gray-600 mt-2 text-base">
          Create, edit, and manage your blog posts. Use AI generation or write manually.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <BlogListTab />
      </motion.div>
    </div>
  );
}
