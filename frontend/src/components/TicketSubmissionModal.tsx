'use client';

import { supportService } from '@/services/supportService';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { useState } from 'react';

export interface TicketFormData {
  subject: string;
  description: string;
  category: 'connectivity' | 'billing' | 'activation' | 'other';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

interface TicketSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (ticketId: string) => void;
  initialData?: Partial<TicketFormData>;
}

export default function TicketSubmissionModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: TicketSubmissionModalProps) {
  const isAutoFilled =
    initialData && initialData.subject && initialData.description && initialData.priority;
  const [step, setStep] = useState<'form' | 'preview' | 'success'>(
    isAutoFilled ? 'preview' : 'form'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TicketFormData>(
    (initialData as TicketFormData) || {
      subject: '',
      description: '',
      category: 'connectivity',
      priority: 'MEDIUM',
    }
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePreview = () => {
    if (!formData.subject.trim() || !formData.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    setError(null);
    setStep('preview');
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await supportService.createTicket({
        subject: formData.subject,
        message: formData.description,
        priority: formData.priority,
        category: formData.category,
      });

      setTicketId(response.id);
      setStep('success');
      onSuccess?.(response.id);
      setTimeout(() => {
        onClose();
        setStep('form');
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-black text-gray-950">Submit Support Ticket</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {step === 'form' && (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Brief description of your issue"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Detailed information about your issue"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="connectivity">Connectivity Issues</option>
                  <option value="billing">Billing</option>
                  <option value="activation">Activation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePreview}
                  className="flex-1 px-4 py-2 bg-primary-700 text-white rounded-lg font-medium hover:bg-primary-800 transition-colors"
                >
                  Review
                </button>
              </div>
            </>
          )}

          {step === 'preview' && (
            <>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase">Subject</p>
                  <p className="text-sm text-gray-900 mt-1">{formData.subject}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase">Description</p>
                  <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{formData.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <p className="text-xs text-gray-600 font-semibold uppercase">Category</p>
                    <p className="text-sm text-gray-900 mt-1 capitalize">{formData.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold uppercase">Priority</p>
                    <p className={`text-sm font-semibold mt-1 ${
                      formData.priority === 'URGENT' ? 'text-red-600' :
                      formData.priority === 'HIGH' ? 'text-orange-600' :
                      formData.priority === 'MEDIUM' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {formData.priority}
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="pt-4 flex gap-2">
                <button
                  onClick={() => setStep('form')}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-medium text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary-700 text-white rounded-lg font-medium hover:bg-primary-800 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </>
          )}

          {step === 'success' && (
            <>
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-lg font-black text-gray-950 mb-2">Ticket Submitted!</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Thank you for submitting your ticket. Our team will get back to you soon.
                </p>
                {ticketId && (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-600 font-semibold uppercase">Ticket ID</p>
                    <p className="text-sm font-mono font-bold text-primary-900 mt-1">{ticketId}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
