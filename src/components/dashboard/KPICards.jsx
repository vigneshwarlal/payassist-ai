import React from 'react';
import { DollarSign, ArrowUpDown, TrendingUp, Users, ArrowUpRight, ArrowDownRight, ShieldCheck } from 'lucide-react';

export default function KPICards({ kpis, isLoading }) {
  const cards = [
    {
      id: 'revenue',
      label: 'Gross Platform Volume',
      value: kpis?.totalRevenue ? `$${Number(kpis.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$128,450.00',
      change: kpis?.revenueChange ?? 14.2,
      subtext: 'vs prior 30 days',
      icon: DollarSign,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100/80',
      accentColor: 'from-emerald-500/10 to-transparent',
    },
    {
      id: 'transactions',
      label: 'Settled Transactions',
      value: kpis?.transactions ? Number(kpis.transactions).toLocaleString() : '1,429',
      change: kpis?.transactionsChange ?? 8.1,
      subtext: 'autonomous orders',
      icon: ArrowUpDown,
      iconBg: 'bg-blue-50 text-[#003087] border border-blue-100/80',
      accentColor: 'from-blue-500/10 to-transparent',
    },
    {
      id: 'aov',
      label: 'Average Order Value',
      value: kpis?.avgOrderValue ? `$${Number(kpis.avgOrderValue).toFixed(2)}` : '$89.88',
      change: kpis?.avgOrderValueChange ?? 3.4,
      subtext: 'per checkout',
      icon: TrendingUp,
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100/80',
      accentColor: 'from-indigo-500/10 to-transparent',
    },
    {
      id: 'protected',
      label: 'Sentinel AI Protected',
      value: '$24,850.00',
      change: 99.8,
      subtext: '0 escrow chargebacks',
      icon: ShieldCheck,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100/80',
      accentColor: 'from-amber-500/10 to-transparent',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm animate-pulse space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-slate-100 rounded-xl" />
              <div className="w-16 h-6 bg-slate-100 rounded-full" />
            </div>
            <div className="w-24 h-4 bg-slate-100 rounded" />
            <div className="w-32 h-8 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const isPositive = card.change >= 0;

        return (
          <div
            key={card.id}
            className="relative overflow-hidden p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_6px_16px_-4px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_12px_0_rgba(15,23,42,0.05),0_12px_28px_-6px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 transition-all duration-200 group"
          >
            {/* Subtle ambient corner gradient */}
            <div
              className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${card.accentColor} rounded-bl-full pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`}
            />

            <div className="flex items-center justify-between relative z-10 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${card.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Trend Pill */}
              <div
                className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  isPositive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                    : 'bg-rose-50 text-rose-700 border-rose-200/80'
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                <span>{Math.abs(card.change)}%</span>
              </div>
            </div>

            <div className="relative z-10">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {card.label}
              </h4>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                {card.value}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-medium flex items-center gap-1">
                <span>{card.subtext}</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
