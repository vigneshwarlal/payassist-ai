import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Search, Download, RefreshCw, CheckCircle2, Clock, AlertTriangle, ArrowDownLeft, ShieldAlert, Sparkles } from 'lucide-react';
import { fetchTransactions } from '../../utils/api.js';

const DEFAULT_TRANSACTIONS = [
  { id: 'tx_101', date: '2024-11-08 11:24', customer: 'Sarah Jenkins', email: 'sarah.j@acme.com', description: 'Enterprise AI Suite - Monthly', category: 'SaaS Subscriptions', amount: 299.0, status: 'Completed', riskScore: 12 },
  { id: 'tx_102', date: '2024-11-08 10:15', customer: 'Michael Chang', email: 'mchang@techflow.io', description: 'PayAssist Merchant Starter Kit', category: 'Hardware & Kits', amount: 49.0, status: 'Completed', riskScore: 8 },
  { id: 'tx_103', date: '2024-11-08 09:42', customer: 'Elena Rostova', email: 'elena@novasystems.de', description: 'AI Fraud Shield & Analytics Addon', category: 'SaaS Subscriptions', amount: 99.0, status: 'Completed', riskScore: 15 },
  { id: 'tx_104', date: '2024-11-07 17:30', customer: 'Marcus Vance', email: 'marcus@vancecapital.com', description: 'Custom Workflow Integration Consulting', category: 'Consulting Services', amount: 1500.0, status: 'Completed', riskScore: 22 },
  { id: 'tx_105', date: '2024-11-07 15:10', customer: 'Amira Patel', email: 'amira@solardynamics.org', description: 'Enterprise Licenses (10 seats)', category: 'Enterprise Licenses', amount: 2490.0, status: 'Completed', riskScore: 18 },
  { id: 'tx_106', date: '2024-11-07 13:05', customer: 'David Kim', email: 'dkim@quantumreach.com', description: 'Overdue Balance Partial Settlement', category: 'Consulting Services', amount: 800.0, status: 'Escrow Hold', riskScore: 78 },
];

export default function TransactionGrid() {
  const [rowData, setRowData] = useState(DEFAULT_TRANSACTIONS);
  const [quickFilterText, setQuickFilterText] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const gridRef = useRef(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTransactions();
      if (Array.isArray(data) && data.length > 0) {
        setRowData(data);
      }
    } catch (err) {
      console.warn('Error fetching transactions', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter rows based on active tab
  const filteredData = useMemo(() => {
    if (activeTab === 'all') return rowData;
    if (activeTab === 'completed') return rowData.filter((r) => r.status === 'Completed' || r.status === 'Paid');
    if (activeTab === 'escrow') return rowData.filter((r) => r.status === 'Escrow Hold' || r.riskScore >= 70);
    if (activeTab === 'refunded') return rowData.filter((r) => r.status === 'Refunded');
    return rowData;
  }, [rowData, activeTab]);

  // Customer avatar renderer
  const CustomerRenderer = (params) => {
    const name = params.value || 'Anonymous';
    const email = params.data?.email || '';
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    return (
      <div className="flex items-center gap-2.5 h-full">
        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0">
          {initials || 'C'}
        </div>
        <div className="flex flex-col justify-center leading-tight min-w-0">
          <span className="font-semibold text-slate-900 text-xs truncate">{name}</span>
          {email && <span className="text-[11px] text-slate-400 truncate font-mono">{email}</span>}
        </div>
      </div>
    );
  };

  // Status badge renderer
  const StatusRenderer = (params) => {
    const status = params.value || 'Pending';
    let badgeClass = 'bg-slate-50 text-slate-700 border-slate-200';
    let Icon = Clock;

    if (status === 'Completed' || status === 'Success' || status === 'Paid') {
      badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      Icon = CheckCircle2;
    } else if (status === 'Refunded') {
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
      Icon = ArrowDownLeft;
    } else if (status === 'Escrow Hold') {
      badgeClass = 'bg-amber-50 text-amber-800 border-amber-300';
      Icon = ShieldAlert;
    } else if (status === 'Failed') {
      badgeClass = 'bg-red-50 text-red-700 border-red-200';
      Icon = AlertTriangle;
    }

    return (
      <div className="flex items-center h-full">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClass}`}>
          <Icon className="w-3 h-3 shrink-0" />
          <span>{status}</span>
        </span>
      </div>
    );
  };

  // Amount renderer
  const AmountRenderer = (params) => {
    const amount = Number(params.value || 0);
    const isRefunded = params.data?.status === 'Refunded';

    return (
      <div className="flex items-center justify-end h-full font-mono font-bold text-xs tracking-tight">
        <span className={isRefunded ? 'text-rose-600' : 'text-slate-900'}>
          {isRefunded ? '-' : '+'}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    );
  };

  // Risk & AI Decision tag renderer
  const RiskRenderer = (params) => {
    const score = params.data?.riskScore || Math.floor(Math.random() * 25) + 5;
    let badge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 70) badge = 'bg-rose-50 text-rose-700 border-rose-200';
    else if (score >= 40) badge = 'bg-amber-50 text-amber-700 border-amber-200';

    return (
      <div className="flex items-center gap-1.5 h-full">
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badge}`}>
          Score {score}
        </span>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          {score < 40 ? 'Auto-Cleared' : score < 70 ? 'Manual Review' : 'Escrow Hold'}
        </span>
      </div>
    );
  };

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Transaction ID',
        field: 'id',
        minWidth: 150,
        cellRenderer: (params) => (
          <div className="flex items-center h-full font-mono text-xs text-slate-500 font-medium">
            {params.value}
          </div>
        ),
      },
      {
        headerName: 'Customer',
        field: 'customer',
        minWidth: 220,
        flex: 1.5,
        cellRenderer: CustomerRenderer,
      },
      {
        headerName: 'Status',
        field: 'status',
        minWidth: 140,
        cellRenderer: StatusRenderer,
      },
      {
        headerName: 'Sentinel AI Risk',
        field: 'riskScore',
        minWidth: 180,
        flex: 1.2,
        cellRenderer: RiskRenderer,
      },
      {
        headerName: 'Amount (USD)',
        field: 'amount',
        minWidth: 130,
        headerClass: 'ag-right-aligned-header',
        cellRenderer: AmountRenderer,
      },
      {
        headerName: 'Timestamp',
        field: 'date',
        minWidth: 140,
        cellRenderer: (params) => (
          <div className="flex items-center h-full text-xs text-slate-400 font-medium">
            {params.value ? new Date(params.value).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
          </div>
        ),
      },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    []
  );

  const handleExportCsv = () => {
    if (gridRef.current?.api) {
      gridRef.current.api.exportDataAsCsv({
        fileName: `payassist-transactions-${new Date().toISOString().slice(0, 10)}.csv`,
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_6px_16px_-4px_rgba(15,23,42,0.04)] p-6 space-y-4">
      {/* Top Filter and Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-bold text-slate-900 tracking-tight mr-2">
            Transaction Ledger
          </h3>
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              All ({rowData.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeTab === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Settled
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('escrow')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeTab === 'escrow' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Escrow / Review
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('refunded')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeTab === 'refunded' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Refunds
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ledger..."
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            title="Reload table"
            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* AG Grid Table Container */}
      <div className="ag-theme-alpine w-full h-[440px] rounded-xl overflow-hidden border border-slate-200">
        <AgGridReact
          ref={gridRef}
          rowData={filteredData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          quickFilterText={quickFilterText}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 20, 50]}
          animateRows={true}
          rowSelection="single"
          headerHeight={44}
          rowHeight={48}
        />
      </div>
    </div>
  );
}
