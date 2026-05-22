"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import apiClient from "@/lib/apiClient";
import { useToast } from "@/components/ToastProvider";

interface SMSModalProps {
  isOpen: boolean;
  onClose: () => void;
  esimTranNo: string;
  onSuccess: () => void;
}

const SMS_MAX_LENGTH = 160;

export default function SMSModal({
  isOpen,
  onClose,
  esimTranNo,
  onSuccess,
}: SMSModalProps) {
  const { addToast } = useToast();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendSMS = async () => {
    if (!message.trim()) {
      const errorMsg = "Message cannot be empty";
      setError(errorMsg);
      addToast(errorMsg, "warning");
      return;
    }

    if (message.length > SMS_MAX_LENGTH) {
      const errorMsg = `Message exceeds ${SMS_MAX_LENGTH} characters`;
      setError(errorMsg);
      addToast(errorMsg, "error");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        message: message.trim(),
      };

      await apiClient.post<any>(`/esims/${esimTranNo}/sms`, payload);

      addToast("SMS sent successfully!", "success");
      setMessage("");
      onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to send SMS";
      setError(errorMsg);
      addToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const isOverLimit = message.length > SMS_MAX_LENGTH;

  const handleClose = () => {
    setMessage("");
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send SMS to eSIM">
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            maxLength={SMS_MAX_LENGTH + 100}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-600">
              Standard SMS length: {SMS_MAX_LENGTH} characters
            </p>
            <p
              className={`text-sm font-medium ${
                isOverLimit ? "text-red-600" : "text-gray-600"
              }`}
            >
              {message.length} / {SMS_MAX_LENGTH}
            </p>
          </div>
        </div>

        {isOverLimit && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <p className="text-sm text-amber-800">
              Your message exceeds standard SMS length ({message.length} chars).
              It may be split into multiple messages and you may be charged
              accordingly.
            </p>
          </div>
        )}

        <div className="bg-primary-50 border border-primary-200 p-3 rounded-lg">
          <p className="text-sm text-primary-900">
            <strong>Note:</strong> SMS will be sent to this eSIM immediately.
          </p>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendSMS}
            disabled={loading || !message.trim()}
          >
            {loading ? "Sending..." : "Send SMS"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

