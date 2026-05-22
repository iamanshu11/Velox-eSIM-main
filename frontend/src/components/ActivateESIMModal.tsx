'use client';

import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Order } from '@/types';

interface ActivateESIMModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
}

export default function ActivateESIMModal({ isOpen, order, onClose }: ActivateESIMModalProps) {
  if (!isOpen || !order) return null;

  const qrCodeUrl = order.qrCodeUrl || null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-white rounded-2xl shadow-2xl max-w-xs w-full overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Scan QR Code</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code */}
        <div className="p-5 flex flex-col items-center">
          {qrCodeUrl ? (
            <div className="border border-gray-200 rounded-xl p-3 bg-white">
              <Image
                src={qrCodeUrl}
                alt="eSIM QR Code"
                width={220}
                height={220}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertCircle className="w-10 h-10 text-amber-400" />
              <p className="text-sm font-semibold text-gray-700">QR Code Not Ready</p>
              <p className="text-xs text-gray-400">Check back in a few minutes.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
