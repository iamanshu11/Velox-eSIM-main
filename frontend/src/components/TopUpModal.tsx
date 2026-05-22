"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import apiClient from "@/lib/apiClient";
import { useToast } from "@/components/ToastProvider";

interface DataPackage {
  packageCode: string;
  packageName: string;
  volume: number;
  duration: number;
  price: number;
  locationCode: string;
}

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  esimTranNo: string;
  locationCode: string;
  onSuccess: () => void;
}

export default function TopUpModal({
  isOpen,
  onClose,
  esimTranNo,
  locationCode,
  onSuccess,
}: TopUpModalProps) {
  const { addToast } = useToast();
  const [packages, setPackages] = useState<DataPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<DataPackage | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPackages();
    } else {
      setError(null);
      setSelectedPackage(null);
    }
  }, [isOpen]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<any>(
        `/esims/packages?location=${locationCode}`
      );
      const data = Array.isArray(res?.data) ? res.data : [];
      setPackages(data.slice(0, 10));
      if (data.length > 0) {
        setSelectedPackage(data[0]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load packages";
      setError(errorMsg);
      addToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!selectedPackage) {
      const errorMsg = "Please select a package";
      setError(errorMsg);
      addToast(errorMsg, "warning");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        packageCode: selectedPackage.packageCode,
      };

      await apiClient.post<any>(`/esims/${esimTranNo}/topup`, payload);

      addToast("eSIM topped up successfully!", "success");
      setSelectedPackage(null);
      setError(null);
      onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to topup eSIM";
      setError(errorMsg);
      addToast(errorMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSelectedPackage(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add More Data">
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="py-6">
            <p className="text-gray-600 text-center">Loading packages...</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="py-6">
            <p className="text-gray-600 text-center">
              No packages available for this location
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Select Package
              </label>
              <select
                value={selectedPackage?.packageCode || ""}
                onChange={(e) => {
                  const pkg = packages.find(
                    (p) => p.packageCode === e.target.value
                  );
                  setSelectedPackage(pkg || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {packages.map((pkg) => (
                  <option key={pkg.packageCode} value={pkg.packageCode}>
                    {pkg.packageName} - {pkg.volume}GB / {pkg.duration} Days -
                    ${pkg.price}
                  </option>
                ))}
              </select>
            </div>

            {selectedPackage && (
              <div className="bg-primary-50 border border-primary-200 p-4 rounded-lg">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  Summary
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-2 rounded">
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      Data
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedPackage.volume}GB
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      Duration
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedPackage.duration} days
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      Price
                    </p>
                    <p className="text-lg font-bold text-primary-700">
                      ${selectedPackage.price}
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      Location
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedPackage.locationCode}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleTopUp}
            disabled={submitting || !selectedPackage || loading}
          >
            {submitting ? "Adding..." : "Confirm TopUp"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

