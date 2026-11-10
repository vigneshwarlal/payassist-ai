import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Menu,
  Trophy,
  Play,
  CheckCircle2,
  ChevronRight,
  X,
  ShieldCheck,
  FileText,
  ArrowRight,
  Search,
  Mic,
  Command,
  ExternalLink,
  Zap,
  Activity
} from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import ChatPanel from './chat/ChatPanel.jsx';

const TOUR_STEPS = [
  {
    step: 1,
    title: 'Autonomous Sentinel: Real-Time Fraud & Escrow Shield',
    track: 'Best Use of Agentic Commerce',
    description: 'Watches incoming transaction streams, scores anomalies (0-100), and autonomously pauses suspicious funds in PayPal Escrow before settlement.',
    targetPath: '/sentinel',
    actionText: 'Open Sentinel Shield',
  },
  {
    step: 2,
    title: 'Agentic Checkout & Dynamic Deal Negotiation',
    track: 'Best Use of PayPal + AI',
    description: 'Buyers can haggle with an AI Sales Agent directly in checkout. The AI analyzes margin thresholds and dynamically generates custom PayPal Smart Buttons.',
    targetPath: '/checkout',
    actionText: 'Experience Smart Checkout',
  },
  {
    step: 3,
    title: 'Multimodal Voice & Natural Language Invoicing',
    track: 'Most Creative & Best Demo Delivery',
    description: 'Merchants speak hands-free via speech recognition: "Invoice Acme $1,500 for web design". Gemini 2.0 calls PayPal Invoicing APIs and speaks back.',
    actionText: 'Open Voice Agent',
    isChatTrigger: true,
  },
  {
    step: 4,
    title: 'Enterprise AG Grid & AG Charts Financial Command',
    track: 'Best Use of AG Grid Track',
    description: 'Full-featured AG Grid with real-time quick filter, CSV export, inline action badges, sparkline telemetry, and revenue trend analysis.',
    targetPath: '/',
    actionText: 'Explore Dashboard Grid',
  },
  {
    step: 5,
    title: 'Cloud Orchestration & Zero-Config Deployment',
    track: 'Best Use of Render & APIMatic Tracks',
    description: 'Production-ready render.yaml blueprint and APIMatic OpenAPI context plugin configuration for high-scale multi-agent deployment.',
    targetPath: '/invoices',
    actionText: 'Inspect Invoices Grid',
  },
];

export default function Layout({ children }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Executive Financial Command';
      case '/sentinel':
        return 'Sentinel AI — Autonomous Fraud & Escrow Shield';
      case '/invoices':
        return 'Invoices & Settlements';
      case '/customers':
        return 'Customer Intelligence Directory';
      case '/checkout':
        return 'Smart Checkout & AI Deal Haggler';
      default:
        return 'PayAssist AI';
    }
  };

  const handleTourAction = (stepObj) => {
    if (stepObj.isChatTrigger) {
      setIsTourOpen(false);
      setIsChatOpen(true);
    } else if (stepObj.targetPath) {
      setIsTourOpen(false);
      navigate(stepObj.targetPath);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex antialiased">
      {/* Enterprise Sidebar */}
      <Sidebar isMobileOpen={isMobileNavOpen} setIsMobileOpen={setIsMobileNavOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Executive Hackathon Header Strip */}
        <div className="bg-gradient-to-r from-slate-900 via-[#001c64] to-[#003087] text-white px-5 py-2.5 flex items-center justify-between text-xs shadow-sm border-b border-blue-900/40">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-[#ffc439] text-slate-900 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider shadow-sm">
              <Trophy className="w-3 h-3 text-slate-900" />
              PayPal AI Hackathon 2026
            </span>
            <span className="font-medium text-slate-200 hidden md:inline">
              PayAssist AI: Agentic Commerce & Autonomous Payments Platform
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCurrentTourStep(0);
                setIsTourOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-xs transition-colors border border-white/20 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>60-Sec Judge Tour</span>
            </button>
          </div>
        </div>

        {/* Modern Glass Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* PayPal Sandbox Status Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-600 font-medium">PayPal Sandbox</span>
              <span className="text-[10px] text-slate-400 font-mono">v2</span>
            </div>

            {/* AI Copilot Launch Button */}
            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#003087] to-[#0070e0] text-white text-xs font-semibold shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30 transition-all cursor-pointer"
            >
              <Bot className="w-4 h-4 text-sky-200" />
              <span>AI Copilot</span>
              <span className="hidden md:inline text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">
                ⌘K
              </span>
            </button>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>

        {/* Floating Voice/AI Copilot Quick Trigger */}
        {!isChatOpen && (
          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-6 right-6 z-40 group flex items-center gap-3 bg-gradient-to-r from-[#001c64] via-[#003087] to-[#0070e0] text-white pl-4 pr-5 py-3 rounded-full shadow-xl shadow-blue-900/25 hover:shadow-2xl hover:shadow-blue-900/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <div className="relative">
              <span className="absolute -inset-1 rounded-full bg-sky-400/30 animate-ping"></span>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-sky-200" />
              </div>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold leading-tight">PayAssist AI</span>
              <span className="text-[10px] text-sky-200 font-medium flex items-center gap-1">
                <Mic className="w-2.5 h-2.5" /> Voice & Tool Copilot
              </span>
            </div>
          </button>
        )}

        {/* AI Chat Drawer */}
        <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

        {/* 60-Sec Judge Interactive Tour Modal */}
        {isTourOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-900 via-[#001c64] to-[#003087] text-white p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-[#ffc439] text-slate-900 font-extrabold text-[10px] uppercase">
                      Tour Step {currentTourStep + 1} of {TOUR_STEPS.length}
                    </span>
                    <span className="text-xs text-sky-200 font-medium">
                      {TOUR_STEPS[currentTourStep].track}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTourOpen(false)}
                    className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {TOUR_STEPS[currentTourStep].title}
                </h3>
              </div>

              <div className="p-6 space-y-5">
                <p className="text-slate-600 text-sm leading-relaxed">
                  {TOUR_STEPS[currentTourStep].description}
                </p>

                {/* Progress Indicators */}
                <div className="flex items-center justify-between gap-1 pt-2">
                  {TOUR_STEPS.map((s, idx) => (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setCurrentTourStep(idx)}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        idx === currentTourStep
                          ? 'bg-blue-600'
                          : idx < currentTourStep
                          ? 'bg-slate-300'
                          : 'bg-slate-100'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    disabled={currentTourStep === 0}
                    onClick={() => setCurrentTourStep((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    Back
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTourAction(TOUR_STEPS[currentTourStep])}
                      className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <span>{TOUR_STEPS[currentTourStep].actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {currentTourStep < TOUR_STEPS.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentTourStep((prev) => prev + 1)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
                      >
                        <span>Next Step</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsTourOpen(false)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Finish Tour</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
