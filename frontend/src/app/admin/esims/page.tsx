"use client";

import { apiClient } from "@/lib/apiClient";
import { BackendApiResponse } from "@/types/api";
import { exportCSV } from "@/lib/exportHelper";
import { Download, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Pagination } from "@/components/Pagination";
import { CardSkeleton } from "@/components/SkeletonLoader";
import logger from "@/lib/logger";

interface ESIMProfile {
  esimTranNo: string;
  orderNo: string;
  iccid: string;
  msisdn?: string;
  esimStatus: string;
  orderUsage: number;
  totalVolume: number;
  totalDuration?: number;
  durationUnit?: string;
  expiredTime?: string;
  activeType?: number;
  activateTime?: string;
  packageList?: Array<{
    packageName?: string;
    packageCode: string;
    volume: number;
    duration: number;
  }>;
}

interface ProfilesData {
  esimList: ESIMProfile[];
  pageNum?: number;
  pageSize?: number;
  total?: number;
}

const PAGE_SIZE = 10;

export default function ESIMsPage() {
  const [esims, setESIMs] = useState<ESIMProfile[]>([]);
  const [filtered, setFiltered] = useState<ESIMProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<BackendApiResponse<ProfilesData>>("/esims/dashboard/profiles");
        const profilesData: ProfilesData = (res?.data as any)?.data || res?.data || {};
        const esimList = profilesData?.esimList || [];
        setESIMs(Array.isArray(esimList) ? esimList : []);
      } catch (error) {
        logger.error("Failed to fetch eSIM profiles:", error);
        setError("Failed to fetch eSIM profiles from eSIM Access API");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    setFiltered(
      esims.filter(
        (e) =>
          e.iccid?.includes(search) ||
          e.esimTranNo?.includes(search) ||
          e.msisdn?.includes(search),
      ),
    );
    setCurrentPage(1);
  }, [esims, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedESIMs = filtered.slice(startIndex, endIndex);

  const handleExport = () => {
    const csv = [
      ["eSIM Tran No", "Order No", "ICCID", "MSISDN", "Status", "Usage", "Total Volume", "Expires", "Packages"],
      ...filtered.map((e) => [
        e.esimTranNo,
        e.orderNo,
        e.iccid,
        e.msisdn || "N/A",
        e.esimStatus,
        `${e.orderUsage}/${e.totalVolume}`,
        `${e.totalVolume} bytes`,
        e.expiredTime ? new Date(e.expiredTime).toLocaleDateString() : "N/A",
        e.packageList?.map((p) => p.packageCode).join(",") || "N/A",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    exportCSV(csv, `esim-profiles-${Date.now()}.csv`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">eSIM Profiles</h1>
          <p className="mt-1 text-secondary-600">View all eSIM profiles from eSIM Access API</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-800"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-4">
          <p className="text-error-700">{error}</p>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary-400" />
        <input
          type="text"
          placeholder="Search by ICCID, eSIM Tran No, or MSISDN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 py-2 pr-4 pl-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <p className="mb-2 text-sm text-secondary-600">Total eSIMs</p>
          <p className="text-3xl font-bold text-secondary-900">{esims.length}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <p className="mb-2 text-sm text-secondary-600">Active</p>
          <p className="text-3xl font-bold text-primary-700">
            {esims.filter((e) => e.esimStatus?.toUpperCase().includes("ACTIVE")).length}
          </p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <p className="mb-2 text-sm text-secondary-600">Data Usage</p>
          <p className="text-3xl font-bold text-primary-700">
            {(esims.reduce((sum, e) => sum + (e.orderUsage || 0), 0) / (1024 * 1024 * 1024)).toFixed(2)} GB
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-lg p-6">
                <div className="mb-2 h-4 w-1/2 animate-pulse rounded bg-neutral-200" />
                <div className="h-8 w-3/4 animate-pulse rounded bg-neutral-200" />
              </div>
            ))}
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
            <div className="p-6">
              <CardSkeleton count={10} />
            </div>
          </div>
        </div>
      ) : esims.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
          <p className="text-secondary-600">No eSIM profiles found</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">
                  eSIM Tran No
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">
                  ICCID
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">
                  Packages
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {paginatedESIMs.map((esim) => (
                <tr key={esim.esimTranNo} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 text-sm font-mono text-secondary-600">
                    {esim.esimTranNo}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-secondary-600">
                    {esim.iccid}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${esim.esimStatus?.toUpperCase().includes("ACTIVE")
                          ? "bg-success-100 text-success-800"
                          : esim.esimStatus?.toUpperCase().includes("INACTIVE")
                            ? "bg-neutral-100 text-secondary-700"
                            : "bg-error-100 text-error-800"
                        }`}
                    >
                      {esim.esimStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary-600">
                    {(esim.orderUsage / (1024 * 1024 * 1024)).toFixed(2)} /{" "}
                    {(esim.totalVolume / (1024 * 1024 * 1024)).toFixed(2)} GB
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary-600">
                    {esim.expiredTime
                      ? new Date(esim.expiredTime).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary-600">
                    {esim.packageList?.map((p) => p.packageCode).join(", ") || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-6 py-4">
            <div className="text-sm text-secondary-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filtered.length)} of {filtered.length} eSIMs
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
