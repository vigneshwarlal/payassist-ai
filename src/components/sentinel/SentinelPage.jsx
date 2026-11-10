import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Activity,
  AlertOctagon,
  RefreshCw,
  Play,
  Pause,
  Sliders,
  DollarSign,
  TrendingDown,
  Info,
  CheckCircle2,
  Lock,
  ArrowRight,
  Radio,
  Sparkles,
  Bot
} from 'lucide-react';
import { fetchSentinelStream, simulateSentinelTransaction } from '../../utils/api.js';

export default function SentinelPage() {
  const [events, setEvents] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const gridRef = useRef(null);

  const loadData = async () => {
    const data = await fetchSentinelStream();
    setEvents(data);
    if (data.length > 0 && !selectedEvent) {
      setSelectedEvent(data[0]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Streaming timer simulation
  useEffect(() => {
    let timer;
    if (isStreaming) {
      timer = setInterval(async () => {
        const newEvt = await simulateSentinelTransaction();
        if (newEvt) {
          setEvents((prev) => [newEvt, ...prev.slice(0, 39)]);
        }
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [isStreaming]);

  const handleInject = async (type) => {
    setIsInjecting(true);
    let payload = {};
    if (type === 'bot_attack') {
      payload = {
        amount: 0.85,
        customer_name: 'Suspicious Botnet #91',
        customer_email: 'cardtest_91@throwaway.email',
        category: 'Micro-Check',
        description: 'Rapid Card Velocity Test'
      };
    } else if (type === 'whale_anomaly') {
      payload = {
        amount: 9850.00,
        customer_name: 'Offshore First-time Buyer',
        customer_email: 'anonymous_offshore@tempmail.com',
        category: 'Enterprise Consulting',
        description: 'Large Unverified Escrow Advance'
      };
    } else {
      payload = {
        amount: 1450.00,
        customer_name: 'Sarah Jenkins',
        customer_email: 'sarah.jenkins@techcorp.io',
        category: 'Development',
        description: 'Verified Retainer Milestone'
      };
    }

    const res = await simulateSentinelTransaction(payload);
    if (res) {
      setEvents((prev) => [res, ...prev]);
      setSelectedEvent(res);
    }
    setIsInjecting(false);
  };

  // AG Grid Cell Renderers
  const RiskScoreRenderer = (params) => {
    const score = params.value || 0;
    let color = 'bg-emerald-500 text-emerald-700';
    let track = 'bg-emerald-100';

    if (score >= 70) {
      color = 'bg-rose-500 text-rose-700';
      track = 'bg-rose-100';
    } else if (score >= 35) {
      color = 'bg-amber-500 text-amber-700';
      track = 'bg-amber-100';
    }

    return (
      <div className="flex items-center gap-2 h-full">
        <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full ${color.split(' ')[0]} rounded-full`}
            style={{ width: `${Math.min(100, score)}%` }}
          />
        </div>
        <span className="font-mono text-xs font-bold text-slate-800">
          {score}
        </span>
      </div>
    );
  };

  const DecisionRenderer = (params) => {
    const decision = params.value || 'Approve';
    let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    let Icon = CheckCircle2;

    if (decision === 'Escrow Hold' || decision === 'Hold') {
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
      Icon = AlertOctagon;
    } else if (decision === 'Review') {
      badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
      Icon = Sliders;
    }

    return (
      <div className="flex items-center h-full">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClass}`}>
          <Icon className="w-3 h-3 shrink-0" />
          <span>{decision}</span>
        </span>
      </div>
    );
  };

  const AmountRenderer = (params) => {
    const amount = Number(params.value || 0);
    return (
      <div className="flex items-center justify-end h-full font-mono font-bold text-xs">
        ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    );
  };

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Event ID',
        field: 'id',
        minWidth: 130,
        cellRenderer: (params) => (
          <span className="font-mono text-xs text-slate-400 font-medium">
            {params.value}
          </span>
        ),
      },
      {
        headerName: 'Buyer / Counterparty',
        field: 'customer_name',
        minWidth: 190,
        flex: 1.4,
        cellRenderer: (params) => (
          <div className="flex flex-col justify-center h-full leading-tight">
            <span className="font-bold text-slate-900 text-xs truncate">
              {params.value}
            </span>
            <span className="text-[11px] text-slate-400 truncate font-mono">
              {params.data?.customer_email}
            </span>
          </div>
        ),
      },
      {
        headerName: 'Amount',
        field: 'amount',
        minWidth: 120,
        headerClass: 'ag-right-aligned-header',
        cellRenderer: AmountRenderer,
      },
      {
        headerName: 'Risk Index',
        field: 'riskScore',
        minWidth: 140,
        flex: 1.2,
        cellRenderer: RiskScoreRenderer,
        sort: 'desc',
      },
      {
        headerName: 'Autonomous Action',
        field: 'decision',
        minWidth: 160,
        flex: 1.4,
        cellRenderer: DecisionRenderer,
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

  // Aggregated Telemetry
  const highRiskCount = events.filter((e) => e.riskScore >= 70).length;
  const avgRisk = events.length > 0 ? Math.round(events.reduce((acc, c) => acc + c.riskScore, 0) / events.length) : 0;
  const protectedVolume = events
    .filter((e) => e.riskScore < 70)
    .reduce((acc, c) => acc + (c.amount || 0), 0);

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Sentinel AI</h1>
                <span className="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Escrow Shield
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Autonomous fraud defense, risk scoring, and intelligent PayPal escrow protector
              </p>
            </div>
          </div>
        </div>

        {/* Live Stream Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsStreaming(!isStreaming)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer ${
              isStreaming
                ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
            }`}
          >
            {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isStreaming ? 'Pause Stream' : 'Live Stream'}</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            title="Refresh stream"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors bg-white shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row 1: Attack Simulator Toolbar */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-[#0b132b] to-[#001c64] text-white rounded-2xl shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-sky-400 shrink-0">
              <Zap className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Live Threat Injection Sandbox</span>
                <span className="text-[10px] bg-[#ffc439] text-slate-900 font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Judge Demo Tool
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Trigger real synthetic anomalies to watch Sentinel AI calculate Bayesian risk & pause PayPal funds autonomously.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={isInjecting}
              onClick={() => handleInject('bot_attack')}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              <span>Simulate Bot Attack ($0.85)</span>
            </button>

            <button
              type="button"
              disabled={isInjecting}
              onClick={() => handleInject('whale_anomaly')}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Offshore Whale ($9,850)</span>
            </button>

            <button
              type="button"
              disabled={isInjecting}
              onClick={() => handleInject('normal')}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Retainer ($1,450)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_6px_16px_-4px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Threat Radar</span>
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
            {events.length} Events
          </div>
          <span className="text-xs text-slate-400 font-medium">Streaming live telemetry</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_6px_16px_-4px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between text-xs text-rose-500 font-semibold uppercase">
            <span>Escrow Holds Triggered</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-2 font-mono">
            {highRiskCount} Interceptions
          </div>
          <span className="text-xs text-rose-500 font-medium">Auto-paused before settlement</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_6px_16px_-4px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between text-xs text-blue-500 font-semibold uppercase">
            <span>Protected Volume</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
            ${protectedVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-emerald-600 font-medium">100% verified settlement</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_6px_16px_-4px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Average Anomaly Index</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
            {avgRisk} / 100
          </div>
          <span className="text-xs text-emerald-600 font-medium">Optimal platform stability</span>
        </div>
      </div>

      {/* Row 3: AG Grid Stream + Deep Neural Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Stream Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_6px_16px_-4px_rgba(15,23,42,0.04)] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Live Transaction Stream
              </h3>
              <p className="text-xs text-slate-400">Click any row to inspect deep neural risk indicators</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Auto-refreshing buffer (Max 40)
            </span>
          </div>

          <div className="ag-theme-alpine w-full h-[460px] rounded-xl overflow-hidden border border-slate-200">
            <AgGridReact
              ref={gridRef}
              rowData={events}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onRowClicked={(e) => setSelectedEvent(e.data)}
              rowSelection="single"
              animateRows={true}
              headerHeight={44}
              rowHeight={50}
            />
          </div>
        </div>

        {/* Neural Decision Inspector Panel */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_6px_16px_-4px_rgba(15,23,42,0.04)] p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Decision Neural Inspector</h3>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono font-bold">
              Gemini 2.0
            </span>
          </div>

          {selectedEvent ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Event Identifier</span>
                  <span className="font-mono text-xs font-bold text-slate-800">{selectedEvent.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Customer</span>
                  <span className="text-xs font-bold text-slate-900">{selectedEvent.customer_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Amount</span>
                  <span className="font-mono text-xs font-extrabold text-slate-900">
                    ${Number(selectedEvent.amount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Risk Gauge */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Calculated Risk Index</span>
                  <span className={`font-mono font-extrabold text-sm ${
                    selectedEvent.riskScore >= 70
                      ? 'text-rose-600'
                      : selectedEvent.riskScore >= 35
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}>
                    {selectedEvent.riskScore} / 100
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      selectedEvent.riskScore >= 70
                        ? 'bg-rose-500'
                        : selectedEvent.riskScore >= 35
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${selectedEvent.riskScore}%` }}
                  />
                </div>
              </div>

              {/* Decision Explanation */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Autonomous Action Explanation
                </span>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                  {selectedEvent.reason || 'Telemetry parameters match normal historical patterns. Immediate PayPal settlement executed.'}
                </p>
              </div>

              {/* Simulated PayPal Action */}
              <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/50 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>PayPal Rails Enforcement:</span>
                </div>
                <p className="text-[11px] text-blue-800">
                  {selectedEvent.riskScore >= 70
                    ? 'Orders API v2 authorization blocked. Merchant escrow hold flag dispatched.'
                    : 'Instant capture authorized. Webhook telemetry broadcast to merchant.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              Select an event from the table to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
