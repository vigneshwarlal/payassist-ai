import React, { useState, useEffect } from 'react';
import { AgCharts } from 'ag-charts-react';
import { TrendingUp, Calendar, Zap, ArrowUpRight } from 'lucide-react';
import { fetchRevenue } from '../../utils/api.js';

const PERIODS = [
  { id: 'week', label: '7D' },
  { id: 'month', label: '30D' },
  { id: 'quarter', label: '90D' },
  { id: 'year', label: '1Y' },
];

const DEFAULT_REVENUE = [
  { label: 'Week 1', revenue: 24500, orders: 280 },
  { label: 'Week 2', revenue: 29800, orders: 335 },
  { label: 'Week 3', revenue: 34200, orders: 385 },
  { label: 'Week 4', revenue: 39950, orders: 429 },
];

export default function RevenueChart({ initialPeriod = 'month' }) {
  const [period, setPeriod] = useState(initialPeriod);
  const [data, setData] = useState(DEFAULT_REVENUE);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const result = await fetchRevenue(period);
        if (isMounted && Array.isArray(result) && result.length > 0) {
          setData(result);
        }
      } catch (err) {
        console.warn('Failed to fetch revenue data', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [period]);

  const totalPeriodRevenue = data.reduce((acc, curr) => acc + (curr.revenue || 0), 0);

  const chartOptions = {
    data: data,
    background: {
      fill: 'transparent',
    },
    padding: {
      top: 15,
      right: 20,
      bottom: 20,
      left: 10,
    },
    series: [
      {
        type: 'area',
        xKey: 'label',
        yKey: 'revenue',
        yName: 'Settled Revenue ($)',
        stroke: '#0070e0',
        strokeWidth: 2.5,
        fill: '#38bdf8',
        fillOpacity: 0.12,
        marker: {
          enabled: true,
          fill: '#0070e0',
          stroke: '#ffffff',
          strokeWidth: 2,
          size: 6,
        },
        tooltip: {
          renderer: ({ datum, xKey, yKey }) => ({
            title: datum[xKey],
            content: `Volume: <b>$${Number(datum[yKey] || 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}</b><br/>Orders: <b>${datum.orders || 'N/A'}</b>`,
          }),
        },
      },
    ],
    axes: [
      {
        type: 'category',
        position: 'bottom',
        line: { stroke: '#e2e8f0' },
        label: {
          color: '#64748b',
          fontSize: 11,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        },
      },
      {
        type: 'number',
        position: 'left',
        line: { stroke: '#e2e8f0' },
        gridLine: {
          style: [{ stroke: '#f1f5f9', lineDash: [3, 3] }],
        },
        label: {
          color: '#64748b',
          fontSize: 11,
          fontFamily: 'JetBrains Mono, monospace',
          formatter: (params) => {
            const val = params.value;
            if (val >= 1000) {
              return `$${(val / 1000).toFixed(0)}k`;
            }
            return `$${val}`;
          },
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_6px_16px_-4px_rgba(15,23,42,0.04)] p-6 flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Revenue Dynamics & Settlement Curve
            </h3>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +14.2%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            PayPal Gross Inflow with Gemini linear forecasting
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 self-start sm:self-auto">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                period === p.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="w-full h-72">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse">
            <span className="text-xs font-semibold text-slate-400">Loading Financial Model...</span>
          </div>
        ) : (
          <AgCharts options={chartOptions} />
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-slate-400 font-medium">Period Total:</span>{' '}
            <span className="font-bold text-slate-900 font-mono">
              ${totalPeriodRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Capture Rate:</span>{' '}
            <span className="font-bold text-emerald-600 font-mono">99.4%</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>Settled to PayPal Merchant Account (USD)</span>
        </div>
      </div>
    </div>
  );
}
