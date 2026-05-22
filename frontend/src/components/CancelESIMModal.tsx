"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import apiClient from "@/lib/apiClient";
import { useToast } from "@/components/ToastProvider";

interface CancelESIMModalProps {
  isOpen: boolean;
  onClose: () => void;
  esimTranNo: string;
  onSuccess: () => void;
}

interface CancelESIMResponse {
  esimTranNo: string;
  orderNo?: string;
  refund?: {
    amount: number;
    currency: string;
    reference: string;
    balanceAfter: number;
  };
}

export default function CancelESIMModal({
  isOpen,
  onClose,
  esimTranNo,
  onSuccess,
}: CancelESIMModalProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleCancel = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post<{ data?: CancelESIMResponse; message?: string }>(`/esims/${esimTranNo}/cancel`);

      const refundAmount = response?.data?.refund?.amount;
      const refundCurrency = response?.data?.refund?.currency || "USD";
      const refundMessage =
        typeof refundAmount === "number"
          ? `eSIM cancelled and ${new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: refundCurrency,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(refundAmount)} refunded to the user's wallet.`
          : "eSIM cancelled successfully.";

      addToast(response?.message || refundMessage, "success");
      onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to cancel eSIM";
      setError(errorMsg);
      addToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setConfirmed(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cancel eSIM and Refund Wallet"
    >
      <div className="space-y-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="font-bold text-red-800 flex items-center gap-2">
            Warning: This Action is Permanent
          </p>
          <p className="text-red-700 text-sm mt-3">
            Canceling this eSIM cannot be undone. The user will lose:
          </p>
          <ul className="text-red-700 text-sm mt-2 ml-4 space-y-1 list-disc list-inside">
            <li>All remaining data plan</li>
            <li>Device connectivity</li>
            <li>All plan validity</li>
            <li>The purchase amount will be returned to the user's wallet</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-5 h-5 mt-0.5 cursor-pointer"
            />
            <span className="text-sm text-gray-700">
              I understand this action is <strong>permanent and cannot be undone</strong>. I confirm I want to cancel this eSIM and return the balance to the user's wallet.
            </span>
          </label>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Keep eSIM
          </Button>
          <Button
            onClick={handleCancel}
            disabled={loading || !confirmed}
            className={`bg-red-600 hover:bg-red-700 ${
              !confirmed ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Canceling and Refunding..." : "Yes, Cancel and Refund"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
