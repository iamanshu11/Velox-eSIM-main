"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import apiClient from "@/lib/apiClient";
import { useToast } from "@/components/ToastProvider";

interface SuspendModalProps {
  isOpen: boolean;
  onClose: () => void;
  iccid: string;
  esimStatus: string;
  onSuccess: () => void;
}

export default function SuspendModal({
  isOpen,
  onClose,
  iccid,
  esimStatus,
  onSuccess,
}: SuspendModalProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSuspended =
    esimStatus?.toUpperCase()?.includes("SUSPEND") ?? false;

  const handleToggleSuspend = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = isSuspended
        ? `/esims/${iccid}/unsuspend`
        : `/esims/${iccid}/suspend`;

      await apiClient.post<any>(endpoint);

      const successMsg = isSuspended
        ? "eSIM resumed successfully!"
        : "eSIM suspended successfully!";
      addToast(successMsg, "success");
      
      onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update eSIM status";
      setError(errorMsg);
      addToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isSuspended ? "Resume eSIM" : "Pause eSIM"}
    >
      <div className="space-y-4">
        <div
          className={`p-4 rounded-lg border ${
            isSuspended
              ? "bg-green-50 border-green-200"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <p
            className={`text-sm ${
              isSuspended
                ? "text-green-800"
                : "text-amber-800"
            }`}
          >
            {isSuspended
              ? "This eSIM is currently suspended. You can resume it to restore internet access without losing your data."
              : "Suspending will temporarily disable this eSIM. Your data plan will be preserved and you can resume it anytime to restore internet access."}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Current Status:</span>{" "}
            <span className="text-gray-900">{esimStatus}</span>
          </p>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleToggleSuspend}
            disabled={loading}
            className={isSuspended ? "bg-primary-600 hover:bg-primary-700" : ""}
          >
            {loading
              ? isSuspended
                ? "Resuming..."
                : "Suspending..."
              : isSuspended
              ? "Resume eSIM"
              : "Suspend eSIM"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
