import React, { useState } from 'react';
import { FileText, ExternalLink, ArrowUpRight, Sparkles, Check, Copy } from 'lucide-react';

export default function ActionCard({ action, onActionClick }) {
  const [copied, setCopied] = useState(false);

  if (!action) return null;

  const { type, title, details, invoiceId, amount, url } = action;

  // Configuration mapped by action type
  const typeConfig = {
    invoice_created: {
      border: 'border-l-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeText: 'Invoice Created',
      icon: FileText,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      buttonText: 'View Invoice',
      buttonAction: 'view_invoice',
    },
    payment_link: {
      border: 'border-l-amber-500',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      badgeText: 'PayPal Link Ready',
      icon: ExternalLink,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      buttonText: 'Copy Link',
      buttonAction: 'copy_link',
    },
    payout_sent: {
      border: 'border-l-blue-600',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      badgeText: 'Instant Payout',
      icon: ArrowUpRight,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      buttonText: 'Track Payout',
      buttonAction: 'track_payout',
    },
    insight: {
      border: 'border-l-purple-500',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      badgeText: 'AI Business Insight',
      icon: Sparkles,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      buttonText: 'Explore Data',
      buttonAction: 'explore_data',
    },
  };

  const config = typeConfig[type] || typeConfig.insight;
  const IconComponent = config.icon;

  const handleCopyLink = () => {
    const textToCopy = url || `https://paypal.me/payassist-demo/${amount || 100}`;
    navigator.clipboard?.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClick = () => {
    if (config.buttonAction === 'copy_link') {
      handleCopyLink();
    }
    if (onActionClick) {
      onActionClick(action);
    }
  };

  return (
    <div
      className={`mt-3 p-3.5 bg-white rounded-xl border border-gray-200 border-l-4 ${config.border} shadow-sm hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${config.iconBg} ${config.iconColor} shrink-0 mt-0.5`}>
          <IconComponent className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-xs font-semibold text-gray-900 tracking-tight truncate">{title}</h4>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${config.badgeBg}`}>
              {config.badgeText}
            </span>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed mb-2.5">{details}</p>

          {/* Action details pill if invoice or amount */}
          {(invoiceId || amount) && (
            <div className="flex items-center gap-2 mb-2.5 text-[11px] text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100 w-fit">
              {invoiceId && <span>{invoiceId}</span>}
              {invoiceId && amount && <span>•</span>}
              {amount && <span className="font-semibold text-emerald-700">${Number(amount).toFixed(2)}</span>}
            </div>
          )}

          {/* Action button */}
          <button
            type="button"
            onClick={handleClick}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors border border-blue-200/60"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                {config.buttonAction === 'copy_link' && <Copy className="w-3.5 h-3.5" />}
                <span>{config.buttonText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
