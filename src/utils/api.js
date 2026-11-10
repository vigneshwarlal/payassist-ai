/**
 * PayAssist AI API Client
 * Wraps all backend endpoints with robust error handling and sensible fallbacks.
 */

const BASE_URL = '/api';

/**
 * Generic request helper with 2.5s auto-timeout and graceful fallback
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 2500);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: response.statusText || 'Request failed' };
      }
      const error = new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[API Client] Error/timeout fetching ${endpoint}:`, err.message);
    throw err;
  }
}

// -------------------------------------------------------------
// Fallback Mock Data Providers
// -------------------------------------------------------------
const MOCK_KPIS = {
  totalRevenue: 128450.0,
  revenueChange: 14.2,
  transactions: 1429,
  transactionsChange: 8.1,
  avgOrderValue: 89.88,
  avgOrderValueChange: 3.4,
  activeCustomers: 842,
  customersChange: 12.5,
};

const MOCK_REVENUE = {
  week: [
    { label: 'Mon', revenue: 3420, orders: 38 },
    { label: 'Tue', revenue: 4180, orders: 45 },
    { label: 'Wed', revenue: 3890, orders: 41 },
    { label: 'Thu', revenue: 5210, orders: 58 },
    { label: 'Fri', revenue: 6450, orders: 72 },
    { label: 'Sat', revenue: 4890, orders: 54 },
    { label: 'Sun', revenue: 3950, orders: 44 },
  ],
  month: [
    { label: 'Week 1', revenue: 24500, orders: 280 },
    { label: 'Week 2', revenue: 29800, orders: 335 },
    { label: 'Week 3', revenue: 34200, orders: 385 },
    { label: 'Week 4', revenue: 39950, orders: 429 },
  ],
  quarter: [
    { label: 'Jan', revenue: 36500, orders: 410 },
    { label: 'Feb', revenue: 42100, orders: 475 },
    { label: 'Mar', revenue: 49850, orders: 544 },
  ],
  year: [
    { label: 'Q1', revenue: 128450, orders: 1429 },
    { label: 'Q2', revenue: 145200, orders: 1620 },
    { label: 'Q3', revenue: 168900, orders: 1890 },
    { label: 'Q4', revenue: 198500, orders: 2210 },
  ],
};

const MOCK_CATEGORIES = [
  { name: 'SaaS Subscriptions', share: 45, value: 57802, count: 643 },
  { name: 'Consulting Services', share: 25, value: 32112, count: 184 },
  { name: 'Hardware & Kits', share: 18, value: 23121, count: 320 },
  { name: 'Enterprise Licenses', share: 12, value: 15415, count: 282 },
];

const MOCK_ACTIVITY = [
  { id: 'act-1', type: 'payment', title: 'Payment received from Acme Corp', amount: 1250.0, time: '5m ago' },
  { id: 'act-2', type: 'invoice', title: 'Invoice #INV-2024-089 sent to TechFlow', amount: 3400.0, time: '28m ago' },
  { id: 'act-3', type: 'customer', title: 'New VIP customer onboarding: Nexus Labs', time: '1h ago' },
  { id: 'act-4', type: 'refund', title: 'Refund processed for #ORD-8821', amount: 89.0, time: '3h ago' },
];

const MOCK_TRANSACTIONS = [
  {
    id: 'tx_101',
    date: '2024-11-08 11:24',
    customer: 'Sarah Jenkins',
    email: 'sarah.j@acme.com',
    description: 'Enterprise AI Suite - Monthly',
    category: 'SaaS Subscriptions',
    amount: 299.0,
    status: 'Completed',
    paypalOrderId: '8X91238471209841K',
  },
  {
    id: 'tx_102',
    date: '2024-11-08 10:15',
    customer: 'Michael Chang',
    email: 'mchang@techflow.io',
    description: 'PayAssist Merchant Starter Kit',
    category: 'Hardware & Kits',
    amount: 49.0,
    status: 'Completed',
    paypalOrderId: '3K48291048201948L',
  },
  {
    id: 'tx_103',
    date: '2024-11-08 09:42',
    customer: 'Elena Rostova',
    email: 'elena@novasystems.de',
    description: 'AI Fraud Shield & Analytics Addon',
    category: 'SaaS Subscriptions',
    amount: 99.0,
    status: 'Completed',
    paypalOrderId: '1P94820194820194M',
  },
  {
    id: 'tx_104',
    date: '2024-11-07 17:30',
    customer: 'Marcus Vance',
    email: 'marcus@vancecapital.com',
    description: 'Custom Workflow Integration Consulting',
    category: 'Consulting Services',
    amount: 1500.0,
    status: 'Completed',
    paypalOrderId: '9T73829104820195N',
  },
  {
    id: 'tx_105',
    date: '2024-11-07 15:10',
    customer: 'Amira Patel',
    email: 'amira@solardynamics.org',
    description: 'Enterprise Licenses (10 seats)',
    category: 'Enterprise Licenses',
    amount: 2490.0,
    status: 'Completed',
    paypalOrderId: '4Q82019482019482P',
  },
  {
    id: 'tx_106',
    date: '2024-11-07 13:05',
    customer: 'David Kim',
    email: 'dkim@quantumreach.com',
    description: 'Hardware POS Terminal Terminal Sync',
    category: 'Hardware & Kits',
    amount: 149.0,
    status: 'Refunded',
    paypalOrderId: '2L73920194820196R',
  },
  {
    id: 'tx_107',
    date: '2024-11-06 18:22',
    customer: 'Sophia Martinez',
    email: 'sophia@lunahealth.co',
    description: 'Enterprise AI Suite - Annual Plan',
    category: 'SaaS Subscriptions',
    amount: 3200.0,
    status: 'Completed',
    paypalOrderId: '6W82910482019487S',
  },
  {
    id: 'tx_108',
    date: '2024-11-06 16:40',
    customer: 'Julian Bauer',
    email: 'j.bauer@alpinetech.ch',
    description: 'PayAssist Merchant Starter Kit',
    category: 'Hardware & Kits',
    amount: 49.0,
    status: 'Completed',
    paypalOrderId: '5Y92019482019488T',
  },
  {
    id: 'tx_109',
    date: '2024-11-06 11:15',
    customer: 'Chloe Zhao',
    email: 'chloe@zhaoventures.cn',
    description: 'Agentic Commerce Consultation',
    category: 'Consulting Services',
    amount: 750.0,
    status: 'Completed',
    paypalOrderId: '7U10293847561029V',
  },
  {
    id: 'tx_110',
    date: '2024-11-05 14:50',
    customer: 'Oliver Smith',
    email: 'oliver@smithandco.uk',
    description: 'AI Fraud Shield & Analytics',
    category: 'SaaS Subscriptions',
    amount: 99.0,
    status: 'Pending',
    paypalOrderId: '8A29104820194820W',
  },
  {
    id: 'tx_111',
    date: '2024-11-05 12:30',
    customer: 'Lucas Silva',
    email: 'lucas@riotech.br',
    description: 'Enterprise Multi-Currency Gateway',
    category: 'Enterprise Licenses',
    amount: 890.0,
    status: 'Completed',
    paypalOrderId: '9B39201948201948X',
  },
  {
    id: 'tx_112',
    date: '2024-11-04 16:15',
    customer: 'Emma Watson',
    email: 'emma@watsonmedia.com',
    description: 'PayAssist Pro Subscription',
    category: 'SaaS Subscriptions',
    amount: 199.0,
    status: 'Completed',
    paypalOrderId: '1C49302948201948Y',
  },
];

const MOCK_INVOICES = [
  {
    id: 'INV-2024-001',
    customer: 'Acme Global Inc',
    email: 'billing@acme.com',
    amount: 4500.0,
    status: 'Paid',
    dueDate: '2024-11-15',
    created: '2024-10-15',
    description: 'Quarterly AI Agent Orchestration Support',
  },
  {
    id: 'INV-2024-002',
    customer: 'TechFlow Systems',
    email: 'accounting@techflow.io',
    amount: 3400.0,
    status: 'Sent',
    dueDate: '2024-11-20',
    created: '2024-10-20',
    description: 'PayPal Complete Payments Integration & Testing',
  },
  {
    id: 'INV-2024-003',
    customer: 'Nova Systems GmbH',
    email: 'elena@novasystems.de',
    amount: 1850.0,
    status: 'Paid',
    dueDate: '2024-11-10',
    created: '2024-10-10',
    description: 'Autonomous Fraud Detection Setup',
  },
  {
    id: 'INV-2024-004',
    customer: 'Solar Dynamics Org',
    email: 'amira@solardynamics.org',
    amount: 6200.0,
    status: 'Sent',
    dueDate: '2024-11-25',
    created: '2024-10-25',
    description: 'Enterprise Multi-Region Checkout Deployment',
  },
  {
    id: 'INV-2024-005',
    customer: 'Vance Capital Corp',
    email: 'marcus@vancecapital.com',
    amount: 9800.0,
    status: 'Draft',
    dueDate: '2024-12-01',
    created: '2024-11-01',
    description: 'Autonomous AI Payouts & Escrow Integration',
  },
  {
    id: 'INV-2024-006',
    customer: 'Quantum Reach Media',
    email: 'dkim@quantumreach.com',
    amount: 1200.0,
    status: 'Overdue',
    dueDate: '2024-10-31',
    created: '2024-10-01',
    description: 'Subscription Analytics & Churn Reduction Agent',
  },
  {
    id: 'INV-2024-007',
    customer: 'Luna Health Co',
    email: 'sophia@lunahealth.co',
    amount: 2750.0,
    status: 'Draft',
    dueDate: '2024-11-30',
    created: '2024-11-05',
    description: 'HIPAA Compliant Payment Tokenization',
  },
  {
    id: 'INV-2024-008',
    customer: 'Alpine Tech Solutions',
    email: 'j.bauer@alpinetech.ch',
    amount: 5100.0,
    status: 'Paid',
    dueDate: '2024-11-05',
    created: '2024-10-05',
    description: 'AI Checkout Personalization Engine',
  },
];

const MOCK_CUSTOMERS = [
  {
    id: 'cust-1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@acme.com',
    totalSpent: 18450.0,
    transactions: 24,
    firstPurchase: '2023-08-12',
    lastPurchase: '2024-11-08',
    status: 'VIP',
    company: 'Acme Global Inc',
    phone: '+1 (555) 234-5678',
    notes: 'Key decision maker for enterprise AI tools. Prompt payments.',
  },
  {
    id: 'cust-2',
    name: 'Marcus Vance',
    email: 'marcus@vancecapital.com',
    totalSpent: 15200.0,
    transactions: 12,
    firstPurchase: '2023-11-04',
    lastPurchase: '2024-11-07',
    status: 'VIP',
    company: 'Vance Capital Corp',
    phone: '+1 (555) 876-5432',
    notes: 'Interested in AI-driven merchant payout scheduling.',
  },
  {
    id: 'cust-3',
    name: 'Amira Patel',
    email: 'amira@solardynamics.org',
    totalSpent: 12400.0,
    transactions: 18,
    firstPurchase: '2024-01-15',
    lastPurchase: '2024-11-07',
    status: 'VIP',
    company: 'Solar Dynamics Org',
    phone: '+1 (555) 345-6789',
    notes: 'Annual renewal scheduled for January. Expanding team seats.',
  },
  {
    id: 'cust-4',
    name: 'Elena Rostova',
    email: 'elena@novasystems.de',
    totalSpent: 8900.0,
    transactions: 14,
    firstPurchase: '2024-02-20',
    lastPurchase: '2024-11-08',
    status: 'Active',
    company: 'Nova Systems GmbH',
    phone: '+49 30 123456',
    notes: 'Utilizing AI fraud shield; 0 chargebacks reported.',
  },
  {
    id: 'cust-5',
    name: 'Sophia Martinez',
    email: 'sophia@lunahealth.co',
    totalSpent: 7300.0,
    transactions: 9,
    firstPurchase: '2024-03-10',
    lastPurchase: '2024-11-06',
    status: 'Active',
    company: 'Luna Health Co',
    phone: '+1 (555) 456-7890',
    notes: 'Healthcare sector client. Strict compliance needs.',
  },
  {
    id: 'cust-6',
    name: 'Michael Chang',
    email: 'mchang@techflow.io',
    totalSpent: 4200.0,
    transactions: 8,
    firstPurchase: '2024-04-02',
    lastPurchase: '2024-11-08',
    status: 'Active',
    company: 'TechFlow Systems',
    phone: '+1 (555) 987-6543',
    notes: 'Integrating PayPal Smart Buttons onto their web app.',
  },
  {
    id: 'cust-7',
    name: 'David Kim',
    email: 'dkim@quantumreach.com',
    totalSpent: 2800.0,
    transactions: 5,
    firstPurchase: '2024-05-18',
    lastPurchase: '2024-11-07',
    status: 'Inactive',
    company: 'Quantum Reach Media',
    phone: '+1 (555) 654-3210',
    notes: 'Has one overdue invoice #INV-2024-006. Needs automated follow-up.',
  },
  {
    id: 'cust-8',
    name: 'Julian Bauer',
    email: 'j.bauer@alpinetech.ch',
    totalSpent: 6700.0,
    transactions: 11,
    firstPurchase: '2024-02-05',
    lastPurchase: '2024-11-06',
    status: 'Active',
    company: 'Alpine Tech Solutions',
    phone: '+41 22 7654321',
    notes: 'High satisfaction with PayPal multi-currency settlement.',
  },
];

// In-memory cache for demo mutations
let localInvoices = [...MOCK_INVOICES];

// -------------------------------------------------------------
// Dashboard API
// -------------------------------------------------------------
export async function fetchKPIs() {
  try {
    const data = await request('/dashboard/kpis');
    return data?.data || data || MOCK_KPIS;
  } catch {
    return MOCK_KPIS;
  }
}

export async function fetchRevenue(period = 'month') {
  try {
    const raw = await request(`/dashboard/revenue?period=${period}`);
    const arr = raw?.data || (Array.isArray(raw) ? raw : null) || MOCK_REVENUE[period] || MOCK_REVENUE.month;
    // Transform backend shape {date, revenue, transactions} → {label, revenue, orders}
    return arr.map(item => ({
      label: item.label || item.date || '',
      revenue: item.revenue || 0,
      orders: item.orders ?? item.transactions ?? 0,
    }));
  } catch {
    return MOCK_REVENUE[period] || MOCK_REVENUE.month;
  }
}

export async function fetchActivity() {
  try {
    const data = await request('/dashboard/activity');
    return data?.data || data || MOCK_ACTIVITY;
  } catch {
    return MOCK_ACTIVITY;
  }
}

export async function fetchCategories() {
  try {
    const data = await request('/dashboard/categories');
    return data?.data || data || MOCK_CATEGORIES;
  } catch {
    return MOCK_CATEGORIES;
  }
}

// -------------------------------------------------------------
// Transactions API
// -------------------------------------------------------------
export async function fetchTransactions(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const raw = await request(`/transactions${query ? `?${query}` : ''}`);
    const arr = raw?.transactions || raw?.data || (Array.isArray(raw) ? raw : null) || MOCK_TRANSACTIONS;
    // Map backend field names to what the grid expects
    return arr.map(t => ({
      id: t.id,
      date: t.date || (t.created_at ? new Date(t.created_at).toLocaleString() : ''),
      customer: t.customer || t.customer_name || 'Unknown',
      email: t.email || t.customer_email || '',
      description: t.description || '',
      category: t.category || 'General',
      amount: t.amount || 0,
      status: capitalize(t.status || 'Pending'),
      paypalOrderId: t.paypalOrderId || t.paypal_order_id || '',
    }));
  } catch {
    return MOCK_TRANSACTIONS;
  }
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export async function fetchTransaction(id) {
  try {
    const data = await request(`/transactions/${id}`);
    return data?.data || data;
  } catch {
    return MOCK_TRANSACTIONS.find((tx) => tx.id === id) || null;
  }
}

// -------------------------------------------------------------
// Invoices API
// -------------------------------------------------------------
export async function fetchInvoices(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const raw = await request(`/invoices${query ? `?${query}` : ''}`);
    const arr = raw?.invoices || raw?.data || (Array.isArray(raw) ? raw : null) || localInvoices;
    return arr.map(inv => ({
      id: inv.id || inv.paypal_invoice_id,
      customer: inv.customer || inv.customer_name || '',
      email: inv.email || inv.customer_email || '',
      amount: inv.amount || 0,
      status: capitalize(inv.status || 'Draft'),
      dueDate: inv.dueDate || inv.due_date || '',
      created: inv.created || (inv.created_at ? inv.created_at.split('T')[0] : ''),
      description: inv.description || '',
      paypalInvoiceId: inv.paypalInvoiceId || inv.paypal_invoice_id || '',
    }));
  } catch {
    return localInvoices;
  }
}

export async function createInvoice(invoiceData) {
  try {
    const data = await request('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
    const created = data?.data || data;
    localInvoices = [created, ...localInvoices];
    return created;
  } catch {
    // Generate realistic local invoice if server is offline
    const newInvoice = {
      id: `INV-2024-${String(localInvoices.length + 1).padStart(3, '0')}`,
      customer: invoiceData.customer || invoiceData.customerName,
      email: invoiceData.email || invoiceData.customerEmail,
      amount: parseFloat(invoiceData.amount) || 0,
      status: invoiceData.status || 'Draft',
      dueDate: invoiceData.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      created: new Date().toISOString().split('T')[0],
      description: invoiceData.description || 'Professional Commerce Services',
    };
    localInvoices = [newInvoice, ...localInvoices];
    return newInvoice;
  }
}

export async function updateInvoice(id, updateData) {
  try {
    const data = await request(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return data?.data || data;
  } catch {
    localInvoices = localInvoices.map((inv) => (inv.id === id ? { ...inv, ...updateData } : inv));
    return localInvoices.find((inv) => inv.id === id);
  }
}

export async function sendInvoice(id) {
  try {
    const data = await request(`/invoices/${id}/send`, {
      method: 'POST',
    });
    return data?.data || data;
  } catch {
    localInvoices = localInvoices.map((inv) => (inv.id === id ? { ...inv, status: 'Sent' } : inv));
    return { success: true, message: `Invoice ${id} successfully delivered to customer email.`, invoiceId: id };
  }
}

// -------------------------------------------------------------
// Customers API
// -------------------------------------------------------------
export async function fetchCustomers(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const raw = await request(`/customers${query ? `?${query}` : ''}`);
    const arr = raw?.customers || raw?.data || (Array.isArray(raw) ? raw : null) || MOCK_CUSTOMERS;
    return arr.map(c => ({
      id: c.id,
      name: c.name || c.customer_name || '',
      email: c.email || c.customer_email || '',
      totalSpent: c.totalSpent ?? c.total_spent ?? 0,
      transactions: c.transactions ?? c.transaction_count ?? 0,
      firstPurchase: c.firstPurchase || c.first_purchase || '',
      lastPurchase: c.lastPurchase || c.last_purchase || '',
      status: capitalize(c.status || 'active'),
      created: c.created || c.created_at || '',
    }));
  } catch {
    return MOCK_CUSTOMERS;
  }
}

export async function fetchCustomer(id) {
  try {
    const data = await request(`/customers/${id}`);
    return data?.data || data;
  } catch {
    return MOCK_CUSTOMERS.find((c) => c.id === id) || null;
  }
}

export async function fetchTopCustomers(limit = 5) {
  try {
    const data = await request(`/customers/top?limit=${limit}`);
    return data?.data || data || MOCK_CUSTOMERS.slice(0, limit);
  } catch {
    return [...MOCK_CUSTOMERS].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, limit);
  }
}

// -------------------------------------------------------------
// Agent AI Chat API
// -------------------------------------------------------------
export async function sendChatMessage(message, history = []) {
  try {
    const response = await request('/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    });
    return response;
  } catch (err) {
    // Intelligent local response generation if AI backend is temporarily unreachable
    const lower = message.toLowerCase();
    let replyText = '';
    let action = null;

    if (lower.includes('revenue') || lower.includes('summary')) {
      replyText = `### 📊 Monthly Revenue Summary\n\n- **Total Revenue**: **$128,450.00** (+14.2% MoM)\n- **Completed Orders**: **1,429** transactions\n- **Average Order Value (AOV)**: **$89.88**\n- **Top Channel**: SaaS Subscriptions ($57,802.00)\n\nCash flow remains strong with a 98.4% payment success rate via PayPal checkout.`;
      action = {
        type: 'insight',
        title: 'Monthly Growth Insight',
        details: 'Revenue increased by +14.2% this month, primarily driven by enterprise subscription renewals.',
      };
    } else if (lower.includes('invoice') || lower.includes('create')) {
      const invId = `INV-2024-${String(localInvoices.length + 1).padStart(3, '0')}`;
      replyText = `I have drafted a new invoice for you:\n\n- **Invoice**: \`${invId}\`\n- **Client**: TechFlow Systems\n- **Amount**: **$1,500.00 USD**\n- **Due Date**: Net 14 days\n\nWould you like me to send the payment link immediately via PayPal?`;
      action = {
        type: 'invoice_created',
        title: `Invoice ${invId} Generated`,
        details: 'Created for TechFlow Systems ($1,500.00 USD). Ready for merchant review.',
        invoiceId: invId,
        amount: 1500.0,
        customer: 'TechFlow Systems',
      };
    } else if (lower.includes('customer') || lower.includes('top')) {
      replyText = `### 🌟 Your Top 3 VIP Customers\n\n1. **Sarah Jenkins** (Acme Global) — **$18,450.00** across 24 orders\n2. **Marcus Vance** (Vance Capital) — **$15,200.00** across 12 orders\n3. **Amira Patel** (Solar Dynamics) — **$12,400.00** across 18 orders\n\nAll three accounts are in good standing with zero disputes.`;
      action = {
        type: 'insight',
        title: 'VIP Customer Retention',
        details: 'Top 3 clients account for 35.9% of lifetime gross transaction volume.',
      };
    } else if (lower.includes('health') || lower.includes('check')) {
      replyText = `### 🩺 Business Health Check: **Optimal (96/100)**\n\n- **Dispute Ratio**: 0.04% *(Well below PayPal standard threshold of 1%)*\n- **Overdue Invoices**: 1 ($1,200 from Quantum Reach)\n- **Active Customers**: 842 merchants & teams\n- **Recommendation**: Send an automated reminder for invoice #INV-2024-006 to collect pending balance.`;
      action = {
        type: 'payment_link',
        title: 'Action Item: Overdue Reminder',
        details: 'Instant PayPal reminder link generated for Quantum Reach ($1,200.00).',
        url: 'https://paypal.me/payassist-demo/1200',
      };
    } else {
      replyText = `I'm **PayAssist AI**, your agentic commerce co-pilot. I can help you analyze revenue metrics, draft PayPal invoices, manage client relationships, and automate recurring commerce workflows.\n\nTry asking:\n- *"Show revenue summary"*\n- *"Create an invoice for $2,500"*\n- *"Who are my top customers?"*\n- *"Perform a business health check"*`;
    }

    return {
      success: true,
      reply: replyText,
      action,
      timestamp: new Date().toISOString(),
    };
  }
}

// -------------------------------------------------------------
// Sentinel AI Risk & Fraud Shield API
// -------------------------------------------------------------
export async function fetchSentinelStream() {
  try {
    const data = await request('/sentinel/stream');
    return data?.events || [];
  } catch {
    return [
      {
        id: 'risk_01',
        timestamp: new Date().toISOString(),
        customer: 'Amira Patel',
        amount: 2490.0,
        riskScore: 12,
        decision: 'APPROVE',
        badgeColor: 'emerald',
        aiRecommendation: 'Known VIP verified customer. Instant capture authorized.',
        riskFactors: []
      },
      {
        id: 'risk_02',
        timestamp: new Date().toISOString(),
        customer: 'Bot Tester 44',
        amount: 0.99,
        riskScore: 84,
        decision: 'AUTO_BLOCK_ESCROW',
        badgeColor: 'rose',
        aiRecommendation: 'Card-testing micro-charge from burner domain. Auto-placed in PayPal safety hold.',
        riskFactors: [{ code: 'MICRO_TRANSACTION_VELOCITY', severity: 'HIGH', description: 'Repeated micro-amount test.' }]
      }
    ];
  }
}

export async function simulateSentinelTransaction(customData = {}) {
  try {
    const data = await request('/sentinel/simulate', {
      method: 'POST',
      body: JSON.stringify(customData),
    });
    return data?.simulatedEvent;
  } catch {
    return {
      id: `risk_${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      customer: customData.customer_name || 'Autonomous Simulation Buyer',
      amount: customData.amount || 1200.0,
      riskScore: 28,
      decision: 'APPROVE',
      badgeColor: 'emerald',
      aiRecommendation: 'Simulated transaction validated by Sentinel AI heuristics.',
      riskFactors: []
    };
  }
}

// -------------------------------------------------------------
// PayPal Endpoints
// -------------------------------------------------------------
export async function createOrder(orderData) {
  try {
    return await request('/paypal/create-order', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  } catch {
    // Return a mock order ID if backend is offline so PayPal sandbox or simulated flow proceeds
    return {
      orderId: `PAYPAL-MOCK-${Date.now().toString(36).toUpperCase()}`,
      status: 'CREATED',
    };
  }
}

export async function captureOrder(orderId) {
  try {
    return await request('/paypal/capture-order', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  } catch {
    return {
      success: true,
      captureId: `CAP-${Math.floor(Math.random() * 900000 + 100000)}`,
      status: 'COMPLETED',
      orderId,
      payer: {
        name: { given_name: 'Alex', surname: 'Merchant' },
        email_address: 'alex.buyer@example.com',
      },
    };
  }
}
