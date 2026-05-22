"use client";

import { motion } from "framer-motion";
import {
    Smartphone,
    Calendar,
    Wifi,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Clock,
    QrCode,
    Copy,
    Download,
} from "lucide-react";
import { useState } from "react";
import { ESimProfile } from "@/types";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import logger from '@/lib/logger';
import { formatBytes } from "@/utils/formatters";
import Image from "next/image";

interface ESimCardProps {
    profile: ESimProfile;
    onCancel?: (esimTranNo: string) => Promise<void>;
    onSendSms?: (esimTranNo: string) => void;
}

const parseDate = (dateStr: string | undefined) => {
    try {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return dateStr || "N/A";
    }
};

const getStatusColor = (status: string | undefined) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("in_use") || s.includes("enabled"))
        return { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" };
    if (s.includes("got_resource") || s.includes("released"))
        return { bg: "bg-primary-50", border: "border-primary-200", text: "text-primary-800" };
    if (s.includes("used_up") || s.includes("expired"))
        return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" };
    if (s.includes("cancel") || s.includes("revoked"))
        return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" };
    return { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700" };
};

const getStatusIcon = (status: string | undefined) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("in_use") || s.includes("enabled"))
        return <CheckCircle2 className="w-4 h-4" />;
    if (s.includes("cancel") || s.includes("revoked"))
        return <XCircle className="w-4 h-4" />;
    if (s.includes("used_up") || s.includes("expired"))
        return <AlertCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
};

const getDataPercentage = (used: number | undefined, total: number | undefined) => {
    return (total ?? 0) > 0 ? Math.round(((used ?? 0) / (total ?? 0)) * 100) : 0;
};

export function ESimCard({ profile, onCancel, onSendSms }: ESimCardProps) {
    const [showQR, setShowQR] = useState(false);
    const [copying, setCopying] = useState<string | null>(null);
    const [canceling, setCanceling] = useState(false);

    const statusColor = getStatusColor(profile.esimStatus || profile.status);
    const dataPercentage = getDataPercentage(profile.orderUsage || profile.dataUsed, profile.totalVolume || profile.dataTotal);
    const remainingData = (profile.totalVolume || profile.dataTotal || 0) - (profile.orderUsage || profile.dataUsed || 0);

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopying(id);
            setTimeout(() => setCopying(null), 2000);
        } catch (err) {
            logger.error('Failed to copy profile access code', err);
        }
    };

    const handleCancel = async () => {
        if (!onCancel) return;
        if (!confirm("Are you sure you want to cancel this eSIM?")) return;

        try {
            setCanceling(true);
            await onCancel(profile.esimTranNo);
        } finally {
            setCanceling(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-xl p-6 ${statusColor.bg} ${statusColor.border} space-y-5`}
        >
            {/* Header with status */}
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-linear-to-br from-primary-700 to-primary-900 rounded-lg text-white">
                        <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">
                            {profile.packageList?.[0]?.packageName || "eSIM Profile"}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">Order: {profile.orderNo}</p>
                    </div>
                </div>
                <div>
                  <Badge
                    variant={
                      profile.esimStatus?.toLowerCase().includes("in_use") || 
                      profile.esimStatus?.toLowerCase().includes("enabled")
                        ? "active"
                        : profile.esimStatus?.toLowerCase().includes("got_resource")
                        ? "ready"
                        : profile.esimStatus?.toLowerCase().includes("expire")
                        ? "expiring"
                        : profile.esimStatus?.toLowerCase().includes("cancel")
                        ? "danger"
                        : "inactive"
                    }
                    size="md"
                  >
                    {getStatusIcon(profile.esimStatus)}
                    <span className="capitalize">
                      {profile.esimStatus?.replace(/_/g, " ")}
                    </span>
                  </Badge>
                </div>
            </div>

            {/* Activation Code */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Activation Code</label>
                <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-white px-3 py-2 rounded-lg border border-gray-200 font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                        {profile.ac || "N/A"}
                    </code>
                    <button
                        onClick={() => {
                            const id = `ac-${profile.esimTranNo}`;
                            copyToClipboard(profile.ac || "", id);
                        }}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                        title="Copy activation code"
                    >
                        {copying === `ac-${profile.esimTranNo}` ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                            <Copy className="w-4 h-4 text-gray-600" />
                        )}
                    </button>
                    <a
                        href={profile.qrCodeUrl}
                        download
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                        title="Download QR code"
                    >
                        <Download className="w-4 h-4 text-gray-600" />
                    </a>
                </div>
            </div>

            {/* QR Code Preview */}
            {showQR && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2"
                >
                    {profile.qrCodeUrl && (
                        <Image
                            width={128}
                            height={128}
                            src={profile.qrCodeUrl}
                            alt="eSIM QR Code"
                            className="mx-auto border-2 border-gray-300 rounded-lg"
                        />
                    )}
                </motion.div>
            )}

            {/* Data Usage */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Wifi className="w-4 h-4" />
                        Data Usage
                    </label>
                    <span className="text-sm text-gray-600">
                        {formatBytes(profile.orderUsage || profile.dataUsed)} / {formatBytes(profile.totalVolume || profile.dataTotal)}
                    </span>
                </div>
                <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-gray-200">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dataPercentage}%` }}
                        className={`h-full ${dataPercentage > 90
                            ? "bg-red-500"
                            : dataPercentage > 70
                                ? "bg-amber-500"
                                : "bg-green-500"
                            }`}
                    />
                </div>
                <p className="text-xs text-gray-600">
                    {dataPercentage}% used • {formatBytes(remainingData)} remaining
                </p>
            </div>

            {/* Validity */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Validity
                    </p>
                    <p className="font-semibold text-gray-900">
                        {profile.totalDuration} {profile.durationUnit}
                    </p>
                </div>
                <div className="space-y-1">
                    <p className="text-xs text-gray-600">Expires</p>
                    <p className="font-semibold text-gray-900">
                        {parseDate(profile.expiredTime)}
                    </p>
                </div>
            </div>

            {/* ICCID */}
            <div className="space-y-1">
                <label className="text-xs text-gray-600">ICCID</label>
                <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-white px-2 py-1 rounded border border-gray-200 font-mono truncate">
                        {profile.iccid}
                    </code>
                    <button
                        onClick={() => {
                            const id = `iccid-${profile.esimTranNo}`;
                            copyToClipboard(profile.iccid, id);
                        }}
                        className="p-1.5 hover:bg-white rounded transition-colors"
                    >
                        {copying === `iccid-${profile.esimTranNo}` ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                            <Copy className="w-3.5 h-3.5 text-gray-600" />
                        )}
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowQR(!showQR)}
                    className="flex-1"
                >
                    <QrCode className="w-4 h-4" />
                    {showQR ? "Hide QR" : "Show QR"}
                </Button>
                {onSendSms && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onSendSms(profile.esimTranNo)}
                        className="flex-1"
                    >
                        Send SMS
                    </Button>
                )}
                {onCancel && !profile.esimStatus?.includes("USED") && (
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={handleCancel}
                        isLoading={canceling}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                )}
            </div>
        </motion.div>
    );
}
