'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Mail, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  useListTemplatesQuery,
  useDeleteTemplateMutation,
} from '@/store/slices/autoEmailSlice';
import CreateTemplateModal from '@/components/AutoEmails/CreateTemplateModal';
import EditTemplateModal from '@/components/AutoEmails/EditTemplateModal';
import TemplatePreviewModal from '@/components/AutoEmails/TemplatePreviewModal';
import ConfirmModal from '@/components/AutoEmails/ConfirmModal';

type Template = {
  id: string;
  title: string;
  subject: string;
  contentTemplate: string;
  aiPrompt: string | null;
  isActive: boolean;
  createdAt: string;
};

const getPreviewText = (html: string): string => {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export default function TemplatesTab() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: templates = [], isLoading, error } = useListTemplatesQuery({ includeInactive: true });
  const [deleteTemplate] = useDeleteTemplateMutation();

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteId) return;
    setIsDeleting(true);
    try {
      await deleteTemplate(pendingDeleteId).unwrap();
      setPendingDeleteId(null);
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        'Failed to delete template. Please try again.';
      setDeleteError(message);
      setPendingDeleteId(null);
      setTimeout(() => setDeleteError(null), 6000);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-700 font-medium">Failed to load email templates.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {deleteError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-sm text-red-700 font-medium">{deleteError}</p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Email Templates</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {templates.length} template{templates.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
            <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">
              No templates yet. Create your first email template.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template: Template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white border border-neutral-200 rounded-lg p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{template.title}</h3>
                    <p className="text-sm text-gray-600 mt-0.5 truncate">{template.subject}</p>
                  </div>
                  <span
                    className={`ml-3 px-2 py-0.5 text-xs font-medium rounded-full border shrink-0 ${
                      template.isActive
                        ? 'bg-primary-50 text-primary-700 border-primary-200'
                        : 'bg-neutral-100 text-gray-600 border-neutral-200'
                    }`}
                  >
                    {template.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-md p-3 mb-4 text-xs text-gray-600 line-clamp-3">
                  <p className="line-clamp-3">{getPreviewText(template.contentTemplate) || 'No preview available'}</p>
                </div>

                <div className="flex items-center gap-1 pt-3 border-t border-neutral-200">
                  <button
                    onClick={() => setPreviewTemplate(template)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setPendingDeleteId(template.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && <CreateTemplateModal onClose={() => setShowCreateModal(false)} />}
      {editingTemplate && (
        <EditTemplateModal template={editingTemplate} onClose={() => setEditingTemplate(null)} />
      )}
      {previewTemplate && (
        <TemplatePreviewModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} />
      )}
      {pendingDeleteId && (
        <ConfirmModal
          title="Delete Template"
          message="This will permanently delete the template and all its associated scheduled emails and send history. This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          isLoading={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </>
  );
}

