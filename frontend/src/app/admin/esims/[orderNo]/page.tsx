"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { BackendApiResponse } from "@/types/api";
import Card from "@/components/Card";
import logger from "@/lib/logger";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Loader from "@/components/Loader";
import TopUpModal from "@/components/TopUpModal";
import SuspendModal from "@/components/SuspendModal";
import CancelESIMModal from "@/components/CancelESIMModal";
import DataUsageChart from "@/components/DataUsageChart";
import SMSModal from "@/components/SMSModal";

interface ESimProfile {
  esimTranNo: string;
  orderNo: string;
  iccid: string;
  imsi: string;
  smdpStatus: string;
  esimStatus: string;
  ac: string;
  qrCodeUrl: string;
  shortUrl?: string;
  activateTime?: string;
  installationTime?: string;
  expiredTime: string;
  totalVolume: number;
  orderUsage: number;
  totalDuration: number;
  durationUnit: string;
  eid?: string;
  apn?: string;
  ipExport?: string;
  transactionId?: string;
  packageList: Array<{
    packageCode: string;
    packageName?: string;
    duration: number;
    volume: number;
    locationCode: string;
    createTime: string;
  }>;
}

export default function AdminOrderESIMDetailPage() {
  const params = useParams();
  const orderNo = params.orderNo as string;

  const [profiles, setProfiles] = useState<ESimProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ESimProfile | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<
    "profile" | "data" | "coverage" | "action"
  >("profile");
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isSMSModalOpen, setIsSMSModalOpen] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<BackendApiResponse<ESimProfile[]>>(`/esims/profiles/${orderNo}`);
        const data = res?.data || [];
        const profilesArray = Array.isArray(data) ? data : [];
        setProfiles(profilesArray);
        if (profilesArray.length > 0) {
          setSelectedProfile(profilesArray[0]);
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load profiles";
        setError(errorMsg);
        logger.error("Error loading profiles:", err);
      } finally {
        setLoading(false);
      }
    };

    if (orderNo) {
      fetchProfiles();
    }
  }, [orderNo]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
  };


  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatExpiryDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const getStatusColor = (status: string): string => {
    const s = status?.toUpperCase() || "";
    if (s === "IN_USE") return "bg-green-100 text-green-800";
    if (s === "GOT_RESOURCE") return "bg-primary-100 text-primary-900";
    if (s === "USED_EXPIRED") return "bg-orange-100 text-orange-800";
    if (s === "CANCEL" || s === "SUSPENDED") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const handleRefreshProfiles = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<BackendApiResponse<ESimProfile[]>>(`/esims/profiles/${orderNo}`);
      const data = res?.data || [];
      const profilesArray = Array.isArray(data) ? data : [];
      setProfiles(profilesArray);
      if (profilesArray.length > 0) {
        setSelectedProfile(profilesArray[0]);
      }
    } catch (err) {
      logger.error("Error refreshing profiles:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSmdpStatusColor = (status: string): string => {
    const s = status?.toUpperCase() || "";
    if (s === "DELETED") return "bg-red-100 text-red-800";
    if (s === "RELEASED") return "bg-amber-100 text-amber-800";
    if (s === "AVAILABLE") return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader />
        <p className="text-gray-600 mt-4">Loading eSIM profiles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Order {orderNo}
            </h1>
            <p className="text-gray-600 mt-2">eSIM Profiles</p>
          </div>
          <Link href="/admin/orders">
            <Button variant="secondary">Back to Orders</Button>
          </Link>
        </div>
        <Card className="p-8 bg-red-50 border border-red-200">
          <p className="text-red-800 font-medium">Error: {error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Order {orderNo}</h1>
          <p className="text-gray-600 mt-2">
            {profiles.length} eSIM Profile{profiles.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/admin/orders">
          <Button variant="secondary">Back to Orders</Button>
        </Link>
      </div>

      {/* eSIMs Table */}
      {profiles.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Plan Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    eSIM Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Data Left
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Time Left
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Activated
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    eSIM Trans No
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    SMDP Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {profiles.map((profile) => {
                  const daysLeft = profile.expiredTime
                    ? Math.ceil(
                        (new Date(profile.expiredTime).getTime() -
                          new Date().getTime()) /
                          (1000 * 60 * 60 * 24),
                      )
                    : 0;
                  const dataLeft = profile.totalVolume - profile.orderUsage;
                  const installDate =
                    profile.installationTime || profile.activateTime || "N/A";

                  return (
                    <tr
                      key={profile.esimTranNo}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {profile.packageList?.[0]?.packageName || "N/A"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusColor(profile.esimStatus)}>
                          {profile.esimStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">
                          {formatBytes(dataLeft)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">
                          {daysLeft > 0 ? `${daysLeft} days` : "Expired"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">
                          {typeof installDate === "string" &&
                          installDate !== "N/A"
                            ? formatDate(installDate)
                            : "Not yet"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs font-mono text-gray-900">
                          {profile.esimTranNo}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={getSmdpStatusColor(profile.smdpStatus)}
                        >
                          {profile.smdpStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedProfile(profile)}
                          className="text-sm text-primary-700 hover:text-primary-900 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Detailed Profile View */}
      {selectedProfile && (
        <Card className="p-8">
          <div className="space-y-6">
            {/* Close and Name */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedProfile.packageList?.[0]?.packageName}
              </h2>
              <button
                onClick={() => setSelectedProfile(null)}
                className="text-gray-500 hover:text-gray-700 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
              {(["profile", "data", "coverage", "action"] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? "text-primary-700 border-b-2 border-primary-700"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab === "profile" && "Profile"}
                    {tab === "data" && "Data Plan"}
                    {tab === "coverage" && "Coverage"}
                    {tab === "action" && "Action"}
                  </button>
                ),
              )}
            </div>

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-8">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">
                        eSIM Tran No
                      </p>
                      <p className="text-sm font-mono text-gray-900 mt-2">
                        {selectedProfile.esimTranNo}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">
                        Order No (Batch ID)
                      </p>
                      <p className="text-sm font-mono text-gray-900 mt-2">
                        {selectedProfile.orderNo}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">
                        Create Time
                      </p>
                      <p className="text-sm text-gray-900 mt-2">
                        {formatDate(
                          selectedProfile.packageList?.[0]?.createTime,
                        )}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">
                        Activate Time
                      </p>
                      <p className="text-sm text-gray-900 mt-2">
                        {formatDate(selectedProfile.activateTime)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">
                        Installation Time
                      </p>
                      <p className="text-sm text-gray-900 mt-2">
                        {formatDate(selectedProfile.installationTime)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">
                        Merchant Transaction ID
                      </p>
                      <p className="text-sm font-mono text-gray-900 mt-2 break-all">
                        {selectedProfile.transactionId}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">
                        eSIM Status
                      </p>
                      <Badge
                        className={getStatusColor(selectedProfile.esimStatus)}
                      >
                        {selectedProfile.esimStatus}
                      </Badge>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">
                        SMDP Status
                      </p>
                      <Badge
                        className={getSmdpStatusColor(
                          selectedProfile.smdpStatus,
                        )}
                      >
                        {selectedProfile.smdpStatus}
                      </Badge>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">
                        ICCID
                      </p>
                      <p className="text-sm font-mono text-gray-900 mt-2 break-all">
                        {selectedProfile.iccid}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">
                        IMSI
                      </p>
                      <p className="text-sm font-mono text-gray-900 mt-2">
                        {selectedProfile.imsi}
                      </p>
                    </div>
                  </div>
                </div>

                {/* eSIM Install Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    eSIM Install Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-primary-50 p-4 rounded col-span-2">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide mb-2">
                        Activation Code String
                      </p>
                      <p className="text-sm font-mono text-gray-900 break-all">
                        {selectedProfile.ac}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">
                        SM-DP+ Address
                      </p>
                      <p className="text-sm text-gray-900 mt-2">
                        rsp-eu.simlessly.com
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">
                        Activation Code
                      </p>
                      <p className="text-sm font-mono text-gray-900 mt-2">
                        {selectedProfile.ac.split("$")[2]}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded col-span-2">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide mb-2">
                        QR Code URL
                      </p>
                      <a
                        href={selectedProfile.qrCodeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-700 hover:text-primary-900 text-sm break-all"
                      >
                        {selectedProfile.qrCodeUrl}
                      </a>
                    </div>
                    <div className="bg-gray-50 p-4 rounded col-span-2">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide mb-2">
                        iOS Universal Link
                      </p>
                      <a
                        href={`https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(selectedProfile.ac)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-700 hover:text-primary-900 text-sm break-all"
                      >
                        View iOS Setup Link
                      </a>
                    </div>
                    <div className="bg-gray-50 p-4 rounded col-span-2">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide mb-2">
                        Android Universal Link
                      </p>
                      <a
                        href={`https://esimsetup.android.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(selectedProfile.ac)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-700 hover:text-primary-900 text-sm break-all"
                      >
                        View Android Setup Link
                      </a>
                    </div>
                  </div>
                </div>

                {/* Device Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Device Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">
                        EID
                      </p>
                      <p className="text-sm font-mono text-gray-900 mt-2 break-all">
                        {selectedProfile.eid || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data Plan Tab */}
            {activeTab === "data" && (
              <div className="space-y-8">
                {/* Data Usage Chart */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Data Usage
                  </h3>
                  <DataUsageChart
                    used={selectedProfile.orderUsage}
                    total={selectedProfile.totalVolume}
                    unit="GB"
                  />
                </div>

                {/* Time Remaining */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Validity Period
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">
                        Total Duration
                      </p>
                      <p className="text-sm text-gray-900 mt-2">
                        {selectedProfile.totalDuration}{" "}
                        {selectedProfile.durationUnit}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">
                        Expires On
                      </p>
                      <p className="text-sm text-gray-900 mt-2">
                        {formatExpiryDate(selectedProfile.expiredTime)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Basic Plan */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Basic Plan
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">
                        Name
                      </p>
                      <p className="text-sm text-gray-900 mt-2">
                        {selectedProfile.packageList?.[0]?.packageName}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">
                        Code
                      </p>
                      <p className="text-sm font-mono text-gray-900 mt-2">
                        {selectedProfile.packageList?.[0]?.packageCode}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">
                        Region
                      </p>
                      <p className="text-sm text-gray-900 mt-2">
                        {selectedProfile.packageList?.[0]?.locationCode}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">
                        APN
                      </p>
                      <p className="text-sm text-gray-900 mt-2">
                        {selectedProfile.apn || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Coverage Tab */}
            {activeTab === "coverage" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Coverage and Networks
                  </h3>
                  <div className="bg-gray-50 p-6 rounded">
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Country or Area
                    </p>
                    <p className="text-lg text-primary-700 font-medium">
                      {selectedProfile.packageList?.[0]?.locationCode}
                    </p>
                    <p className="text-sm text-gray-600 mt-4">
                      Available networks in this region
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Tab */}
            {activeTab === "action" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => setIsSMSModalOpen(true)}
                    className="px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded font-medium transition-colors text-left"
                  >
                    💬 Send SMS to This eSIM
                  </button>
                  <button 
                    onClick={() => setIsTopUpModalOpen(true)}
                    className="px-4 py-3 bg-primary-50 hover:bg-primary-100 text-primary-800 rounded font-medium transition-colors text-left"
                  >
                    ➕ Add More Data to This eSIM
                  </button>
                  <button 
                    onClick={() => setIsSuspendModalOpen(true)}
                    className="px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded font-medium transition-colors text-left"
                  >
                    ⏸ Suspend This eSIM While in Use
                  </button>
                  <button 
                    onClick={() => setIsCancelModalOpen(true)}
                    className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded font-medium transition-colors text-left"
                  >
                    Cancel This eSIM and Refund Wallet
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* TopUp Modal */}
      {selectedProfile && (
        <TopUpModal
          isOpen={isTopUpModalOpen}
          onClose={() => setIsTopUpModalOpen(false)}
          esimTranNo={selectedProfile.esimTranNo}
          locationCode={selectedProfile.packageList?.[0]?.locationCode || ""}
          onSuccess={handleRefreshProfiles}
        />
      )}

      {/* Suspend Modal */}
      {selectedProfile && (
        <SuspendModal
          isOpen={isSuspendModalOpen}
          onClose={() => setIsSuspendModalOpen(false)}
          iccid={selectedProfile.iccid}
          esimStatus={selectedProfile.esimStatus}
          onSuccess={handleRefreshProfiles}
        />
      )}

      {/* Cancel Modal */}
      {selectedProfile && (
        <CancelESIMModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          esimTranNo={selectedProfile.esimTranNo}
          onSuccess={() => {
            window.location.href = "/admin/orders";
          }}
        />
      )}

      {/* SMS Modal */}
      {selectedProfile && (
        <SMSModal
          isOpen={isSMSModalOpen}
          onClose={() => setIsSMSModalOpen(false)}
          esimTranNo={selectedProfile.esimTranNo}
          onSuccess={handleRefreshProfiles}
        />
      )}
    </div>
  );
}

