'use client';

import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import BlogCreateTab from './BlogCreateTab';

interface Props {
  onClose: () => void;
  editingPostId?: string;
}

export default function BlogCreateModal({ onClose, editingPostId }: Props) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-10 overflow-y-auto"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-white rounded-xl w-full max-w-3xl shadow-xl mb-10"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-bold text-gray-900">{editingPostId ? 'Edit Blog Post' : 'Create Blog Post'}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 max-h-[80vh] overflow-y-auto">
          <BlogCreateTab editingPostId={editingPostId} onClose={onClose} />
        </div>
      </motion.div>
    </motion.div>
  );
}
