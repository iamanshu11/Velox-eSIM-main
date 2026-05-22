"use client";

import { apiClient } from "@/lib/apiClient";
import logger from "@/lib/logger";
import { BackendApiResponse } from "@/types/api";
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Save,
  Send,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Settings {
  profitMargin: number;
  currency: string;
  maintenanceMode: boolean;
  emailNotifications?: boolean;
  supportEmail?: string;
  esimAccessCode?: string;
  esimSecretKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFromEmail?: string;
  smtpFromName?: string;
  smtpSecure?: boolean;
}

interface CredentialStatus {
  isConfigured: boolean;
  isValid?: boolean;
  message?: string;
  balance?: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    profitMargin: 15,
    currency: "USD",
    maintenanceMode: false,
    emailNotifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [credentialStatus, setCredentialStatus] =
    useState<CredentialStatus | null>(null);
  const [message, setMessage] = useState("");
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [isCustomMargin, setIsCustomMargin] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res =
          await apiClient.get<BackendApiResponse<Settings>>("/settings");
        if (res?.data) {
          const data = res.data;
          if (data.profitMargin !== undefined && data.profitMargin !== null) {
            data.profitMargin = Number(data.profitMargin);
            if (data.profitMargin > 100) {
              data.profitMargin = 100;
            } else if (data.profitMargin > 1) {
              if (data.profitMargin <= 2.0) {
                data.profitMargin = Math.round((data.profitMargin - 1) * 100);
              } else {
                data.profitMargin = Math.round(data.profitMargin);
              }
            } else if (data.profitMargin > 0 && data.profitMargin <= 1) {
              data.profitMargin = Math.round((data.profitMargin - 1) * 100);
            }
          }
          logger.info("[Settings] Loaded settings:", data);
          setSettings(data);
          if (![10, 15, 20, 25, 30].includes(data.profitMargin)) {
            setIsCustomMargin(true);
          }
        }
      } catch (error) {
        logger.error("Failed to fetch settings:", error);
        setMessage("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = {
        ...settings,
        profitMargin: settings.profitMargin / 100 + 1,
      };
      await apiClient.put<any>("/settings", dataToSave);
      setMessage("Settings saved successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      setMessage(
        `Failed to save settings: ${error?.message || "Unknown error"}`,
      );
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyCredentials = async () => {
    if (!settings.esimAccessCode || !settings.esimSecretKey) {
      setMessage(
        "Please enter both access code and secret key before verifying",
      );
      return;
    }

    setVerifying(true);
    try {
      const response = await apiClient.post<
        BackendApiResponse<CredentialStatus>
      >("/admin/credentials/verify", {});

      setCredentialStatus({
        isConfigured: response.data?.isValid ?? false,
        isValid: response.data?.isValid ?? false,
        message: response.data?.message,
        balance: response.data?.balance,
      });

      if (response.data?.isValid) {
        setMessage("✅ Credentials verified successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(
          `❌ Credential verification failed: ${response.data?.message || "Unknown error"}`,
        );
        setTimeout(() => setMessage(""), 5000);
      }
    } catch (error: any) {
      setCredentialStatus({
        isConfigured: false,
        isValid: false,
        message: error?.message || "Unable to verify credentials",
      });
      setMessage(`Failed to verify credentials: ${error?.message}`);
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setVerifying(false);
    }
  };

  const handleTestSMTP = async () => {
    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
      setMessage("Please enter SMTP Host, User, and Password before testing");
      return;
    }

    setTestingSmtp(true);
    try {
      const response = await apiClient.post<
        BackendApiResponse<{ success: boolean; message: string }>
      >("/settings/test-smtp", {
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort || 587,
        smtpUser: settings.smtpUser,
        smtpPassword: settings.smtpPassword,
        smtpFromEmail: settings.smtpFromEmail,
        smtpSecure: settings.smtpSecure ?? true,
      });

      if (response.data?.success) {
        setMessage("✅ SMTP connection successful!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(
          `❌ SMTP test failed: ${response.data?.message || "Unknown error"}`,
        );
        setTimeout(() => setMessage(""), 5000);
      }
    } catch (error: any) {
      setMessage(`Failed to test SMTP: ${error?.message || "Unknown error"}`);
      logger.error("[Settings] SMTP test error:", error);
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes("@")) {
      setMessage("Please enter a valid email address");
      return;
    }

    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
      setMessage("Please configure SMTP settings first");
      return;
    }

    setTestingEmail(true);
    try {
      const response = await apiClient.post<
        BackendApiResponse<{ success: boolean; message: string }>
      >("/settings/test-email", {
        to: testEmailAddress,
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort || 587,
        smtpUser: settings.smtpUser,
        smtpPassword: settings.smtpPassword,
        smtpFromEmail: settings.smtpFromEmail,
        smtpFromName: settings.smtpFromName,
        smtpSecure: settings.smtpSecure ?? true,
      });

      if (response.data?.success) {
        setMessage(`✅ Test email sent to ${testEmailAddress}!`);
        setTestEmailAddress("");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(
          `❌ Failed to send test email: ${response.data?.message || "Unknown error"}`,
        );
        setTimeout(() => setMessage(""), 5000);
      }
    } catch (error: any) {
      setMessage(
        `Failed to send test email: ${error?.message || "Unknown error"}`,
      );
      logger.error("[Settings] Test email error:", error);
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">Loading settings...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">System configuration and controls</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${message.includes("success") ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
        >
          <p
            className={`text-sm font-medium ${message.includes("success") ? "text-green-800" : "text-red-800"}`}
          >
            {message}
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pricing Settings */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Pricing</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Profit Margin
              </label>
              <div className="flex gap-3">
                <select
                  value={isCustomMargin ? "custom" : settings.profitMargin}
                  onChange={(e) => {
                    if (e.target.value === "custom") {
                      setIsCustomMargin(true);
                    } else {
                      setIsCustomMargin(false);
                      setSettings({
                        ...settings,
                        profitMargin: Number(e.target.value),
                      });
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value={10}>10%</option>
                  <option value={15}>15%</option>
                  <option value={20}>20%</option>
                  <option value={25}>25%</option>
                  <option value={30}>30%</option>
                  <option value="custom">Custom</option>
                </select>
                {isCustomMargin && (
                  <input
                    type="number"
                    value={settings.profitMargin}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        profitMargin: Number(e.target.value) || 0,
                      })
                    }
                    className="w-24 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0-100"
                    autoFocus
                  />
                )}
              </div>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-neutral-200">
                <p className="text-sm font-medium text-gray-900">
                  Current Margin:{" "}
                  <span className="text-lg font-bold text-primary-700">
                    {settings.profitMargin}%
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  You will earn {settings.profitMargin}% profit on each plan
                  sale
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) =>
                  setSettings({ ...settings, currency: e.target.value })
                }
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
            </div>
          </div>
        </div>

        {/* eSIM Access Credentials */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            eSIM Access API
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Code
              </label>
              <div className="relative">
                <input
                  id="settingsAccessCode"
                  type={showAccessCode ? "text" : "password"}
                  value={settings.esimAccessCode || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      esimAccessCode: e.target.value,
                    })
                  }
                  placeholder="Enter eSIMaccess API Access Code"
                  className="w-full px-4 py-2 pr-10 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowAccessCode(!showAccessCode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showAccessCode ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Your eSIMaccess Access Code for API authentication
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secret Key
              </label>
              <div className="relative">
                <input
                  id="settingsSecretKey"
                  type={showSecretKey ? "text" : "password"}
                  value={settings.esimSecretKey || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      esimSecretKey: e.target.value,
                    })
                  }
                  placeholder="Enter eSIMaccess API Secret Key"
                  className="w-full px-4 py-2 pr-10 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showSecretKey ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Your eSIMaccess Secret Key for API authentication
              </p>
            </div>

            {/* Credential Status Display */}
            {credentialStatus && (
              <div
                className={`p-3 rounded-lg border ${
                  credentialStatus.isValid
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  {credentialStatus.isValid ? (
                    <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        credentialStatus.isValid
                          ? "text-green-900"
                          : "text-red-900"
                      }`}
                    >
                      {credentialStatus.message ||
                        (credentialStatus.isValid
                          ? "Credentials Valid"
                          : "Credentials Invalid")}
                    </p>
                    {credentialStatus.isValid &&
                      credentialStatus.balance !== undefined && (
                        <p className="text-xs text-green-700 mt-1">
                          Account Balance: $
                          {credentialStatus.balance.toFixed(2)} USD
                        </p>
                      )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleVerifyCredentials}
                disabled={
                  verifying ||
                  !settings.esimAccessCode ||
                  !settings.esimSecretKey
                }
                className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {verifying ? "Verifying..." : "Test Credentials"}
              </button>
            </div>

            <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
              <p className="text-xs text-primary-900">
                <strong>Note:</strong> Enter your eSIMaccess API credentials
                here. Credentials are encrypted and stored securely. Click "Test
                Credentials" to verify they work.
              </p>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">System</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Maintenance Mode
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Temporarily disable user access
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    maintenanceMode: !settings.maintenanceMode,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.maintenanceMode ? "bg-red-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.maintenanceMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Notifications
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Send alerts to admin email
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    emailNotifications: !settings.emailNotifications,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.emailNotifications ? "bg-primary-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.emailNotifications
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* SMTP Email Configuration */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Mail className="w-5 h-5 text-primary-700" />
            <h2 className="text-lg font-semibold text-gray-900">
              SMTP Configuration
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Host
              </label>
              <input
                type="text"
                value={settings.smtpHost || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    smtpHost: e.target.value,
                  })
                }
                placeholder="smtp.hostinger.com"
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email SMTP server address
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Port
                </label>
                <input
                  type="number"
                  value={settings.smtpPort || 587}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      smtpPort: Number(e.target.value),
                    })
                  }
                  placeholder="587"
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
                <p className="text-xs text-gray-500 mt-1">Default: 587</p>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 w-full px-4 py-2 border border-neutral-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={settings.smtpSecure ?? true}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        smtpSecure: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">TLS</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={settings.smtpUser || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    smtpUser: e.target.value,
                  })
                }
                placeholder="your-email@domain.com"
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
              <p className="text-xs text-gray-500 mt-1">SMTP login username</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showSmtpPassword ? "text" : "password"}
                  value={settings.smtpPassword || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      smtpPassword: e.target.value,
                    })
                  }
                  placeholder="••••••••••"
                  className="w-full px-4 py-2 pr-10 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
                <button
                  type="button"
                  onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showSmtpPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">SMTP login password</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Email
              </label>
              <input
                type="email"
                value={settings.smtpFromEmail || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    smtpFromEmail: e.target.value,
                  })
                }
                placeholder="noreply@domain.com"
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email shown in "From" field
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Name
              </label>
              <input
                type="text"
                value={settings.smtpFromName || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    smtpFromName: e.target.value,
                  })
                }
                placeholder="Velox eSIM"
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                Display name for emails
              </p>
            </div>

            <button
              onClick={handleTestSMTP}
              disabled={
                testingSmtp ||
                !settings.smtpHost ||
                !settings.smtpUser ||
                !settings.smtpPassword
              }
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg font-medium text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {testingSmtp ? "Testing..." : "Test SMTP Connection"}
            </button>

            {/* Test Email Section */}
            <div className="space-y-3 pt-4 border-t border-neutral-200">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-primary-700" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Send Test Email
                </h3>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="your-email@example.com"
                  className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
                <button
                  onClick={handleTestEmail}
                  disabled={
                    testingEmail ||
                    !testEmailAddress ||
                    !settings.smtpHost ||
                    !settings.smtpUser ||
                    !settings.smtpPassword
                  }
                  className="px-4 py-2 border border-neutral-200 rounded-lg font-medium text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {testingEmail ? "Sending..." : "Send"}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Send a test email to verify your SMTP configuration works
                correctly
              </p>
            </div>

            <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
              <p className="text-xs text-primary-900">
                <strong>Tip:</strong> For Hostinger, use{" "}
                <code className="bg-white px-1.5 py-0.5 rounded text-primary-700">
                  smtp.hostinger.com
                </code>{" "}
                as host and port{" "}
                <code className="bg-white px-1.5 py-0.5 rounded text-primary-700">
                  587
                </code>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {settings.maintenanceMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              Maintenance Mode Active
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Users will see a maintenance page instead of the application
            </p>
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
