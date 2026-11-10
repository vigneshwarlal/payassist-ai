import React, { useState, useEffect } from 'react';
import { PieChart, ArrowRight, Tag, Layers, ArrowUpRight } from 'lucide-react';
import { fetchCategories } from '../../utils/api.js';

const DEFAULT_CATEGORIES = [
  { name: 'SaaS Subscriptions', share: 45, value: 57802, count: 643 },
  { name: 'Consulting Services', share: 25, value: 32112, count: 184 },
  { name: 'Hardware & Kits', share: 18, value: 23121, count: 320 },
  { name: 'Enterprise Licenses', share: 12, value: 15415, count: 282 },
];

export default function CategoryBreakdown() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchCategories();
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      } catch (err) {
        console.warn('Failed to load category breakdown', err);
      }
    }
    load();
  }, []);

  const colorMap = [
    { bar: 'bg-blue-600', dot: 'bg-blue-500' },
    { bar: 'bg-sky-500', dot: 'bg-sky-400' },
    { bar: 'bg-indigo-500', dot: 'bg-indigo-400' },
    { bar: 'bg-amber-500', dot: 'bg-amber-400' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_6px_16px_-4px_rgba(15,23,42,0.04)] p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Category Breakdown</h3>
              <p className="text-xs text-slate-400 font-medium">Volume distribution by channel</p>
            </div>
          </div>
        </div>

        {/* Categories list */}
        {isLoading ? (
          <div className="space-y-4 animate-pulse mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-2 bg-slate-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {categories.map((cat, idx) => {
              const style = colorMap[idx % colorMap.length];
              return (
                <div key={cat.name} className="group">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                    <span className="flex items-center gap-1.5 truncate max-w-[170px]">
                      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-normal">{cat.count} orders</span>
                      <span className="font-bold text-slate-900 font-mono">${cat.value?.toLocaleString()}</span>
                      <span className="text-xs font-mono text-slate-500 w-8 text-right font-semibold">
                        {cat.share}%
                      </span>
                    </div>
                  </div>

                  {/* Progress track */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${style.bar} rounded-full transition-all duration-500 group-hover:opacity-90`}
                      style={{ width: `${cat.share}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info Box */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="p-3 bg-gradient-to-r from-blue-50/80 to-sky-50/80 rounded-xl border border-blue-100/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-700" />
            <span className="text-xs font-medium text-slate-700">Top Revenue Driver</span>
          </div>
          <span className="text-xs font-bold text-blue-700">SaaS Subscriptions</span>
        </div>
      </div>
    </div>
  );
}
