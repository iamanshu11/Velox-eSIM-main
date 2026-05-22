'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle, Clock, Loader, Search, Send, X, XCircle } from 'lucide-react';
import {
  useListTemplatesQuery,
  useSendCustomEmailMutation,
  useSearchUsersQuery,
} from '@/store/slices/autoEmailSlice';

type UserResult = { id: string; name: string; email: string };

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SendTab() {
  const [selectedUsers, setSelectedUsers] = useState<UserResult[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [templateId, setTemplateId] = useState('');
  const [sendMode, setSendMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(userSearch, 300);
  const { data: userResults = [], isFetching: searchingUsers } = useSearchUsersQuery(
    debouncedSearch,
    { skip: debouncedSearch.trim().length < 2 }
  );

  const { data: templates = [], isLoading: loadingTemplates } = useListTemplatesQuery({
    includeInactive: false,
  });
  const [sendCustomEmail, { isLoading: sending }] = useSendCustomEmailMutation();

  const filteredResults = userResults.filter(
    (u) => !selectedUsers.some((s) => s.id === u.id)
  );

  const handleSelectUser = useCallback((user: UserResult) => {
    setSelectedUsers((prev) => [...prev, user]);
    setUserSearch('');
    setShowDropdown(false);
  }, []);

  const handleRemoveUser = useCallback((id: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    if (!templateId || selectedUsers.length === 0) return;
    try {
      await sendCustomEmail({
        templateId,
        userIds: selectedUsers.map((u) => u.id),
        sendImmediately: sendMode === 'immediate',
      }).unwrap();

      const count = selectedUsers.length;
      const label = sendMode === 'immediate' ? 'sent' : 'queued for delivery';
      setResult({ type: 'success', message: `Email ${label} to ${count} user${count !== 1 ? 's' : ''} successfully.` });
      setSelectedUsers([]);
      setTemplateId('');
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to send email. Please try again.';
      setResult({ type: 'error', message: msg });
    }
  };

  const canSubmit = selectedUsers.length > 0 && templateId && !sending;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Send Custom Email</h2>
        <p className="text-sm text-gray-600 mt-0.5">Select recipients and an email template to send.</p>
      </div>

      {result && (
        <div
          className={`flex items-start gap-3 rounded-lg px-4 py-3 border ${
            result.type === 'success'
              ? 'bg-primary-50 border-primary-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          {result.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <p className={`text-sm font-medium ${result.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {result.message}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* User search */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">
            Recipients <span className="text-red-500">*</span>
          </label>

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedUsers.map((user) => (
                <span
                  key={user.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 border border-neutral-200 rounded-full text-xs text-gray-700"
                >
                  <span className="font-medium">{user.name}</span>
                  <span className="text-gray-500">({user.email})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveUser(user.id)}
                    className="ml-0.5 text-gray-400 hover:text-gray-700 transition-colors"
                    aria-label={`Remove ${user.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => { if (debouncedSearch.length >= 2) setShowDropdown(true); }}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-9 py-2 border border-neutral-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              {searchingUsers && (
                <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
              )}
            </div>

            {showDropdown && debouncedSearch.length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 max-h-56 overflow-y-auto">
                {filteredResults.length === 0 && !searchingUsers ? (
                  <p className="px-4 py-3 text-sm text-gray-500">No users found.</p>
                ) : (
                  filteredResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-gray-600">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Type at least 2 characters to search.</p>
        </div>

        {/* Template select */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">
            Email Template <span className="text-red-500">*</span>
          </label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            disabled={loadingTemplates}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
          >
            <option value="">Select a template...</option>
            {templates.map((t: { id: string; title: string; subject: string }) => (
              <option key={t.id} value={t.id}>
                {t.title} — {t.subject}
              </option>
            ))}
          </select>
        </div>

        {/* Send mode */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Delivery</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSendMode('immediate')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                sendMode === 'immediate'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <Send className="w-4 h-4" />
              Send Now
            </button>
            <button
              type="button"
              onClick={() => setSendMode('scheduled')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                sendMode === 'scheduled'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <Clock className="w-4 h-4" />
              Queue for Later
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            {sendMode === 'immediate'
              ? 'Email will be sent immediately via the configured SMTP server.'
              : 'Email will be added to the queue and sent on the next scheduled run.'}
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : sendMode === 'immediate' ? (
              <Send className="w-4 h-4" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
            {sending ? 'Sending...' : sendMode === 'immediate' ? 'Send Now' : 'Add to Queue'}
          </button>
        </div>
      </form>
    </div>
  );
}

