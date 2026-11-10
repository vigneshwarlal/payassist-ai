import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Calendar, ArrowUpRight, ShieldCheck, Zap, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import KPICards from './KPICards.jsx';
import RevenueChart from './RevenueChart.jsx';
import CategoryBreakdown from './CategoryBreakdown.jsx';
import TransactionGrid from './TransactionGrid.jsx';
import { fetchKPIs } from '../../utils/api.js';

export default function DashboardPage() {
  const [kpis, setKpis] = useState({
    totalRevenue: 128450.0,
    revenueChange: 14.2,
    transactions: 1429,
    transactionsChange: 8.1,
    avgOrderValue: 89.88,
    avgOrderValueChange: 3.4,
    activeCustomers: 842,
    customersChange: 12.5,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const kpiData = await fetchKPIs();
      if (kpiData) setKpis(kpiData);
      setLastRefreshed(new Date());
    } catch (err) {
      console.warn('Dashboard data refresh', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(lastRefreshed);

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Executive Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Autonomous Agent Active
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time PayPal transaction telemetry, AI escrow risk ratings, and autonomous financial health.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{formattedDate}</span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Invoice</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            title="Refresh dashboard"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <KPICards kpis={kpis} isLoading={isLoading} />

      {/* Row 2: Revenue Chart + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <RevenueChart initialPeriod="month" />
        </div>
        <div className="lg:col-span-4">
          <CategoryBreakdown />
        </div>
      </div>

      {/* Row 3: Transaction AG Grid */}
      <div>
        <TransactionGrid />
      </div>
    </div>
  );
}
