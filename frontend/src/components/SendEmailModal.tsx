'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, Loader, Send, CheckCircle, AlertCircle } from 'lucide-react';
import {
  useListTemplatesQuery,
  useSendCustomEmailMutation,
} from '@/store/slices/autoEmailSlice';

interface Props {
  userIds: string[];
  onClose: () => void;
}

type SendMode = 'queue' | 'immediate';

export default function SendEmailModal({ userIds, onClose }: Props) {
  const [templateId, setTemplateId] = useState('');
  const [sendMode, setSendMode] = useState<SendMode>('queue');
  const [result, setResult] = useState<{ sent: number; skipped: number } | null>(null);

  const { data: templates = [], isLoading: templatesLoading } = useListTemplatesQuery(
    { includeInactive: false }
  );

  const [sendCustomEmail, { isLoading: isSending, error: sendError }] =
    useSendCustomEmailMutation();

  const handleSend = useCallback(async () => {
    if (!templateId) return;

    try {
      const response = await sendCustomEmail({
        templateId,
        userIds,
        sendImmediately: sendMode === 'immediate',
      }).unwrap();

      setResult({
        sent: response?.data?.sent ?? userIds.length,
        skipped: response?.data?.skipped ?? 0,
      });
    } catch {
    }
  }, [templateId, userIds, sendMode, sendCustomEmail]);

  const selectedTemplate = templates.find((t) => t.id === templateId);

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl w-full max-w-lg shadow-xl"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            <Mail className="w-5 h-5 text-primary-700 shrink-0" />
            <h3 className="text-base font-bold text-gray-900">Send Email</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {result ? (
            /* Success state */
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-5 py-8 text-center space-y-3"
            >
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
              <p className="text-base font-semibold text-gray-900">
                {sendMode === 'immediate' ? 'Emails sent' : 'Emails queued'}
              </p>
              <p className="text-sm text-gray-500">
                {result.sent} delivered
                {result.skipped > 0 && `, ${result.skipped} skipped (unsubscribed or inactive)`}
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-5 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Done
              </button>
            </motion.div>
          ) : (
            /* Form state */
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="px-5 py-5 space-y-5">
                {/* Recipient count */}
                <div className="bg-primary-50 border border-primary-100 rounded-lg px-4 py-3">
                  <p className="text-sm text-primary-900 font-medium">
                    {userIds.length} recipient{userIds.length !== 1 ? 's' : ''} selected
                  </p>
                  <p className="text-xs text-primary-700 mt-0.5">
                    Unsubscribed or inactive users will be skipped automatically.
                  </p>
                </div>

                {/* Template selector */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="template-select"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email template
                  </label>
                  {templatesLoading ? (
                    <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                      <Loader className="w-4 h-4 animate-spin" />
                      Loading templates…
                    </div>
                  ) : templates.length === 0 ? (
                    <p className="text-sm text-red-600">
                      No active templates. Create one in Auto Emails first.
                    </p>
                  ) : (
                    <select
                      id="template-select"
                      value={templateId}
                      onChange={(e) => setTemplateId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select a template…</option>
                      {templates.map((t: { id: string; title: string; subject: string }) => (
                        <option key={t.id} value={t.id}>
                          {t.title} — {t.subject}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Template subject preview */}
                {selectedTemplate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                  >
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Subject preview
                    </p>
                    <p className="text-sm text-gray-800">{selectedTemplate.subject}</p>
                  </motion.div>
                )}

                {/* Send mode */}
                <fieldset className="space-y-1.5">
                  <legend className="block text-sm font-medium text-gray-700">
                    Delivery mode
                  </legend>
                  <div className="flex gap-3">
                    {(['queue', 'immediate'] as const).map((mode) => (
                      <label
                        key={mode}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer text-sm font-medium transition-colors ${
                          sendMode === mode
                            ? 'border-primary-700 bg-primary-50 text-primary-900'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="send-mode"
                          value={mode}
                          checked={sendMode === mode}
                          onChange={() => setSendMode(mode)}
                          className="sr-only"
                        />
                        {mode === 'queue' ? 'Queue' : 'Send now'}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    {sendMode === 'queue'
                      ? 'Emails are scheduled and processed by the background job.'
                      : 'Emails are delivered immediately via SMTP.'}
                  </p>
                </fieldset>

                {/* Error */}
                {sendError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700">
                      {(sendError as any)?.data?.message ?? 'Failed to send emails. Please try again.'}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-neutral-200">
                <button
                  onClick={onClose}
                  disabled={isSending}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={!templateId || isSending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sendMode === 'immediate' ? 'Send now' : 'Queue emails'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
