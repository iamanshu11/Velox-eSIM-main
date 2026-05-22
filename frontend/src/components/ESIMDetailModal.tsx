'use client';

import { useState } from 'react';
import { Copy, CheckCircle, Download, QrCode, AlertCircle, Wifi, Calendar, Zap, Settings } from 'lucide-react';
import Link from 'next/link';
import Modal from '@/components/Modal';
import type { Order } from '@/types';
import Image from 'next/image';

interface ESIMDetailModalProps {
  esim: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

const DetailRow = ({ label, value, copyable = false }: { label: string; value: string | number | undefined | null; copyable?: boolean }) => {
  const [copied, setCopied] = useState(false);

  if (!value && value !== 0) return null;

  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors group">
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">{label}</p>
        <p className="font-mono text-sm font-semibold text-gray-900 mt-1">{value}</p>
      </div>
      {copyable && (
        <button
          onClick={handleCopy}
          className="ml-3 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy to clipboard"
        >
          {copied ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      )}
    </div>
  );
};

const Section = ({ title, icon: Icon, children, className = '' }: { title: string; icon: any; children: React.ReactNode; className?: string }) => (
  <div className={`space-y-3 ${className}`}>
    <h3 className="flex items-center gap-2 font-semibold text-gray-900">
      <Icon className="w-5 h-5 text-primary-700" />
      {title}
    </h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const QRCodeDisplay = ({ qrCodeUrl }: { qrCodeUrl?: string }) => {
  if (!qrCodeUrl) return null;

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 font-semibold text-gray-900">
        <QrCode className="w-5 h-5 text-primary-700" />
        Provisioning QR Code
      </h3>
      <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-center">
        <Image
          width={256}
          height={256}
          src={qrCodeUrl} 
          alt="eSIM QR Code" 
          className="object-contain"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"%3E%3Crect fill="%23f0f0f0" width="256" height="256"/%3E%3Ctext x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="14" fill="%23999"%3EQR Code%3C/text%3E%3C/svg%3E';
          }}
        />
      </div>
      <a
        href={qrCodeUrl}
        download="esim-qr-code.png"
        className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors text-sm font-medium"
      >
        <Download className="w-4 h-4" />
        Download QR Code
      </a>
    </div>
  );
};

const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return 'from-primary-500 to-primary-700';
    case 'CANCELLED':
      return 'from-red-500 to-rose-600';
    case 'EXPIRED':
      return 'from-orange-500 to-amber-600';
    default:
      return 'from-primary-600 to-primary-900';
  }
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export default function ESIMDetailModal({ esim, isOpen, onClose }: ESIMDetailModalProps) {
  if (!esim) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className={`bg-linear-to-r ${getStatusColor(esim.status)} rounded-xl p-6 text-white`}>
          <div className="flex items-start justify-between mb-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-white/20 text-white border border-white/30`}>
              {esim.status?.toUpperCase() || 'UNKNOWN'}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-50">
            {esim.plan?.name || 'eSIM Plan'}
          </h2>
          <p className="text-sm text-white/80 mt-2">
            ID: {esim.id} • Transaction: {esim.esimTranNo || esim.orderNo}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Plan Info Card */}
          <div className="bg-linear-to-br from-primary-50 to-primary-100/50 rounded-lg border border-primary-200 p-4">
            <p className="text-xs font-medium text-primary-700 uppercase tracking-wider">Data Plan</p>
            <p className="text-2xl font-bold text-primary-900 mt-2">
              {formatBytes(esim.totalVolume || 0)}
            </p>
            <p className="text-sm text-primary-800 mt-1">
              Duration: {esim.totalDuration} {esim.durationUnit}
            </p>
          </div>

          {/* Usage Card */}
          {esim.dataUsagePercent !== undefined && (
            <div className="bg-linear-to-br from-purple-50 to-purple-100/50 rounded-lg border border-purple-200 p-4">
              <p className="text-xs font-medium text-purple-600 uppercase tracking-wider">Data Usage</p>
              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-purple-900">{esim.dataUsagePercent}%</p>
                  <p className="text-sm text-purple-700">used</p>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      esim.dataUsagePercent > 80 ? 'bg-red-500' :
                      esim.dataUsagePercent > 50 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${esim.dataUsagePercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Expiry Card */}
          <div className="bg-linear-to-br from-amber-50 to-amber-100/50 rounded-lg border border-amber-200 p-4">
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Package Validity</p>
            <p className="text-2xl font-bold text-amber-900 mt-2">
              {esim.totalDuration} {esim.durationUnit}
            </p>
            {esim.expiresAt ? (
              <p className="text-sm text-amber-700 mt-1">
                Expires {new Date(esim.expiresAt).toLocaleDateString()}
              </p>
            ) : esim.activatedAt ? (
              <p className="text-sm text-amber-700 mt-1">
                Activated {new Date(esim.activatedAt).toLocaleDateString()}
              </p>
            ) : esim.profileExpiresAt ? (
              <p className="text-sm text-amber-700 mt-1">
                Activate by {new Date(esim.profileExpiresAt).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-sm text-amber-700 mt-1">
                Not activated yet
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Connection Details */}
        {(esim.iccid || esim.msisdn || esim.imsi) && (
          <>
            <Section title="Connection Details" icon={Wifi}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {esim.iccid && <DetailRow label="ICCID" value={esim.iccid} copyable />}
                {esim.msisdn && <DetailRow label="MSISDN" value={esim.msisdn} copyable />}
                {esim.imsi && <DetailRow label="IMSI" value={esim.imsi} copyable />}
                {esim.eid && <DetailRow label="EID" value={esim.eid} copyable />}
              </div>
            </Section>
            {(esim.apn || esim.packageCodes) && <div className="border-t border-gray-200" />}
          </>
        )}

        {/* Network Information */}
        {(esim.apn || esim.packageCodes || esim.smsStatus || esim.dataType) && (
          <>
            <Section title="Network Information" icon={Wifi}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {esim.apn && <DetailRow label="Access Point Name (APN)" value={esim.apn} copyable />}
                {esim.packageCodes && <DetailRow label="Packages" value={esim.packageCodes} />}
                {esim.smsStatus && <DetailRow label="SMS Capability" value={esim.smsStatus} />}
                {esim.dataType && <DetailRow label="Data Type" value={esim.dataType} />}
              </div>
            </Section>
            {(esim.pin || esim.ac) && <div className="border-t border-gray-200" />}
          </>
        )}

        {/* Security Codes */}
        {(esim.pin || esim.ac) && (
          <>
            <Section title="Security Codes" icon={AlertCircle}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {esim.ac && <DetailRow label="Activation Code (AC)" value={esim.ac} copyable />}
                {esim.pin && <DetailRow label="PIN" value={esim.pin} copyable />}
              </div>
            </Section>
            {esim.qrCodeUrl && <div className="border-t border-gray-200" />}
          </>
        )}

        {/* QR Code Display */}
        {esim.qrCodeUrl && (
          <>
            <div className="bg-linear-to-br from-primary-50 to-primary-100/50 rounded-lg border border-primary-200 p-6">
              <QRCodeDisplay qrCodeUrl={esim.qrCodeUrl} />
            </div>
            {(esim.activatedAt || esim.createdAt) && <div className="border-t border-gray-200" />}
          </>
        )}

        {/* Dates */}
        {(esim.activatedAt || esim.createdAt) && (
          <>
            <Section title="Dates" icon={Calendar}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {esim.activatedAt && (
                  <DetailRow label="Activated" value={new Date(esim.activatedAt).toLocaleDateString()} />
                )}
                {esim.expiresAt && (
                  <DetailRow label="Expires" value={new Date(esim.expiresAt).toLocaleDateString()} />
                )}
                {esim.createdAt && (
                  <DetailRow label="Purchased" value={new Date(esim.createdAt).toLocaleDateString()} />
                )}
              </div>
            </Section>
            {(esim.dataUsage !== undefined || esim.remainingVolume !== undefined) && <div className="border-t border-gray-200" />}
          </>
        )}

        {/* Data Usage Details */}
        {(esim.dataUsage !== undefined || esim.remainingVolume !== undefined) && (
          <>
            <Section title="Data Consumption" icon={Zap}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {esim.dataUsage !== undefined && (
                  <DetailRow label="Data Used" value={formatBytes(esim.dataUsage)} />
                )}
                {esim.remainingVolume !== undefined && (
                  <DetailRow label="Remaining" value={formatBytes(esim.remainingVolume)} />
                )}
                {esim.totalVolume && (
                  <DetailRow label="Total" value={formatBytes(esim.totalVolume)} />
                )}
              </div>
            </Section>
            {esim.packages && esim.packages.length > 0 && <div className="border-t border-gray-200" />}
          </>
        )}

        {/* Packages List */}
        {esim.packages && esim.packages.length > 0 && (
          <Section title="Included Packages" icon={Zap}>
            <div className="space-y-2">
              {esim.packages.map((pkg, idx) => (
                <div key={idx} className="p-3 bg-linear-to-r from-primary-50 to-primary-100/50 rounded-lg border border-primary-200 hover:from-primary-100 hover:to-primary-200/50 transition-all cursor-default">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-primary-900">{pkg.name}</p>
                      <p className="text-sm text-primary-700 mt-1">
                        {formatBytes(pkg.volume)} {pkg.location && `• ${pkg.location}`}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-primary-600 text-white text-xs font-mono rounded">
                      {pkg.code}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
        {/* Manage Footer */}
        <div className="border-t border-gray-200 pt-4">
          <Link
            href={`/dashboard/esims/${esim.orderNo}`}
            className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Settings className="w-4 h-4" />
            Manage / Cancel This eSIM
          </Link>
        </div>
      </div>
    </Modal>
  );
}
