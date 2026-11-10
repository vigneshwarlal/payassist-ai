import React, { useState, useEffect } from 'react';
import {
  Users,
  Crown,
  TrendingUp,
  Award,
  X,
  Mail,
  Phone,
  Building,
  Calendar,
  DollarSign,
  FileText,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import CustomerGrid from './CustomerGrid.jsx';
import { fetchCustomers } from '../../utils/api.js';

export default function CustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchCustomers();
        setCustomers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching customers', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const totalCustomers = customers.length;
  const vipCount = customers.filter((c) => c.status === 'VIP').length;
  const totalVolume = customers.reduce((sum, c) => sum + (Number(c.totalSpent) || 0), 0);
  const avgLtv = totalCustomers > 0 ? totalVolume / totalCustomers : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Customers
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Customer lifetime value (LTV), transaction cadence, and VIP relationship telemetry.
          </p>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Clients
            </span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalCustomers}</div>
          <span className="text-xs text-slate-500 font-medium">+12.5% this quarter</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
              VIP Tier Accounts
            </span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-800 mt-1">{vipCount}</div>
          <span className="text-xs text-amber-600 font-medium">Top 20% revenue drivers</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
              Average LTV
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            ${avgLtv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-emerald-600 font-medium">Lifetime gross value</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#003087]">
              Retention Rate
            </span>
            <Award className="w-4 h-4 text-[#003087]" />
          </div>
          <div className="text-xl font-bold text-[#003087] mt-1">94.8%</div>
          <span className="text-xs text-slate-500 font-medium">Repeat purchase index</span>
        </div>
      </div>

      {/* Customer Grid */}
      <CustomerGrid
        customers={customers}
        onCustomerSelect={(cust) => setSelectedCustomer(cust)}
        selectedCustomerId={selectedCustomer?.id}
      />

      {/* Customer Detail Side Panel */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 pointer-events-none flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm pointer-events-auto transition-opacity"
            onClick={() => setSelectedCustomer(null)}
          />

          {/* Drawer */}
          <aside className="relative pointer-events-auto w-full max-w-md h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col z-50 animate-slide-in-right overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#001c64] to-[#009cde] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-900/10">
                  {selectedCustomer.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{selectedCustomer.name}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        selectedCustomer.status === 'VIP'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {selectedCustomer.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedCustomer.company || 'Individual Client'}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Financial Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">Total Spent</span>
                  <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                    ${Number(selectedCustomer.totalSpent || 0).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">Transactions</span>
                  <div className="text-xl font-bold font-mono text-[#003087] mt-1">
                    {selectedCustomer.transactions || 0}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Contact Information
                </h4>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-700">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="font-mono">{selectedCustomer.email}</span>
                  </div>
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-2.5 text-slate-700">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Cadence & Relationship
                </h4>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">First Purchase</span>
                    <span className="font-medium text-slate-800">{selectedCustomer.firstPurchase}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Last Purchase</span>
                    <span className="font-medium text-slate-800">{selectedCustomer.lastPurchase}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedCustomer.notes && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    AI Relationship Notes
                  </h4>
                  <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-slate-700 leading-relaxed">
                    {selectedCustomer.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <a
                href={`mailto:${selectedCustomer.email}`}
                className="flex-1 inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 transition-colors"
              >
                <Mail className="w-4 h-4 text-slate-500" />
                <span>Email Client</span>
              </a>

              <button
                type="button"
                onClick={() => alert(`Invoice draft initiated for ${selectedCustomer.name}`)}
                className="flex-1 inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-3 rounded-xl bg-[#003087] hover:bg-[#001c64] text-white shadow-xs transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>New Invoice</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
