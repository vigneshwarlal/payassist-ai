import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  FileText,
  Users,
  ShoppingCart,
  Zap,
  Sparkles,
  Bot,
  ExternalLink,
  Lock,
  Radio,
  CheckCircle2,
  X
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { path: '/sentinel', label: 'Sentinel AI Shield', icon: ShieldCheck, badge: 'Live AI' },
  { path: '/invoices', label: 'Invoices', icon: FileText, badge: null },
  { path: '/customers', label: 'Customers', icon: Users, badge: null },
  { path: '/checkout', label: 'Smart Checkout', icon: ShoppingCart, badge: 'Agentic' },
];

export default function Sidebar({ isMobileOpen, setIsMobileOpen }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Modern Enterprise Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 z-40 flex flex-col justify-between bg-[#0b1120] text-slate-300 border-r border-slate-800/80 transition-transform duration-300 ease-in-out shrink-0 select-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Brand Section */}
        <div>
          <div className="h-18 flex items-center justify-between px-5 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#001c64] via-[#0070e0] to-[#38bdf8] p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-[#0b1120] rounded-[10px] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-sky-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-base tracking-tight">PayAssist</span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-sky-400 border border-blue-500/30">
                    AI
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Autonomous Commerce</span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-4">
            <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Platform Navigation
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen?.(false)}
                    className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-blue-500/10 text-sky-400 border border-blue-500/20'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Platform Status Card */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Live Telemetry
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
                99.9% Up
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center justify-between">
                <span>PayPal Sandbox</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Gemini 2.0 Flash</span>
                <span className="text-sky-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sentinel Shield</span>
                <span className="text-emerald-400 font-medium">Armed</span>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Environment</span>
              <span className="font-mono text-slate-400">api-m.sandbox</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
