import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, run } from '../db.js';
import paypalService from './paypalService.js';
import analytics from './analytics.js';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Map to retain multi-turn chat sessions in memory
const sessionChats = new Map();

const SYSTEM_INSTRUCTION = `You are PayAssist, an intelligent agentic commerce and finance assistant built for modern businesses.
You specialize in managing PayPal payments, generating invoices, tracking business health, analyzing cash flow, executing payouts, and managing customer financial relationships.

You have access to powerful real-time tools to execute actions on behalf of the business:
- create_invoice: Draft and issue PayPal invoices to customers
- list_invoices: Retrieve and filter business invoices by status
- get_revenue_summary: Fetch revenue numbers and breakdowns over week, month, quarter, or year
- search_transactions: Find past payments, filters by customer, status, or date
- get_customer_insights: Inspect lifetime value, purchase frequency, and risk profile of customers
- create_payment_link: Generate instantaneous PayPal checkout/payment links
- send_payout: Dispatch payouts or vendor payments via PayPal Payouts
- get_business_health: Compute executive KPIs, overdue risks, cash flow projection, and health score

Guidelines:
1. Always be professional, concise, proactive, and action-oriented.
2. Whenever the user asks you to perform an action (e.g., "Invoice Marcus $500 for web design"), use the corresponding tool immediately!
3. Format currency amounts clearly as $X,XXX.XX.
4. When reporting financial metrics, highlight key takeaways, risks (e.g. overdue invoices), and growth opportunities.
5. If required information is missing to perform an action (such as customer email or amount), politely ask for clarification or use sensible defaults if appropriate.
6. Provide clear summaries after executing actions (e.g. provide the invoice ID, approval link, or transaction details).`;

// Function declarations for Gemini Tool Calling
const functionDeclarations = [
  {
    name: 'create_invoice',
    description: 'Create and issue a new invoice to a customer, registering it in both SQLite and PayPal.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customer_name: { type: 'STRING', description: 'Customer or company name' },
        customer_email: { type: 'STRING', description: 'Customer email address' },
        amount: { type: 'NUMBER', description: 'Invoice amount in USD' },
        description: { type: 'STRING', description: 'Description of services or products' },
        due_date: { type: 'STRING', description: 'Due date in YYYY-MM-DD format (optional)' }
      },
      required: ['customer_name', 'customer_email', 'amount', 'description']
    }
  },
  {
    name: 'list_invoices',
    description: 'List existing invoices with optional filtering by status (ALL, PAID, SENT, DRAFT, OVERDUE, CANCELLED).',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: { type: 'STRING', description: 'Filter by status: ALL, PAID, SENT, DRAFT, OVERDUE' },
        limit: { type: 'NUMBER', description: 'Maximum number of invoices to return (default 10)' }
      }
    }
  },
  {
    name: 'get_revenue_summary',
    description: 'Get total revenue, transaction counts, and trend breakdown for a given period.',
    parameters: {
      type: 'OBJECT',
      properties: {
        period: {
          type: 'STRING',
          description: "Period of time: 'week', 'month', 'quarter', or 'year'",
          enum: ['week', 'month', 'quarter', 'year']
        }
      },
      required: ['period']
    }
  },
  {
    name: 'search_transactions',
    description: 'Search transaction history by keyword, customer, status, category, or date range.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Search term matching customer name, email, or description' },
        status: { type: 'STRING', description: 'Transaction status (COMPLETED, PENDING, FAILED, REFUNDED)' },
        category: { type: 'STRING', description: 'Category (Consulting, Web Design, Marketing, Development, Support)' },
        date_from: { type: 'STRING', description: 'Start date in YYYY-MM-DD format' },
        date_to: { type: 'STRING', description: 'End date in YYYY-MM-DD format' }
      }
    }
  },
  {
    name: 'get_customer_insights',
    description: 'Get deep customer insights, lifetime value, purchase history, and reliability metrics.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customer_email: { type: 'STRING', description: "Specific customer email or 'all' for top customers overview" }
      }
    }
  },
  {
    name: 'create_payment_link',
    description: 'Generate an instant PayPal payment checkout order and return the approval link.',
    parameters: {
      type: 'OBJECT',
      properties: {
        amount: { type: 'NUMBER', description: 'Amount to charge in USD' },
        description: { type: 'STRING', description: 'Description of the charge/payment' },
        currency: { type: 'STRING', description: 'Currency code, default USD' }
      },
      required: ['amount', 'description']
    }
  },
  {
    name: 'send_payout',
    description: 'Send a payout or disbursement to a vendor or contractor email via PayPal Payouts.',
    parameters: {
      type: 'OBJECT',
      properties: {
        recipient_email: { type: 'STRING', description: 'PayPal email address of the recipient' },
        amount: { type: 'NUMBER', description: 'Amount in USD to send' },
        note: { type: 'STRING', description: 'Note/reason for the payout' }
      },
      required: ['recipient_email', 'amount']
    }
  },
  {
    name: 'get_business_health',
    description: 'Returns executive business health metrics: revenue, cash flow projection, active customers, and overdue invoice risk.',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  }
];

/**
 * Tool Execution Handlers
 */
async function executeTool(name, args) {
  switch (name) {
    case 'create_invoice': {
      const { customer_name, customer_email, amount, description, due_date } = args;
      const invoiceId = uuidv4();
      const dueDateVal = due_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
      const nowStr = new Date().toISOString();
      let paypalInvoiceId = `INV2-${Date.now().toString().slice(-8)}`;

      // Attempt to register with PayPal sandbox
      try {
        const ppResult = await paypalService.createInvoice({
          customerName: customer_name,
          customerEmail: customer_email,
          amount,
          description,
          dueDate: dueDateVal
        });
        if (ppResult && ppResult.id) {
          paypalInvoiceId = ppResult.id;
        }
      } catch (err) {
        console.warn('PayPal invoice creation sandbox fallback:', err.message);
      }

      const itemsJson = JSON.stringify([
        {
          name: description,
          quantity: 1,
          unit_amount: { currency_code: 'USD', value: Number(amount).toFixed(2) }
        }
      ]);

      run(
        `INSERT INTO invoices (id, paypal_invoice_id, customer_name, customer_email, amount, currency, status, due_date, description, items, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'USD', 'SENT', ?, ?, ?, ?, ?)`,
        [invoiceId, paypalInvoiceId, customer_name, customer_email, Number(amount), dueDateVal, description, itemsJson, nowStr, nowStr]
      );

      // Upsert customer if not already existing
      const existingCust = queryOne('SELECT id FROM customers WHERE email = ?', [customer_email]);
      if (!existingCust) {
        run(
          `INSERT INTO customers (id, name, email, total_spent, transaction_count, first_purchase, last_purchase, status, created_at)
           VALUES (?, ?, ?, 0, 0, NULL, NULL, 'active', ?)`,
          [uuidv4(), customer_name, customer_email, nowStr]
        );
      }

      const createdInvoice = {
        id: invoiceId,
        paypal_invoice_id: paypalInvoiceId,
        customer_name,
        customer_email,
        amount: Number(amount),
        currency: 'USD',
        status: 'SENT',
        due_date: dueDateVal,
        description
      };

      return {
        action: {
          type: 'invoice_created',
          title: `Created Invoice ${paypalInvoiceId}`,
          data: createdInvoice
        },
        result: {
          success: true,
          message: `Invoice ${paypalInvoiceId} created and sent to ${customer_email} for $${Number(amount).toFixed(2)}.`,
          invoice: createdInvoice
        }
      };
    }

    case 'list_invoices': {
      const status = args.status ? args.status.toUpperCase() : 'ALL';
      const limit = Math.min(50, Math.max(1, parseInt(args.limit, 10) || 10));

      let rows;
      if (status && status !== 'ALL') {
        rows = query(
          `SELECT id, paypal_invoice_id, customer_name, customer_email, amount, currency, status, due_date, description, created_at
           FROM invoices
           WHERE status = ?
           ORDER BY created_at DESC
           LIMIT ?`,
          [status, limit]
        );
      } else {
        rows = query(
          `SELECT id, paypal_invoice_id, customer_name, customer_email, amount, currency, status, due_date, description, created_at
           FROM invoices
           ORDER BY created_at DESC
           LIMIT ?`,
          [limit]
        );
      }

      return {
        action: {
          type: 'invoices_listed',
          title: `Retrieved ${rows.length} Invoices (${status})`,
          data: rows
        },
        result: {
          count: rows.length,
          statusFilter: status,
          invoices: rows
        }
      };
    }

    case 'get_revenue_summary': {
      const period = args.period || 'month';
      const trend = analytics.getRevenueByPeriod(period);
      const kpis = analytics.getDashboardKPIs();

      const periodRevenue = trend.reduce((sum, item) => sum + item.revenue, 0);
      const periodTransactions = trend.reduce((sum, item) => sum + item.transactions, 0);

      return {
        action: {
          type: 'revenue_summary',
          title: `${period.toUpperCase()} Revenue Summary: $${periodRevenue.toFixed(2)}`,
          data: { period, revenue: periodRevenue, transactions: periodTransactions, trend }
        },
        result: {
          period,
          periodRevenue: Number(periodRevenue.toFixed(2)),
          periodTransactions,
          lifetimeRevenue: kpis.totalRevenue,
          revenueGrowthPercent: kpis.revenueGrowthPercent,
          dataPoints: trend
        }
      };
    }

    case 'search_transactions': {
      let conditions = [];
      let params = [];

      if (args.query) {
        conditions.push(`(customer_name LIKE ? OR customer_email LIKE ? OR description LIKE ?)`);
        const q = `%${args.query}%`;
        params.push(q, q, q);
      }
      if (args.status) {
        conditions.push(`status = ?`);
        params.push(args.status.toUpperCase());
      }
      if (args.category) {
        conditions.push(`category = ?`);
        params.push(args.category);
      }
      if (args.date_from) {
        conditions.push(`created_at >= ?`);
        params.push(args.date_from);
      }
      if (args.date_to) {
        conditions.push(`created_at <= ?`);
        params.push(args.date_to + 'T23:59:59');
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const sql = `
        SELECT id, paypal_order_id, amount, currency, status, customer_name, customer_email, description, category, created_at
        FROM transactions
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT 20
      `;

      const rows = query(sql, params);

      return {
        action: {
          type: 'transactions_searched',
          title: `Found ${rows.length} Matching Transactions`,
          data: rows
        },
        result: {
          count: rows.length,
          transactions: rows
        }
      };
    }

    case 'get_customer_insights': {
      const email = args.customer_email;

      if (email && email.toLowerCase() !== 'all') {
        const cust = queryOne('SELECT * FROM customers WHERE email = ?', [email]);
        if (!cust) {
          return {
            action: { type: 'customer_not_found', data: { email } },
            result: { error: `Customer with email ${email} not found in database.` }
          };
        }

        const trans = query(
          `SELECT id, amount, status, description, category, created_at
           FROM transactions
           WHERE customer_email = ?
           ORDER BY created_at DESC`,
          [email]
        );

        const invoices = query(
          `SELECT id, amount, status, due_date, description, created_at
           FROM invoices
           WHERE customer_email = ?
           ORDER BY created_at DESC`,
          [email]
        );

        const completedTrans = trans.filter(t => t.status === 'COMPLETED');
        const overdueInvoices = invoices.filter(i => i.status === 'OVERDUE');

        const profile = {
          customer: cust,
          totalSpent: cust.total_spent,
          completedOrdersCount: completedTrans.length,
          recentTransactions: trans.slice(0, 5),
          invoicesSummary: {
            total: invoices.length,
            overdue: overdueInvoices.length,
            overdueAmount: overdueInvoices.reduce((sum, i) => sum + i.amount, 0)
          },
          riskScore: overdueInvoices.length > 0 ? 'Medium' : 'Low',
          loyaltyTier: cust.total_spent > 5000 ? 'VIP' : cust.total_spent > 2000 ? 'Premium' : 'Standard'
        };

        return {
          action: {
            type: 'customer_profile',
            title: `Insights for ${cust.name}`,
            data: profile
          },
          result: profile
        };
      } else {
        // All top customers
        const topCustomers = analytics.getTopCustomers(10);
        return {
          action: {
            type: 'top_customers',
            title: 'Top Customer Spending Overview',
            data: topCustomers
          },
          result: {
            topCustomers
          }
        };
      }
    }

    case 'create_payment_link': {
      const amount = Number(args.amount);
      const description = args.description || 'Payment via PayAssist';
      const currency = args.currency || 'USD';
      const transId = uuidv4();
      const nowStr = new Date().toISOString();

      let orderId = `ORD-${Date.now()}`;
      let approvalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${orderId}`;

      try {
        const order = await paypalService.createOrder(amount, description, currency);
        if (order && order.id) {
          orderId = order.id;
          approvalUrl = order.approvalUrl || `https://www.sandbox.paypal.com/checkoutnow?token=${order.id}`;
        }
      } catch (err) {
        console.warn('PayPal order creation sandbox fallback:', err.message);
      }

      run(
        `INSERT INTO transactions (id, paypal_order_id, amount, currency, status, customer_name, customer_email, description, category, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'PENDING', 'Guest Checkout', 'guest@checkout.local', ?, 'Development', ?, ?)`,
        [transId, orderId, amount, currency, description, nowStr, nowStr]
      );

      const linkData = {
        transactionId: transId,
        orderId,
        amount,
        currency,
        description,
        approvalUrl
      };

      return {
        action: {
          type: 'payment_link_created',
          title: `Created Payment Link for $${amount.toFixed(2)}`,
          data: linkData
        },
        result: {
          success: true,
          approvalUrl,
          orderId,
          amount,
          currency,
          description
        }
      };
    }

    case 'send_payout': {
      const recipient = args.recipient_email;
      const amount = Number(args.amount);
      const note = args.note || 'Vendor payout via PayAssist';
      let payoutBatchId = `BATCH-${Date.now()}`;

      try {
        const payoutRes = await paypalService.createPayout(recipient, amount, note);
        if (payoutRes?.batch_header?.payout_batch_id) {
          payoutBatchId = payoutRes.batch_header.payout_batch_id;
        }
      } catch (err) {
        console.warn('PayPal payout sandbox fallback:', err.message);
      }

      // Record transaction
      const transId = uuidv4();
      const nowStr = new Date().toISOString();
      run(
        `INSERT INTO transactions (id, paypal_order_id, amount, currency, status, customer_name, customer_email, description, category, created_at, updated_at)
         VALUES (?, ?, ?, 'USD', 'COMPLETED', ?, ?, ?, 'Support', ?, ?)`,
        [transId, payoutBatchId, -amount, 'Vendor / Contractor', recipient, `Payout: ${note}`, nowStr, nowStr]
      );

      const payoutData = {
        transactionId: transId,
        payoutBatchId,
        recipient,
        amount,
        note,
        status: 'SUCCESS'
      };

      return {
        action: {
          type: 'payout_sent',
          title: `Sent Payout of $${amount.toFixed(2)} to ${recipient}`,
          data: payoutData
        },
        result: {
          success: true,
          message: `Successfully initiated payout of $${amount.toFixed(2)} to ${recipient}. Batch ID: ${payoutBatchId}`,
          payout: payoutData
        }
      };
    }

    case 'get_business_health': {
      const kpis = analytics.getDashboardKPIs();
      const categories = analytics.getCategoryBreakdown();
      const forecast = analytics.getCashFlowForecast(30);

      // Calculate health score (0-100)
      let score = 75;
      if (kpis.revenueGrowthPercent > 10) score += 10;
      else if (kpis.revenueGrowthPercent < -10) score -= 15;

      if (kpis.overdueInvoices.count === 0) score += 10;
      else score -= Math.min(20, kpis.overdueInvoices.count * 5);

      if (forecast.trend === 'growing') score += 5;

      const health = {
        score: Math.min(100, Math.max(20, score)),
        status: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Attention',
        kpis,
        categories,
        forecastTrend: forecast.trend,
        projected30DayRevenue: forecast.projected30DayRevenue,
        recommendations: [
          kpis.overdueInvoices.count > 0
            ? `Follow up on ${kpis.overdueInvoices.count} overdue invoice(s) totaling $${kpis.overdueInvoices.amount.toFixed(2)} to accelerate cash collection.`
            : 'All current invoices are on track with zero overdue receivables.',
          categories.length > 0
            ? `Top revenue category is ${categories[0].category} with $${categories[0].revenue.toFixed(2)} (${categories[0].percentage}%).`
            : 'Diversify product offerings across categories.',
          forecast.trend === 'growing'
            ? `Cash flow trajectory is accelerating upwards at +$${forecast.dailySlope.toFixed(2)}/day.`
            : 'Stabilize daily incoming orders with subscription-based retainers.'
        ]
      };

      return {
        action: {
          type: 'business_health',
          title: `Business Health Score: ${health.score}/100 (${health.status})`,
          data: health
        },
        result: health
      };
    }

    default:
      return {
        action: null,
        result: { error: `Tool ${name} is not recognized.` }
      };
  }
}

/**
 * Fallback intent processor when Gemini API key is missing or encounters network errors
 */
async function fallbackRuleProcessor(message) {
  const lower = message.toLowerCase();
  const actions = [];
  const functionResults = [];
  let text = '';

  if (lower.includes('invoice') && (lower.includes('create') || lower.includes('send') || lower.includes('bill'))) {
    // Extract customer email or name if possible, or create a demo invoice
    const emailMatch = message.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
    const amountMatch = message.match(/\$?([0-9]+(?:\.[0-9]{2})?)/);
    const email = emailMatch ? emailMatch[1] : 'client@example.com';
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 500.00;

    const res = await executeTool('create_invoice', {
      customer_name: 'Client Partner',
      customer_email: email,
      amount: amount,
      description: 'Consulting & Software Services'
    });
    actions.push(res.action);
    functionResults.push(res.result);
    text = `I have created and sent an invoice for $${amount.toFixed(2)} to ${email}. Invoice reference ID: ${res.result.invoice.paypal_invoice_id}.`;
  } else if (lower.includes('invoice') || lower.includes('unpaid') || lower.includes('overdue')) {
    const status = lower.includes('overdue') ? 'OVERDUE' : lower.includes('paid') ? 'PAID' : lower.includes('sent') ? 'SENT' : 'ALL';
    const res = await executeTool('list_invoices', { status, limit: 5 });
    actions.push(res.action);
    functionResults.push(res.result);
    text = `Here are the latest ${status.toLowerCase()} invoices from your records. Found ${res.result.count} invoice(s).`;
  } else if (lower.includes('revenue') || lower.includes('sales') || lower.includes('income')) {
    const period = lower.includes('week') ? 'week' : lower.includes('year') ? 'year' : lower.includes('quarter') ? 'quarter' : 'month';
    const res = await executeTool('get_revenue_summary', { period });
    actions.push(res.action);
    functionResults.push(res.result);
    text = `For this ${period}, your total revenue is $${res.result.periodRevenue.toFixed(2)} across ${res.result.periodTransactions} transaction(s). Overall lifetime revenue stands at $${res.result.lifetimeRevenue.toFixed(2)}.`;
  } else if (lower.includes('payout') || lower.includes('pay vendor') || lower.includes('disburse')) {
    const emailMatch = message.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
    const amountMatch = message.match(/\$?([0-9]+(?:\.[0-9]{2})?)/);
    const email = emailMatch ? emailMatch[1] : 'contractor@example.com';
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 250.00;

    const res = await executeTool('send_payout', {
      recipient_email: email,
      amount: amount,
      note: 'Vendor service payout'
    });
    actions.push(res.action);
    functionResults.push(res.result);
    text = `Dispatched payout of $${amount.toFixed(2)} to ${email} via PayPal Payouts. Batch ID: ${res.result.payout.payoutBatchId}.`;
  } else if (lower.includes('link') || lower.includes('checkout') || lower.includes('payment link')) {
    const amountMatch = message.match(/\$?([0-9]+(?:\.[0-9]{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 150.00;

    const res = await executeTool('create_payment_link', {
      amount: amount,
      description: 'Quick Checkout Payment'
    });
    actions.push(res.action);
    functionResults.push(res.result);
    text = `Generated a secure PayPal payment link for $${amount.toFixed(2)}. Payer can approve at: ${res.result.approvalUrl}`;
  } else if (lower.includes('customer') || lower.includes('client') || lower.includes('insights')) {
    const emailMatch = message.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
    const res = await executeTool('get_customer_insights', { customer_email: emailMatch ? emailMatch[1] : 'all' });
    actions.push(res.action);
    functionResults.push(res.result);
    text = emailMatch
      ? `Retrieved customer insights for ${emailMatch[1]}. Lifetime spend: $${res.result.totalSpent?.toFixed(2) || '0.00'}.`
      : `Here is the spending summary for your top customers.`;
  } else if (lower.includes('health') || lower.includes('kpi') || lower.includes('status') || lower.includes('overview') || lower.includes('forecast')) {
    const res = await executeTool('get_business_health', {});
    actions.push(res.action);
    functionResults.push(res.result);
    text = `Your business health score is currently ${res.result.score}/100 (${res.result.status}). Lifetime revenue: $${res.result.kpis.totalRevenue.toFixed(2)} across ${res.result.kpis.activeCustomers} active customers. 30-day projected revenue: $${res.result.projected30DayRevenue.toFixed(2)}.`;
  } else {
    // Default helpful greeting & summary
    const res = await executeTool('get_business_health', {});
    actions.push(res.action);
    functionResults.push(res.result);
    text = `Hello! I am PayAssist, your commerce AI agent. I can help you create invoices, inspect transactions, view real-time revenue, send PayPal payouts, or analyze cash flow. Current business health is rated ${res.result.status} (${res.result.score}/100). How can I assist you right now?`;
  }

  return { text, actions, functionResults };
}

/**
 * Main AI Agent message processing
 * Uses Gemini 2.0 Flash with real tool calling, falling back gracefully if needed
 */
export async function processMessage(message, sessionId = 'default-session') {
  if (!message || typeof message !== 'string') {
    throw new Error('Message is required and must be a string');
  }

  // Persist user message to SQLite chat_messages
  run(
    `INSERT INTO chat_messages (role, content, created_at) VALUES ('user', ?, ?)`,
    [message, new Date().toISOString()]
  );

  const actions = [];
  const functionResults = [];
  let replyText = '';

  // If Gemini API Key is available, initialize Gemini 2.0 Flash
  if (GEMINI_API_KEY && GEMINI_API_KEY.length > 5) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations }]
      });

      // Retrieve or start chat session
      let chat = sessionChats.get(sessionId);
      if (!chat) {
        chat = model.startChat();
        sessionChats.set(sessionId, chat);
      }

      let response = await chat.sendMessage(message);
      let functionCalls = response.response.functionCalls();

      // Tool call loop (supports up to 4 consecutive tool iterations)
      let iterations = 0;
      while (functionCalls && functionCalls.length > 0 && iterations < 4) {
        iterations++;
        const toolResponses = [];

        for (const call of functionCalls) {
          const { action, result } = await executeTool(call.name, call.args);
          if (action) actions.push(action);
          functionResults.push({ name: call.name, result });

          toolResponses.push({
            functionResponse: {
              name: call.name,
              response: { output: result }
            }
          });
        }

        // Send function execution outputs back to Gemini
        response = await chat.sendMessage(toolResponses);
        functionCalls = response.response.functionCalls();
      }

      replyText = response.response.text();
    } catch (geminiError) {
      console.warn('Gemini 2.0 Flash execution failed, falling back to rule-based agent:', geminiError.message);
      const fallback = await fallbackRuleProcessor(message);
      replyText = fallback.text;
      actions.push(...fallback.actions);
      functionResults.push(...fallback.functionResults);
    }
  } else {
    // Offline / unconfigured API key fallback
    const fallback = await fallbackRuleProcessor(message);
    replyText = fallback.text;
    actions.push(...fallback.actions);
    functionResults.push(...fallback.functionResults);
  }

  // Persist assistant response to SQLite chat_messages
  run(
    `INSERT INTO chat_messages (role, content, created_at) VALUES ('assistant', ?, ?)`,
    [replyText, new Date().toISOString()]
  );

  return {
    text: replyText,
    actions,
    functionResults,
    sessionId
  };
}

export default {
  processMessage
};
