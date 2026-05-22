"use client";

import { apiClient } from "@/lib/apiClient";
import { BackendApiResponse } from "@/types/api";
import { exportCSV } from "@/lib/exportHelper";
import { AlertCircle, Download, Search, X, Send, Calendar, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { supportService } from "@/services/supportService";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  userEmail: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface TicketDetail extends Ticket {
  userId: string;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filtered, setFiltered] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

  const loadTickets = async () => {
    try {
      setError("");
      const res = await apiClient.get<BackendApiResponse<{ tickets: Ticket[] }>>("/support/admin/tickets");
      const data = res.data?.tickets || [];
      setTickets(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(
        err?.message || "Failed to load support tickets. Please try again.",
      );
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    setFiltered(
      tickets.filter(
        (t) =>
          t.id.includes(search) ||
          t.subject.toLowerCase().includes(search.toLowerCase()) ||
          t.userEmail.toLowerCase().includes(search.toLowerCase()),
      ),
    );
  }, [tickets, search]);

  const openTicketDetail = async (ticket: Ticket) => {
    try {
      const detail = await supportService.getTicketById(ticket.id);
      setSelectedTicket(detail as TicketDetail);
      setReplyText("");
      setReplyError("");
    } catch (err) {
      setError("Failed to load ticket details");
    }
  };

  const handleSubmitReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    try {
      setReplyLoading(true);
      setReplyError("");
      await supportService.addCommunication(selectedTicket.id, replyText);
      
      const updated = await supportService.getTicketById(selectedTicket.id);
      setSelectedTicket(updated as TicketDetail);
      setReplyText('');
      
      loadTickets();
    } catch (err: any) {
      setReplyError(err?.message || "Failed to send reply");
    } finally {
      setReplyLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket) return;

    try {
      setStatusUpdating(true);
      const upperStatus = newStatus.toUpperCase();
      await supportService.updateTicketStatus(selectedTicket.id, upperStatus);
      
      setSelectedTicket({ ...selectedTicket, status: upperStatus });
      
      loadTickets();
    } catch (err: any) {
      setReplyError(err?.message || "Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ["ID", "Subject", "From", "Priority", "Status", "Date"],
      ...filtered.map((t) => [
        t.id,
        t.subject,
        t.userEmail,
        t.priority,
        t.status,
        new Date(t.createdAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    exportCSV(csv, `support-tickets-${Date.now()}.csv`);
  };

  const openCount = tickets.filter(
    (t) => t.status?.toUpperCase() === "OPEN",
  ).length;
  const inProgressCount = tickets.filter(
    (t) => t.status?.toUpperCase() === "IN_PROGRESS",
  ).length;
  const resolvedCount = tickets.filter(
    (t) => t.status?.toUpperCase() === "RESOLVED",
  ).length;
  const closedCount = tickets.filter(
    (t) => t.status?.toUpperCase() === "CLOSED",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-1">Customer support management</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              Error Loading Data
            </p>
            <p className="text-xs text-amber-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by ID, subject, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-2">Total Tickets</p>
          <p className="text-3xl font-bold text-gray-900">{tickets.length}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-2">Open</p>
          <p className="text-3xl font-bold text-red-600">{openCount}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-2">In Progress</p>
          <p className="text-3xl font-bold text-amber-600">{inProgressCount}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-2">Resolved</p>
          <p className="text-3xl font-bold text-green-600">{resolvedCount}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-2">Closed</p>
          <p className="text-3xl font-bold text-gray-600">{closedCount}</p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Ticket ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  From
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filtered.length > 0 ? (
                filtered.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => openTicketDetail(ticket)}
                  >
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">
                      {ticket.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {ticket.subject}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {ticket.userEmail}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          ticket.priority?.toUpperCase() === "HIGH"
                            ? "bg-red-100 text-red-800"
                            : ticket.priority?.toUpperCase() === "MEDIUM"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-primary-100 text-primary-900"
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          ticket.status?.toUpperCase() === "RESOLVED"
                            ? "bg-green-100 text-green-800"
                            : ticket.status?.toUpperCase() === "IN_PROGRESS"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    {error
                      ? "Unable to load tickets. Check your connection."
                      : "No tickets found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 border-b border-neutral-200 bg-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedTicket.subject}</h2>
                <p className="text-sm text-gray-600 mt-1">Ticket ID: {selectedTicket.id}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase">From</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedTicket.userEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase">Priority</p>
                  <div className="mt-1">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full inline-block ${
                        selectedTicket.priority?.toUpperCase() === "HIGH"
                          ? "bg-red-100 text-red-800"
                          : selectedTicket.priority?.toUpperCase() === "MEDIUM"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-primary-100 text-primary-900"
                      }`}
                    >
                      {selectedTicket.priority}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase">Status</p>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={statusUpdating}
                    className="mt-1 block w-full px-2 py-1 border border-neutral-200 rounded text-sm font-medium bg-white cursor-pointer disabled:opacity-50"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase">Created</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {new Date(selectedTicket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Thread */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Conversation</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto border border-neutral-200">
                  {selectedTicket.message ? (
                    selectedTicket.message.split("\n---\n").map((msg, idx) => {
                      const isStaff = msg.includes("[Staff]");
                      const cleanMsg = msg.replace(/^\[(?:Staff|User)\]\s+[\dT\-:.Z]+\s*\n?/, '').trim();
                      return (
                        <div key={idx} className={`${isStaff ? "bg-blue-50 border-l-2 border-blue-400" : "bg-white border-l-2 border-gray-300"} p-3 rounded`}>
                          <p className="text-xs text-gray-600 mb-2 font-medium">
                            {isStaff ? "Staff Reply" : "User Message"}
                          </p>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {cleanMsg}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 italic">No messages yet</p>
                  )}
                </div>
              </div>

              {/* Reply Form */}
              {selectedTicket.status?.toLowerCase() !== "closed" && (
                <div className="border-t border-neutral-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Reply</h3>
                  {replyError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 flex gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{replyError}</p>
                    </div>
                  )}
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm resize-none"
                    rows={4}
                    disabled={replyLoading}
                  />
                  <button
                    onClick={handleSubmitReply}
                    disabled={replyLoading || !replyText.trim()}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {replyLoading ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


