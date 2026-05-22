'use client';

import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import QRCode from './QRCode';
import type { ESIM } from '@/services/eSIMService';

interface ESIMDetailsModalProps {
    isOpen: boolean;
    esim: ESIM | null;
    onClose: () => void;
}
export default function ESIMDetailsModal({ isOpen, esim, onClose }: ESIMDetailsModalProps) {
    const [copied, setCopied] = useState<string | null>(null);

    if (!isOpen || !esim) return null;

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    const qrData = esim.iccid || `eSIM-${esim.id}`;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-linear-to-r from-primary-50 to-primary-100 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{esim.plan?.country || 'eSIM'}</h2>
                        <p className="text-sm text-gray-600 mt-1">{esim.plan?.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8">
                    {/* QR Code Section */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activation QR Code</h3>
                        <div className="flex flex-col items-center gap-4">
                            <QRCode value={qrData} size={250} />
                            <p className="text-sm text-gray-600 text-center">
                                Scan this QR code with your phone to activate your eSIM profile
                            </p>
                        </div>
                    </div>

                    {/* Activation Instructions */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Activation Steps</h3>
                        <ol className="space-y-3">
                            <li className="flex gap-4">
                                <span className="shrink-0 w-6 h-6 bg-primary-700 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                                <span className="text-gray-700">
                                    On your eSIM-compatible device, go to <strong>Settings → Mobile/Cellular</strong>
                                </span>
                            </li>
                            <li className="flex gap-4">
                                <span className="shrink-0 w-6 h-6 bg-primary-700 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                                <span className="text-gray-700">
                                    Select <strong>Add Cellular Plan</strong> or <strong>Add eSIM</strong>
                                </span>
                            </li>
                            <li className="flex gap-4">
                                <span className="shrink-0 w-6 h-6 bg-primary-700 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                                <span className="text-gray-700">
                                    Tap <strong>Scan QR Code</strong> and scan the code above, or enter the ICCID manually
                                </span>
                            </li>
                            <li className="flex gap-4">
                                <span className="shrink-0 w-6 h-6 bg-primary-700 text-white rounded-full flex items-center justify-center text-sm font-semibold">4</span>
                                <span className="text-gray-700">
                                    Follow the prompts to set up your plan and confirm
                                </span>
                            </li>
                        </ol>
                    </div>

                    {/* eSIM Details */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Plan Details</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Data</p>
                                <p className="text-lg font-semibold text-gray-900">{esim.plan?.dataAmount || 0} {esim.plan?.dataUnit || 'GB'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Validity</p>
                                <p className="text-lg font-semibold text-gray-900">{esim.plan?.validity || 0} {esim.plan?.validityUnit || 'Days'}</p>
                            </div>
                        </div>

                        {esim.expiresAt && (
                            <div>
                                <p className="text-sm text-gray-600">Expiration Date</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {new Date(esim.expiresAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ICCID & Activation Code */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Manual Activation Details</h3>

                        <div>
                            <label className="text-sm text-gray-600 mb-2 block">ICCID</label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-mono text-sm break-all">
                                    {esim.iccid}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(esim.iccid, 'iccid')}
                                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    {copied === 'iccid' ? (
                                        <Check className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <Copy className="w-5 h-5 text-gray-600" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Use this code if QR code scanning doesn't work on your device
                            </p>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${esim.status?.toUpperCase() === 'ACTIVE' ? 'bg-green-500' :
                                esim.status?.toUpperCase() === 'INACTIVE' ? 'bg-gray-500' :
                                    'bg-red-500'
                                }`} />
                            <span className="font-semibold text-gray-900">
                                Status: <span className={
                                    esim.status?.toUpperCase() === 'ACTIVE' ? 'text-green-600' :
                                        esim.status?.toUpperCase() === 'INACTIVE' ? 'text-gray-600' :
                                            'text-red-600'
                                }>{esim.status?.toUpperCase()}</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

