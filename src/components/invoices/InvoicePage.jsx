import React, { useState, useEffect } from 'react';
import {
  Plus,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Send,
  DollarSign,
  Calendar,
  Sparkles,
} from 'lucide-react';
import InvoiceGrid from './InvoiceGrid.jsx';
import { fetchInvoices, createInvoice, sendInvoice } from '../../utils/api.js';

export default function InvoicePage() {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    customer: '',
    email: '',
    amount: '',
    description: '',
    dueDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const data = await fetchInvoices();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading invoices', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!formData.customer || !formData.email || !formData.amount) return;

    setIsSubmitting(true);
    try {
      await createInvoice({
        customer: formData.customer,
        email: formData.email,
        amount: parseFloat(formData.amount),
        description: formData.description || 'Commerce Services',
        dueDate: formData.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        status: 'Draft',
      });

      showToast(`Invoice for ${formData.customer} created successfully!`);
      setIsModalOpen(false);
      setFormData({
        customer: '',
        email: '',
        amount: '',
        description: '',
        dueDate: '',
      });
      await loadInvoices();
    } catch (err) {
      alert('Failed to create invoice: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInvoice = async (id) => {
    try {
      await sendInvoice(id);
      showToast(`Invoice ${id} has been delivered to customer via email.`);
      await loadInvoices();
    } catch (err) {
      alert('Failed to send invoice: ' + err.message);
    }
  };

  // Metrics summary
  const totalInvoiced = invoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  const paidInvoices = invoices.filter((i) => i.status?.toLowerCase() === 'paid');
  const paidTotal = paidInvoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  const sentInvoices = invoices.filter((i) => i.status?.toLowerCase() === 'sent');
  const sentTotal = sentInvoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  const overdueInvoices = invoices.filter((i) => i.status?.toLowerCase() === 'overdue');
  const overdueTotal = overdueInvoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-chat-slide-up bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Invoices
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate, automate, and track merchant billing via PayPal Invoicing APIs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-[#003087] hover:bg-[#001c64] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-blue-900/15 hover:shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Invoiced
          </span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">
            ${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">{invoices.length} total issued</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
            Collected (Paid)
          </span>
          <div className="text-xl font-bold text-emerald-700 mt-0.5">
            ${paidTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-emerald-600 font-medium">{paidInvoices.length} paid invoices</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#003087]">
            Pending / Sent
          </span>
          <div className="text-xl font-bold text-[#003087] mt-0.5">
            ${sentTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">{sentInvoices.length} awaiting payment</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
            Overdue
          </span>
          <div className="text-xl font-bold text-rose-700 mt-0.5">
            ${overdueTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-rose-600 font-medium">{overdueInvoices.length} requires attention</span>
        </div>
      </div>

      {/* Invoice AG Grid */}
      <InvoiceGrid
        invoices={invoices}
        onSendInvoice={handleSendInvoice}
        onViewInvoice={(inv) => setViewingInvoice(inv)}
        isLoading={isLoading}
      />

      {/* Modal: Create Invoice */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-chat-slide-up">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-[#003087] rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">New PayPal Invoice</h3>
                  <p className="text-xs text-slate-500">Fast digital invoicing with instant payment link</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Customer / Business Name *
                </label>
                <input
                  type="text"
                  name="customer"
                  required
                  placeholder="e.g. Acme Corporation"
                  value={formData.customer}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#003087] focus:ring-1 focus:ring-blue-100 text-sm rounded-xl px-3.5 py-2.5 outline-none transition-all text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Customer Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="billing@acmecorp.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#003087] focus:ring-1 focus:ring-blue-100 text-sm rounded-xl px-3.5 py-2.5 outline-none transition-all text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Amount (USD) *
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      name="amount"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#003087] focus:ring-1 focus:ring-blue-100 text-sm rounded-xl pl-9 pr-3.5 py-2.5 outline-none transition-all text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#003087] focus:ring-1 focus:ring-blue-100 text-sm rounded-xl px-3.5 py-2.5 outline-none transition-all text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Item Description
                </label>
                <textarea
                  name="description"
                  rows="3"
                  placeholder="Detail services rendered, milestone deliverables, or software licenses..."
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#003087] focus:ring-1 focus:ring-blue-100 text-sm rounded-xl px-3.5 py-2.5 outline-none transition-all text-slate-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 bg-[#003087] hover:bg-[#001c64] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-blue-900/15 transition-all"
                >
                  {isSubmitting ? (
                    <span>Generating...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Save as Draft</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Invoice Details */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-chat-slide-up">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-[11px] font-mono text-slate-400">{viewingInvoice.id}</span>
                <h3 className="font-bold text-slate-900 text-base">Invoice Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Recipient</span>
                <span className="text-xs font-bold text-slate-900">{viewingInvoice.customer}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Email</span>
                <span className="text-xs text-slate-700 font-mono">{viewingInvoice.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Status</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#003087] border border-blue-200">
                  {viewingInvoice.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Due Date</span>
                <span className="text-xs text-slate-700">{viewingInvoice.dueDate}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-medium text-slate-400 block mb-1">Description</span>
                <p className="text-xs text-slate-800">{viewingInvoice.description}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">Total Due</span>
                <span className="text-xl font-bold font-mono text-slate-900">
                  ${Number(viewingInvoice.amount).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
