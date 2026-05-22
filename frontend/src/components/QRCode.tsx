'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';

interface QRCodeProps {
    value: string;
    size?: number;
    level?: 'L' | 'M' | 'Q' | 'H';
    includeMargin?: boolean;
    className?: string;
}
export default function QRCode({
    value,
    size = 200,
    level = 'M',
    includeMargin = true,
    className = '',
}: QRCodeProps) {
    const qrCodeUrl = useMemo(() => {
        if (!value) return '';
        const encodedValue = encodeURIComponent(value);
        const margin = includeMargin ? 1 : 0;
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}&margin=${margin}&ecc=${level}`;
    }, [value, size, level, includeMargin]);

    if (!qrCodeUrl) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ width: size, height: size }}>
                <p className="text-sm text-gray-600">Invalid QR data</p>
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center gap-3 ${className}`}>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <Image
                    src={qrCodeUrl}
                    alt="QR Code"
                    width={size}
                    height={size}
                    quality={100}
                    priority
                    className="block"
                />
            </div>
        </div>
    );
}
