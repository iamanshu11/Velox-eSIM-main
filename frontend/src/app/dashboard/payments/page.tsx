'use client';

import { EmptyState } from '@/components/Dashboard/Empty/EmptyState';
import { Pagination } from '@/components/Dashboard/Pagination/Pagination';
import { SkeletonCard, SkeletonTable } from '@/components/Dashboard/Skeleton';
import { usePagination } from '@/hooks/usePagination';
import logger from '@/lib/logger';
import { invoiceService } from '@/services/invoiceService';
import { paymentService } from '@/services/paymentService';
import { Payment } from '@/types';
import { CreditCard, Download } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const filterStatus = 'ALL';
  const filterMethod = 'ALL';
  const searchTerm = '';
  
  const sortBy: 'date' | 'amount' = 'date';
  const sortOrder: 'asc' | 'desc' = 'desc';

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await paymentService.getUserPayments();
        setPayments(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, []);

  const filteredPayments = payments
    .filter((payment) => {
      const matchesStatus = filterStatus === 'ALL' || payment.status === filterStatus;
      const matchesMethod = filterMethod === 'ALL' || payment.method === filterMethod;
      const matchesSearch =
        payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.amount.toString().includes(searchTerm);
      return matchesStatus && matchesMethod && matchesSearch;
    })
    .sort((a, b) => {
      let compareValue = 0;
      if (sortBy === 'date') {
        compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'amount') {
        compareValue = a.amount - b.amount;
      }
      return sortOrder === 'desc' ? -compareValue : compareValue;
    });
  const { page, totalPages, paginatedData, setPage, hasNextPage, hasPrevPage } =
    usePagination(filteredPayments, 10);

  const getPaymentMethod = (method: Payment['method']) => {
    const methods = {
      CREDIT_CARD: 'Credit Card',
      DEBIT_CARD: 'Debit Card',
      PAYPAL: 'PayPal',
      STRIPE: 'Stripe',
      BANK_TRANSFER: 'Bank Transfer',
    } as const;
    return methods[method] || method;
  };

  const getStatusColor = (status: Payment['status']) => {
    const colors = {
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      REFUNDED: 'bg-orange-100 text-orange-800',
    } as const;
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleDownloadInvoice = async (payment: Payment) => {
    try {
      const blob = await invoiceService.downloadInvoiceByPayment(payment.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${payment.invoice?.invoiceNumber || payment.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Failed to download invoice', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-gray-950">Payment History</h1>
        <p className="text-gray-600 mt-2">View and manage all your payment transactions</p>
      </div>

      {/* Loading State */}
      {loading && !error && (
        <div className="space-y-6">
          <SkeletonCard count={3} />
          <SkeletonTable rows={5} columns={7} />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-700 font-medium">Error: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Payments Table */}
          {paginatedData.length > 0 && (
            <>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="border-b border-gray-200 px-8 py-6 bg-gray-50">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Recent Transactions ({filteredPayments.length})
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-600">
                          Payment ID
                        </th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-600">
                          Order ID
                        </th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-600">
                          Invoice
                        </th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-600">
                          Method
                        </th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-600">
                          Date
                        </th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-600">
                          Amount
                        </th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-600">
                          Status
                        </th>
                        <th className="px-8 py-4 text-center text-sm font-semibold text-gray-600">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedData.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-4">
                            <span className="font-mono text-sm font-semibold text-gray-900">
                              {payment.id}
                            </span>
                          </td>
                          <td className="px-8 py-4">
                            <span className="font-mono text-sm text-gray-600">{payment.orderId || '-'}</span>
                          </td>
                          <td className="px-8 py-4">
                            <span className="font-mono text-sm text-gray-600">{payment.invoice?.invoiceNumber || 'N/A'}</span>
                          </td>
                          <td className="px-8 py-4 text-gray-600">
                            <div>
                              <p>{getPaymentMethod(payment.method)}</p>
                              {payment.cardLast4 && (
                                <p className="text-sm text-gray-500">...{payment.cardLast4}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-4 text-gray-600">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-8 py-4">
                            <p className="font-semibold text-gray-900">${payment.amount.toFixed(2)}</p>
                          </td>
                          <td className="px-8 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                payment.status
                              )}`}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-center">
                            <button
                              onClick={() => handleDownloadInvoice(payment)}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 hover:text-primary-800 rounded-lg transition-colors font-medium text-sm"
                              title="Download Invoice"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <Pagination
                page={page}
                totalPages={totalPages}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                onPageChange={setPage}
              />
            </>
          )}

          {/* No Results After Filtering */}
          {payments.length > 0 && filteredPayments.length === 0 && (
            <EmptyState
              icon={CreditCard}
              title="No Payments Match Your Filters"
              description="Try adjusting your search criteria"
              variant="warning"
            />
          )}

          {/* Empty State - No Data Yet */}
          {payments.length === 0 && (
            <EmptyState
              icon={CreditCard}
              title="No Payments Yet"
              description="You haven't made any payments yet. Start your first eSIM purchase to see your payment history here."
              action={{ label: 'Browse Plans', href: '/plans' }}
              variant="info"
            />
          )}
        </>
      )}
    </div>
  );
}

