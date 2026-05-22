"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Container from "@/components/Container";
import Loader from "@/components/Loader";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import logger from "@/lib/logger";
import apiClient from "@/lib/apiClient";

interface BalanceData {
    balance: number;
    currency: string;
    lastUpdatedTime: string;
    accountStatus: string;
}

interface TransactionRecord {
    id: string;
    type: string;
    amount: number;
    currency: string;
    description: string;
    status: string;
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

export default function AdminBalancePage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    const [balance, setBalance] = useState<BalanceData | null>(null);
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        if (!user || user.role !== "ADMIN") {
            router.push("/");
            return;
        }

        const fetchData = async () => {
            try {
                const balanceResponse = await apiClient.get<any>("/orders/dashboard/active-esims?limit=5");
                if (balanceResponse.ok) {
                    const balanceData = await balanceResponse.json();
                    setBalance(balanceData.data);
                }

                const transResponse = await apiClient.get<any>("/wallet/transactions?limit=50");
                if (transResponse.ok) {
                    const transData = await transResponse.json();
                    setTransactions(transData.data || []);
                }
            } catch (err) {
                setError("Failed to load balance data");
                logger.error("Failed to load balance data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, authLoading, router]);

    const handleRefreshBalance = async () => {
        setRefreshing(true);
        try {
            const response = await apiClient.get<any>("/orders/dashboard/active-esims?limit=5");
            if (response.ok) {
                const data = await response.json();
                setBalance(data.data);
            }
        } catch (err) {
            logger.error("Failed to refresh balance:", err);
        } finally {
            setRefreshing(false);
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
                    <div className="grid gap-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-4xl font-bold">Balance & Wallet</h1>
                                <p className="text-gray-500 mt-2">
                                    Manage your account balance and transaction history
                                </p>
                            </div>
                            <Button onClick={handleRefreshBalance} disabled={refreshing}>
                                {refreshing ? "Refreshing..." : "Refresh Balance"}
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link href="/admin">
                                <Button variant="outline">Back to Admin</Button>
                            </Link>
                            <Link href="/admin/webhooks">
                                <Button variant="outline">Webhooks Config</Button>
                            </Link>
                            <Link href="/admin/orders">
                                <Button variant="outline">Admin Orders</Button>
                            </Link>
                        </div>
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

                {/* Balance Card */}
                {balance && (
                    <motion.div variants={itemVariants}>
                        <Card className="p-8 bg-linear-to-br from-primary-900 to-primary-700 text-white">
                            <div className="space-y-4">
                                <p className="text-primary-100">Current Balance</p>
                                <h2 className="text-5xl font-bold">
                                    {balance.currency} {balance.balance.toFixed(2)}
                                </h2>
                                <div className="flex justify-between pt-4 border-t border-primary-400">
                                    <div>
                                        <p className="text-primary-100 text-sm">Account Status</p>
                                        <p className="font-medium capitalize">
                                            {balance.accountStatus || "Active"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-primary-100 text-sm">Last Updated</p>
                                        <p className="font-medium">
                                            {balance.lastUpdatedTime
                                                ? new Date(balance.lastUpdatedTime).toLocaleString()
                                                : "Just now"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Quick Actions */}
                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    <Card className="p-4">
                        <h3 className="font-bold mb-2">Top Up Balance</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Add funds to your account
                        </p>
                        <Button className="w-full" variant="primary">
                            Add Funds
                        </Button>
                    </Card>

                    <Card className="p-4">
                        <h3 className="font-bold mb-2">View Settlements</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Check settlement reports
                        </p>
                        <Link href="/admin/payments">
                            <Button className="w-full" variant="outline">
                                View Settlements
                            </Button>
                        </Link>
                    </Card>

                    <Card className="p-4">
                        <h3 className="font-bold mb-2">Export Statement</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Download transaction history
                        </p>
                        <Button className="w-full" variant="outline">
                            Export
                        </Button>
                    </Card>
                </motion.div>

                {/* Transaction History */}
                <motion.div variants={itemVariants}>
                    <Card className="p-6">
                        <h2 className="text-2xl font-bold mb-6">Recent Transactions</h2>

                        {transactions.length === 0 ? (
                            <p className="text-gray-600 text-center py-8">
                                No transactions found
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
                                                Description
                                            </th>
                                            <th className="text-right py-3 px-4 font-semibold">
                                                Amount
                                            </th>
                                            <th className="text-left py-3 px-4 font-semibold">
                                                Status
                                            </th>
                                            <th className="text-left py-3 px-4 font-semibold">
                                                Date
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((transaction) => (
                                            <tr
                                                key={transaction.id}
                                                className="border-b hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="py-3 px-4">
                                                    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-900">
                                                        {transaction.type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-gray-600">
                                                    {transaction.description}
                                                </td>
                                                <td className="py-3 px-4 text-right font-semibold">
                                                    {transaction.type === "REFUND" ? "-" : "+"}
                                                    {transaction.currency} {transaction.amount.toFixed(2)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${transaction.status === "COMPLETED"
                                                            ? "bg-green-100 text-green-800"
                                                            : transaction.status === "PENDING"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-red-100 text-red-800"
                                                            }`}
                                                    >
                                                        {transaction.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-gray-600">
                                                    {new Date(transaction.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </motion.div>
            </motion.div>
        </Container>
    );
}

