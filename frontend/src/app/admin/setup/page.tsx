'use client';

import { apiClient } from '@/lib/apiClient';
import { ArrowRight, Zap, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import logger from '@/lib/logger';
import { BackendApiResponse } from '@/types/api';

interface CredentialStatus {
  isConfigured: boolean;
}

export default function AdminSetup() {
  const router = useRouter();
  const [credentialStatus, setCredentialStatus] = useState<CredentialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessCode, setAccessCode] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await apiClient.get<BackendApiResponse<CredentialStatus>>('/admin/credentials/status');
        if (response.data) {
          setCredentialStatus(response.data);
          if (response.data.isConfigured) {
            setTimeout(() => router.replace('/admin'), 500);
          }
        }
      } catch (error) {
        logger.error('Failed to check credential status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [router]);

  const handleSetupCredentials = async () => {
    if (!accessCode || !secretKey) {
      setMessage('Please enter both access code and secret key');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post<BackendApiResponse<void>>('/admin/credentials', {
        accessCode,
        secretKey,
      });

      setMessage('✅ Credentials configured! Redirecting to dashboard...');
      setTimeout(() => {
        router.replace('/admin');
      }, 1500);
    } catch (error) {
      const err = error as any;
      setMessage(`❌ Error: ${err?.message || 'Failed to set credentials'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (credentialStatus?.isConfigured) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-primary-900 to-primary-700 px-6 py-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6" />
              <h1 className="text-2xl font-bold">Welcome Admin!</h1>
            </div>
            <p className="text-primary-100 text-sm">Let's get your eSIM platform ready</p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-6">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-800 font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Get eSIMaccess Credentials</h3>
                <p className="text-sm text-gray-600 mb-2">Sign up at esimaccess.com and get your API credentials</p>
                <a
                  href="https://www.esimaccess.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary-700 hover:text-primary-800 font-medium text-sm"
                >
                  Visit eSIMaccess <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3">
              <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-800 font-bold text-sm">
                2
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Enter Your Credentials</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Access Code
                      </label>
                      <div className="relative">
                        <input
                          type={showAccessCode ? 'text' : 'password'}
                          value={accessCode}
                          onChange={(e) => setAccessCode(e.target.value)}
                          placeholder="Your eSIMaccess Access Code"
                          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAccessCode(!showAccessCode)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showAccessCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secret Key
                      </label>
                      <div className="relative">
                        <input
                          type={showSecretKey ? 'text' : 'password'}
                          value={secretKey}
                          onChange={(e) => setSecretKey(e.target.value)}
                          placeholder="Your eSIMaccess Secret Key"
                          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecretKey(!showSecretKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showSecretKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.includes('✅')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message}
              </div>
            )}

            {/* Security Note */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <p className="text-xs text-primary-900">
                <strong>Security:</strong> Your credentials are encrypted and stored securely on our servers. Only you as an admin can view or change them.
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={handleSetupCredentials}
              disabled={saving || !accessCode || !secretKey}
              className="w-full px-6 py-3 bg-primary-700 text-white font-semibold rounded-lg hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Setting up...' : 'Complete Setup'}
            </button>

            <p className="text-xs text-center text-gray-500">
              The credentials can be changed anytime in Settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

