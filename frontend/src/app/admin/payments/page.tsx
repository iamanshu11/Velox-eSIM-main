"use client";

import { apiClient } from "@/lib/apiClient";
import { BackendApiResponse } from "@/types/api";
import { exportCSV } from "@/lib/exportHelper";
import { Download, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { invoiceService } from "@/services/invoiceService";
import logger from "@/lib/logger";

interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId?: string;
  amount: number;
  status: string;
  description: string;
  issuedAt: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filtered, setFiltered] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await apiClient.get<BackendApiResponse<{ invoices: Invoice[] }>>("/admin/invoices?limit=100");
        const data = (typeof res?.data === 'object' && 'invoices' in res.data)
          ? (res.data as any).invoices
          : (Array.isArray(res?.data) ? res.data : []);
        setInvoices(Array.isArray(data) ? data : []);
      } catch (error) {
        logger.error("Failed to fetch invoices:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  useEffect(() => {
    setFiltered(
      invoices.filter(
        (invoice) =>
          invoice.id.includes(search) ||
          (invoice.orderId || '').includes(search) ||
          invoice.invoiceNumber.includes(search),
      ),
    );
  }, [invoices, search]);

  const handleExport = () => {
    const csv = [
      ["Invoice", "Order ID", "Amount", "Status", "Description", "Date"],
      ...filtered.map((invoice) => [
        invoice.invoiceNumber,
        invoice.orderId || "N/A",
        (invoice.amount / 100).toFixed(2),
        invoice.status,
        invoice.description,
        new Date(invoice.issuedAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    exportCSV(csv, `invoices-${Date.now()}.csv`);
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      setDownloadingId(invoice.id);
      const blob = await invoiceService.downloadAdminInvoice(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Failed to download invoice:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Invoice history for completed payments</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search invoices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-2">Total Invoices</p>
          <p className="text-3xl font-bold text-gray-900">{invoices.length}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-2">Total Amount</p>
          <p className="text-3xl font-bold text-gray-900">
            ${(invoices.reduce((sum, invoice) => sum + invoice.amount, 0) / 100).toFixed(0)}
          </p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-2">Issued</p>
          <p className="text-3xl font-bold text-green-600">
            {
              invoices.filter((invoice) =>
                invoice.status?.toLowerCase().includes("issued"),
              ).length
            }
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : filtered.length > 0 ? (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Date
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filtered.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">
                    {invoice.orderId || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    ${(invoice.amount / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${invoice.status?.toLowerCase().includes('issued')
                          ? 'bg-green-100 text-green-800'
                          : invoice.status?.toLowerCase().includes('pending')
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {invoice.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(invoice.issuedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDownloadInvoice(invoice)}
                      disabled={downloadingId === invoice.id}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                      title="Download Invoice"
                    >
                      <Download className="w-4 h-4" />
                      {downloadingId === invoice.id ? 'Downloading' : 'Download'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
          <p className="text-gray-600 text-lg font-medium">No invoices found</p>
          <p className="text-gray-500 mt-2">Invoices will appear here once available</p>
        </div>
      )}
    </div>
  );
}
