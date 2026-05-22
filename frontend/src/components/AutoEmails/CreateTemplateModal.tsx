'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader, Sparkles, X } from 'lucide-react';
import { useCreateTemplateMutation, useGenerateTemplateMutation } from '@/store/slices/autoEmailSlice';
import RichTextEditor from '@/components/AutoEmails/RichTextEditor';

interface Props {
  onClose: () => void;
}

export default function CreateTemplateModal({ onClose }: Props) {
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    contentTemplate: '',
  });
  const [aiInput, setAiInput] = useState('');
  const [aiError, setAiError] = useState('');
  const [formError, setFormError] = useState('');

  const [createTemplate, { isLoading: isSaving }] = useCreateTemplateMutation();
  const [generateTemplate, { isLoading: isGenerating }] = useGenerateTemplateMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    if (!aiInput.trim()) return;
    setAiError('');
    try {
      const result = await generateTemplate(aiInput).unwrap();
      setFormData((prev) => ({
        ...prev,
        title: result.title,
        subject: result.subject,
        contentTemplate: result.contentTemplate,
      }));
    } catch {
      setAiError('AI generation failed. Try a different prompt.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim() || !formData.subject.trim() || !formData.contentTemplate.trim()) {
      setFormError('Title, subject, and content are required.');
      return;
    }

    try {
      await createTemplate({
        title: formData.title,
        subject: formData.subject,
        contentTemplate: formData.contentTemplate,
      }).unwrap();
      onClose();
    } catch {
      setFormError('Failed to create template. Please try again.');
    }
  };

  const isDisabled = isSaving || isGenerating;

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
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white z-10 rounded-t-xl">
          <h2 className="text-lg font-bold text-gray-900">Create Email Template</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Generate with AI */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-gray-700" />
              <span className="text-sm font-semibold text-gray-900">Generate with AI</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="e.g. A welcome email for new users who just signed up for eSIM"
                className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
                disabled={isDisabled}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isDisabled || !aiInput.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isGenerating ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate
              </button>
            </div>
            {aiError && (
              <p className="text-xs text-red-600 mt-2">{aiError}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              AI will generate the title, subject line, and HTML content. You can edit the result below.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Template Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Welcome Email"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                disabled={isDisabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Subject Line <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="e.g., Welcome, {{userName}}!"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                disabled={isDisabled}
              />
              <p className="text-xs text-gray-500 mt-1">
                Variables: <code>{'{{userName}}'}</code> <code>{'{{userEmail}}'}</code> <code>{'{{purchaseCount}}'}</code> <code>{'{{currentDate}}'}</code>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Email Content <span className="text-red-500">*</span>
              </label>
              <RichTextEditor
                value={formData.contentTemplate}
                onChange={(html) => setFormData((prev) => ({ ...prev, contentTemplate: html }))}
                disabled={isDisabled}
                placeholder="Write your email content or use Generate with AI above."
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isDisabled}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDisabled}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isSaving && <Loader className="w-4 h-4 animate-spin" />}
                Create Template
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
