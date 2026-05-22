"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Input from "@/components/Input";
import Container from "@/components/Container";
import Loader from "@/components/Loader";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import logger from "@/lib/logger";

interface WebhookConfig {
    webhookUrl: string;
    isActive: boolean;
    lastTriggered: string;
    failureCount: number;
}

interface WebhookEvent {
    id: string;
    notifyType: string;
    notifyId: string;
    orderNo: string;
    esimTranNo: string;
    processed: boolean;
    processedAt: string;
    errorMessage: string;
    retryCount: number;
    createdAt: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function AdminWebhookPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    const [config, setConfig] = useState<WebhookConfig | null>(null);
    const [events, setEvents] = useState<WebhookEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [webhookUrl, setWebhookUrl] = useState("");
    const [tab, setTab] = useState<"config" | "history" | "pending">("config");

    useEffect(() => {
        if (authLoading) return;

        if (!user || user.role !== "ADMIN") {
            router.push("/");
            return;
        }

        const fetchData = async () => {
            try {
                const configResponse = await apiClient.get<any>("/webhooks/esim-access/config");
                if (configResponse?.data) {
                    setConfig(configResponse.data);
                    setWebhookUrl(configResponse.data?.webhookUrl || "");
                }

                const historyResponse = await apiClient.get<any>("/webhooks/history?limit=50");
                if (historyResponse?.data) {
                    setEvents(historyResponse.data?.webhooks || []);
                }
            } catch (err) {
                setError("Failed to load webhook configuration");
                logger.error("Failed to load webhook data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, authLoading, router]);

    const handleSaveWebhook = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        if (!webhookUrl.startsWith("http")) {
            setError("Webhook URL must start with http:// or https://");
            setSaving(false);
            return;
        }

        try {
            const response = await apiClient.post<any>("/webhooks/setup", { webhookUrl });

            if (!response?.success) throw new Error("Failed to save webhook");

            setSuccess("Webhook configuration saved successfully!");
        } catch (err: any) {
            setError(err.message || "Failed to save webhook");
        } finally {
            setSaving(false);
        }
    };

    const handleRetryFailed = async () => {
        try {
            const response = await apiClient.post<any>("/webhooks/retry", {});

            if (response?.success) {
                setSuccess("Retry initiated for failed webhooks");
            }
        } catch (err) {
            setError("Failed to retry webhooks");
        }
    };

    if (authLoading || loading) {
        return (
            <Container>
                <div className="flex items-center justify-center min-h-screen">
                    <Loader />
                </div>
            </Container>
        );
    }

    return (
        <Container>
            <motion.div
                className="grid gap-6 py-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div variants={itemVariants}>
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold">Webhook Configuration</h1>
                            <p className="text-gray-500 mt-2">
                                Manage webhooks for real-time notifications
                            </p>
                        </div>
                        <Link href="/admin">
                            <Button variant="outline">Back to Admin</Button>
                        </Link>
                    </div>
                </motion.div>

                {/* Error Alert */}
                {error && (
                    <motion.div
                        variants={itemVariants}
                        className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Success Alert */}
                {success && (
                    <motion.div
                        variants={itemVariants}
                        className="p-4 bg-primary-50 border border-primary-200 rounded-lg text-primary-700"
                    >
                        {success}
                    </motion.div>
                )}

                {/* Tabs */}
                <motion.div variants={itemVariants} className="flex gap-2 border-b">
                    {(["config", "history", "pending"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 font-medium capitalize transition-colors ${tab === t
                                    ? "text-primary-700 border-b-2 border-primary-700"
                                    : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            {t === "config"
                                ? "Configuration"
                                : t === "history"
                                    ? "History"
                                    : "Pending"}
                        </button>
                    ))}
                </motion.div>

                {/* Configuration Tab */}
                {tab === "config" && (
                    <motion.div variants={itemVariants}>
                        <Card className="p-6 space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Webhook Endpoint</h2>
                                <p className="text-gray-600 mb-4">
                                    Webhooks from eSIM Access API will be sent to the configured URL
                                </p>
                            </div>

                            <form onSubmit={handleSaveWebhook} className="space-y-4">
                                <Input
                                    label="Webhook URL"
                                    type="url"
                                    value={webhookUrl}
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                    placeholder="https://example.com/api/webhooks/esim-access"
                                    required
                                />

                                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                                    <p className="text-sm text-primary-900">
                                        <strong>Receiving URL:</strong>
                                        <br />
                                        POST /api/webhooks/esim-access
                                    </p>
                                </div>

                                <Button type="submit" disabled={saving} className="w-full">
                                    {saving ? "Saving..." : "Save Webhook Configuration"}
                                </Button>
                            </form>

                            {/* Current Configuration */}
                            {config && (
                                <div className="mt-8 pt-8 border-t space-y-4">
                                    <h3 className="font-bold text-lg">Current Configuration</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded">
                                            <p className="text-gray-600 text-sm">Status</p>
                                            <p
                                                className={`font-medium mt-1 ${config.isActive ? "text-green-600" : "text-red-600"
                                                    }`}
                                            >
                                                {config.isActive ? "Active" : "Inactive"}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded">
                                            <p className="text-gray-600 text-sm">Failures</p>
                                            <p className="font-medium mt-1">{config.failureCount}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded col-span-2">
                                            <p className="text-gray-600 text-sm">Last Triggered</p>
                                            <p className="font-medium mt-1">
                                                {config.lastTriggered
                                                    ? new Date(config.lastTriggered).toLocaleString()
                                                    : "Never"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </motion.div>
                )}

                {/* History Tab */}
                {tab === "history" && (
                    <motion.div variants={itemVariants}>
                        <Card className="p-6">
                            <h2 className="text-2xl font-bold mb-6">Webhook History</h2>

                            {events.length === 0 ? (
                                <p className="text-gray-600 text-center py-8">
                                    No webhook events found
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 font-semibold">
                                                    Type
                                                </th>
                                                <th className="text-left py-3 px-4 font-semibold">
                                                    Order No
                                                </th>
                                                <th className="text-left py-3 px-4 font-semibold">
                                                    Status
                                                </th>
                                                <th className="text-left py-3 px-4 font-semibold">
                                                    Retries
                                                </th>
                                                <th className="text-left py-3 px-4 font-semibold">
                                                    Date
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {events.map((event) => (
                                                <tr
                                                    key={event.id}
                                                    className="border-b hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="py-3 px-4">
                                                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-900">
                                                            {event.notifyType}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-mono text-sm">
                                                        {event.orderNo}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span
                                                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${event.processed
                                                                    ? "bg-green-100 text-green-800"
                                                                    : event.errorMessage
                                                                        ? "bg-red-100 text-red-800"
                                                                        : "bg-yellow-100 text-yellow-800"
                                                                }`}
                                                        >
                                                            {event.processed
                                                                ? "Processed"
                                                                : event.errorMessage
                                                                    ? "Failed"
                                                                    : "Pending"}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">{event.retryCount}</td>
                                                    <td className="py-3 px-4 text-gray-600 text-sm">
                                                        {new Date(event.createdAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </motion.div>
                )}

                {/* Pending Tab */}
                {tab === "pending" && (
                    <motion.div variants={itemVariants} className="space-y-6">
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Failed Webhooks</h2>
                                <Button
                                    onClick={handleRetryFailed}
                                    variant="primary"
                                >
                                    Retry Failed
                                </Button>
                            </div>

                            {events.filter((e) => !e.processed && e.errorMessage).length ===
                                0 ? (
                                <p className="text-gray-600 text-center py-8">
                                    No failed webhooks
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {events
                                        .filter((e) => !e.processed && e.errorMessage)
                                        .map((event) => (
                                            <Card
                                                key={event.id}
                                                className="p-4 border border-red-200 bg-red-50"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-bold">
                                                            {event.notifyType} - {event.orderNo}
                                                        </h3>
                                                        <p className="text-sm text-red-700 mt-2">
                                                            {event.errorMessage}
                                                        </p>
                                                        <p className="text-xs text-gray-600 mt-2">
                                                            Retried {event.retryCount} times
                                                        </p>
                                                    </div>
                                                    <span className="text-xs text-gray-600">
                                                        {new Date(event.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                            </Card>
                                        ))}
                                </div>
                            )}
                        </Card>
                    </motion.div>
                )}
            </motion.div>
        </Container>
    );
}

