'use client';

import { useState, useEffect } from 'react';
import { Send, Users, Edit, Trash2, Eye } from 'lucide-react';
import Card from '@/components/Card';
import { apiClient } from '@/lib/apiClient';
import { BackendApiResponse } from '@/types/api';
import logger from '@/lib/logger';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  targetUsers: 'all' | 'active' | 'new';
  sentAt: string;
  readCount: number;
  targetCount: number;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    message: string;
    type: Notification['type'];
    targetUsers: Notification['targetUsers'];
  }>({
    title: '',
    message: '',
    type: 'info',
    targetUsers: 'all',
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await apiClient.get<BackendApiResponse<Notification[]>>('/notifications');
      setNotifications(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      logger.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post<BackendApiResponse<any>>('/notifications/send', formData);
      setFormData({ title: '', message: '', type: 'info', targetUsers: 'all' });
      setShowModal(false);
      fetchNotifications();
    } catch (error) {
      logger.error('Failed to send notification:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'info':
        return 'bg-primary-100 text-primary-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTargetLabel = (target: string) => {
    const labels: Record<string, string> = {
      all: 'All Users',
      active: 'Active Users',
      new: 'New Users',
    };
    return labels[target] || target;
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">Send notifications and announcements to users</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition font-semibold"
        >
          <Send className="w-5 h-5" />
          Send Notification
        </button>
      </div>

      {/* Compose Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900">Send Notification</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSend} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Notification title"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Message</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Notification message"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Notification['type'] })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="info">Information</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Target Users</label>
                  <select
                    value={formData.targetUsers}
                    onChange={(e) => setFormData({ ...formData, targetUsers: e.target.value as Notification['targetUsers'] })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Users</option>
                    <option value="active">Active Users</option>
                    <option value="new">New Users</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition font-semibold"
                >
                  Send Notification
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Notifications List */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-black text-gray-900">Recent Notifications</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Target</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Engagement</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Sent Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading notifications...
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No notifications sent yet
                  </td>
                </tr>
              ) : (
                notifications.map((notif) => (
                  <tr key={notif.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{notif.title}</p>
                        <p className="text-xs text-gray-600 truncate max-w-xs">{notif.message}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${getTypeColor(notif.type)}`}>
                        {notif.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-gray-400" />
                        {getTargetLabel(notif.targetUsers)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {notif.readCount} / {notif.targetCount} read
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(notif.sentAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <button className="inline-flex items-center gap-2 px-3 py-1 text-primary-700 hover:bg-primary-50 rounded transition">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="inline-flex items-center gap-2 px-3 py-1 text-gray-600 hover:bg-gray-100 rounded transition">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="inline-flex items-center gap-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

