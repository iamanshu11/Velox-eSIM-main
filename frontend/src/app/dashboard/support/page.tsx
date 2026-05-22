'use client';

import { supportService, SupportTicket } from '@/services/supportService';
import { AlertCircle, CheckCircle, Clock, MessageSquare, X, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TableSkeleton } from '@/components/SkeletonLoader';

interface TicketDetail extends SupportTicket {
  userId: string;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'connectivity',
    priority: 'MEDIUM',
  });

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await supportService.getUserTickets(1, 50);
      const ticketsData = (response as any).data?.tickets || [];
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const openTicketDetail = async (ticket: SupportTicket) => {
    try {
      const detail = await supportService.getTicketById(ticket.id);
      setSelectedTicket(detail as TicketDetail);
      setReplyText('');
      setReplyError('');
    } catch (err) {
      setReplyError('Failed to load ticket details');
    }
  };

  const handleSubmitReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    try {
      setReplyLoading(true);
      setReplyError('');
      await supportService.addCommunication(selectedTicket.id, replyText);
      const updated = await supportService.getTicketById(selectedTicket.id);
      setSelectedTicket(updated as TicketDetail);
      setReplyText('');
      loadTickets();
    } catch (err: any) {
      setReplyError(err?.message || 'Failed to send reply');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await supportService.createTicket({
        subject: formData.subject,
        message: formData.description,
        priority: formData.priority,
      });
      setSubmitted(true);
      setFormData({ subject: '', description: '', category: 'connectivity', priority: 'MEDIUM' });
      const response = await supportService.getUserTickets(1, 50);
      const ticketsData = (response as any).data?.tickets || [];
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);

      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-gray-950">Support Center</h1>
        <p className="text-gray-600 mt-2">We're here to help. Create a ticket or browse our FAQs</p>
      </div>

      {/* Quick Stats */}
      {!loading && tickets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-primary-700" />
              <div>
                <p className="text-sm text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{tickets.filter(t => t.status?.toUpperCase() === 'RESOLVED' || t.status?.toUpperCase() === 'CLOSED').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{tickets.filter(t => t.status?.toUpperCase() !== 'RESOLVED' && t.status?.toUpperCase() !== 'CLOSED').length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Form */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-linear-to-r from-primary-50 to-primary-100 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-700 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-950">Create Support Ticket</h2>
          </div>
        </div>

        <div className="p-8">
          {submitted && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-green-700 font-medium">
                Ticket submitted successfully. We'll get back to you soon!
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-red-700 font-medium">Error: {error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                >
                  <option value="connectivity">Connectivity Issues</option>
                  <option value="billing">Billing</option>
                  <option value="activation">Activation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Subject</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Brief description of your issue"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide detailed information about your issue"
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 bg-primary-700 text-white font-semibold rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        </div>
      </div>

      {/* Support Tickets */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-linear-to-r from-primary-50 to-primary-100 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-950">Your Support Tickets</h2>
          </div>
        </div>

        <div className="p-8">
          {/* Loading State */}
          {loading && <TableSkeleton count={5} />}

          {/* Error State */}
          {error && !loading && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-red-700 font-medium">Error: {error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && tickets.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Support Tickets</h3>
              <p className="text-gray-600">You haven't created any support tickets yet. If you have any issues, create a new ticket and our team will assist you.</p>
            </div>
          )}

          {/* Tickets List */}
          {!loading && !error && tickets.length > 0 && (
            <div className="space-y-4">
              {tickets.map((ticket) => {
                const firstMessage = ticket.message.split('\n---\n')[0];
                const cleanedMessage = firstMessage.replace(/^\[(?:Staff|User)\]\s+[\dT\-:.Z]+\s*\n?/, '').trim();
                return (
                  <div
                    key={ticket.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-primary-300 transition-all cursor-pointer"
                    onClick={() => openTicketDetail(ticket)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{ticket.subject}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            ticket.status?.toUpperCase() === 'CLOSED' ? 'bg-green-100 text-green-700' :
                            ticket.status?.toUpperCase() === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{cleanedMessage}</p>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <span>Priority: <strong className={
                            ticket.priority === 'URGENT' ? 'text-red-600' :
                            ticket.priority === 'HIGH' ? 'text-orange-600' :
                            ticket.priority === 'MEDIUM' ? 'text-yellow-600' :
                            'text-gray-600'
                          }>{ticket.priority}</strong></span>
                          <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 border-b border-gray-200 bg-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedTicket.subject}</h2>
                <p className="text-sm text-gray-600 mt-1">Ticket ID: {selectedTicket.id}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase">Priority</p>
                  <div className="mt-1">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full inline-block ${
                        selectedTicket.priority === 'URGENT'
                          ? 'bg-red-100 text-red-800'
                          : selectedTicket.priority === 'HIGH'
                            ? 'bg-orange-100 text-orange-800'
                            : selectedTicket.priority === 'MEDIUM'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {selectedTicket.priority}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase">Status</p>
                  <div className="mt-1">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full inline-block ${
                        selectedTicket.status?.toUpperCase() === 'CLOSED'
                          ? 'bg-green-100 text-green-800'
                          : selectedTicket.status?.toUpperCase() === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase">Created</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(selectedTicket.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Message Thread */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Conversation</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto border border-gray-200">
                  {selectedTicket.message ? (
                    selectedTicket.message.split('\n---\n').map((msg, idx) => {
                      const isStaff = msg.includes('[Staff]');
                      const cleanMsg = msg.replace(/^\[(?:Staff|User)\]\s+[\dT\-:.Z]+\s*\n?/, '').trim();
                      return (
                        <div key={idx} className={`${isStaff ? 'bg-blue-50 border-l-2 border-blue-400' : 'bg-white border-l-2 border-gray-300'} p-3 rounded`}>
                          <p className="text-xs text-gray-600 mb-2 font-medium">
                            {isStaff ? 'Staff Reply' : 'Your Message'}
                          </p>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {cleanMsg}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 italic">No messages yet</p>
                  )}
                </div>
              </div>

              {/* Reply Form */}
              {selectedTicket.status?.toLowerCase() !== 'closed' && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Reply</h3>
                  {replyError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 flex gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{replyError}</p>
                    </div>
                  )}
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                    rows={4}
                    disabled={replyLoading}
                  />
                  <button
                    onClick={handleSubmitReply}
                    disabled={replyLoading || !replyText.trim()}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg font-medium hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {replyLoading ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              )}

              {selectedTicket.status?.toLowerCase() === 'closed' && (
                <div className="border-t border-gray-200 pt-6">
                  <p className="text-sm text-gray-600 italic">This ticket is closed. You cannot add more replies.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
