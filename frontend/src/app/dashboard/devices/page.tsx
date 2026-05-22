'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from '@/components/Button';
import { Smartphone, Trash2, Plus, AlertCircle, CheckCircle2, Pencil } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import type { ApiResponse } from '@/types';

interface Device {
  id: string;
  userId: string;
  name: string;
  brand: string;
  model: string;
  deviceType: 'phone' | 'tablet' | 'hotspot' | 'other';
  isActive: boolean;
  carrier?: string;
  createdAt: string;
  updatedAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const DeviceTypeIcon = ({ type }: { type: string }) => {
  const icons: Record<string, string> = { phone: '📱', tablet: '📱', hotspot: '📡', other: '🔌' };
  return <span className="text-2xl">{icons[type] || icons.other}</span>;
};

const emptyForm = { name: '', brand: '', model: '', deviceType: 'phone', carrier: '' };

export default function DeviceManagementPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => { fetchDevices(); }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<ApiResponse<{ devices: Device[] }>>('/devices');
      setDevices(res.data?.devices || []);
    } catch {
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  };

  const openEdit = (device: Device) => {
    setEditingId(device.id);
    setForm({
      name: device.name,
      brand: device.brand,
      model: device.model,
      deviceType: device.deviceType,
      carrier: device.carrier || '',
    });
    setError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.brand.trim() || !form.model.trim()) {
      setError('Name, brand and model are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, carrier: form.carrier || undefined };
      if (editingId) {
        await apiClient.put<ApiResponse<Device>>(`/devices/${editingId}`, payload);
      } else {
        await apiClient.post<ApiResponse<Device>>('/devices', payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchDevices();
    } catch (err: any) {
      setError(err?.message || 'Failed to save device. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this device?')) return;
    try {
      await apiClient.delete(`/devices/${id}`);
      setDevices((d) => d.filter((x) => x.id !== id));
    } catch {
      alert('Failed to remove device.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-950 flex items-center gap-3 mb-2">
            <Smartphone className="w-8 h-8 text-primary-700" />
            Device Management
          </h1>
          <p className="text-gray-600">Manage your eSIM-compatible devices</p>
        </div>
        <Button onClick={openAdd} className="bg-primary-700 hover:bg-primary-800 text-white inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Device
        </Button>
      </motion.div>

      {/* Add / Edit Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <h2 className="text-lg font-black text-gray-950 mb-4">{editingId ? 'Edit Device' : 'Add New Device'}</h2>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Device Name (e.g., My iPhone)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <input
              type="text"
              placeholder="Brand (e.g., Apple)"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <input
              type="text"
              placeholder="Model (e.g., iPhone 15 Pro)"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <select
              value={form.deviceType}
              onChange={(e) => setForm({ ...form, deviceType: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="phone">Phone</option>
              <option value="tablet">Tablet</option>
              <option value="hotspot">Hotspot</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Carrier (optional)"
              value={form.carrier}
              onChange={(e) => setForm({ ...form, carrier: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none md:col-span-2"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Device'}
            </Button>
            <Button
              onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Devices Grid */}
      {devices.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 bg-primary-50 rounded-xl border-2 border-dashed border-primary-200"
        >
          <Smartphone className="w-16 h-16 text-primary-300 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-gray-950 mb-2">No Devices Added</h2>
          <p className="text-gray-700 mb-8">Add your first eSIM-compatible device to get started</p>
          <Button 
            onClick={openAdd} 
            variant="primary"
            size="lg"
            className="inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Device
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {devices.map((device) => (
            <motion.div
              key={device.id}
              variants={itemVariants}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
            >
              <div className={`px-6 py-4 ${device.isActive ? 'bg-green-50 border-b border-green-200' : 'bg-gray-50 border-b border-gray-200'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <DeviceTypeIcon type={device.deviceType} />
                    <div>
                      <h3 className="font-bold text-gray-900">{device.name}</h3>
                      <p className="text-sm text-gray-600">{device.brand} {device.model}</p>
                    </div>
                  </div>
                  {device.isActive && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </div>
                {device.carrier && <p className="text-xs text-gray-500">Carrier: {device.carrier}</p>}
              </div>

              <div className="px-6 py-4 space-y-3">
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Type</span>
                    <span className="font-medium text-gray-800 capitalize">{device.deviceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Added</span>
                    <span className="font-medium text-gray-800">{new Date(device.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => openEdit(device)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(device.id)}
                    className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-start gap-3"
      >
        <AlertCircle className="w-5 h-5 text-primary-700 mt-0.5 shrink-0" />
        <div>
          <h3 className="font-semibold text-primary-900">Device Management Tips</h3>
          <ul className="text-sm text-primary-800 mt-1 space-y-1">
            <li>• Add all your eSIM-compatible devices for easy tracking</li>
            <li>• Most modern smartphones (iPhone XS+, Android with eSIM) are supported</li>
            <li>• Mark devices as inactive when not in use</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}

