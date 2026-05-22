'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface Template {
  id: string;
  title: string;
  subject: string;
  contentTemplate: string;
}

interface Props {
  template: Template;
  onClose: () => void;
}

const SAMPLE_VARIABLES: Record<string, string> = {
  userName: 'John Doe',
  userEmail: 'john@example.com',
  purchaseCount: '3',
  lastPurchaseDate: new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
  currentDate: new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
};

function interpolate(template: string): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    return SAMPLE_VARIABLES[key] ?? `{{${key}}}`;
  });
}

export default function TemplatePreviewModal({ template, onClose }: Props) {
  const previewSubject = useMemo(() => interpolate(template.subject), [template.subject]);
  const previewHtml = useMemo(() => interpolate(template.contentTemplate), [template.contentTemplate]);

  const iframeDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      color: #1f2937;
      background: #ffffff;
    }
    h1, h2, h3 { color: #111827; line-height: 1.3; }
    a { color: #43A1F0; }
    p { margin: 0 0 16px; }
    ul, ol { margin: 0 0 16px; padding-left: 24px; }
    strong { font-weight: 600; }
  </style>
</head>
<body>${previewHtml}</body>
</html>`;

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 pt-12 overflow-y-auto"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden mb-12"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">
              Preview — {template.title}
            </p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              Subject: {previewSubject}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="ml-4 shrink-0 p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-neutral-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sample variable notice */}
        <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200">
          <p className="text-xs text-amber-700">
            Sample data used: <strong>userName</strong> = &ldquo;John Doe&rdquo; &bull; <strong>purchaseCount</strong> = 3 &bull; <strong>currentDate</strong> = today
          </p>
        </div>

        {/* Rendered email body */}
        <iframe
          title="Email preview"
          srcDoc={iframeDoc}
          sandbox="allow-same-origin"
          className="w-full border-0"
          style={{ minHeight: '480px', height: 'auto' }}
          onLoad={(e) => {
            const frame = e.currentTarget;
            try {
              const body = frame.contentDocument?.body;
              if (body) {
                frame.style.height = `${body.scrollHeight + 48}px`;
              }
            } catch {
              /* cross-origin iframe fallback */
            }
          }}
        />
      </motion.div>
    </motion.div>
  );
}
