import dotenv from 'dotenv';
dotenv.config();

const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || '';

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Get OAuth2 Access Token using Client Credentials Flow
 */
export async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    console.warn('PayPal Client ID or Secret not configured in environment variables.');
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');

  try {
    const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg = data.error_description || data.message || `PayPal OAuth failed: ${res.statusText}`;
      console.error('PayPal OAuth Error:', data);
      throw new Error(errorMsg);
    }

    cachedToken = data.access_token;
    // Cache with 60 second safety buffer
    tokenExpiresAt = Date.now() + ((data.expires_in || 3600) - 60) * 1000;
    return cachedToken;
  } catch (err) {
    console.error('Failed to get PayPal access token:', err.message);
    throw err;
  }
}

/**
 * Generic helper for authenticated PayPal REST API calls
 */
async function paypalRequest(endpoint, options = {}) {
  const token = await getAccessToken();

  const url = endpoint.startsWith('http') ? endpoint : `${PAYPAL_BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 204) {
    return { success: true };
  }

  const contentType = response.headers.get('content-type') || '';
  let responseData = null;

  if (contentType.includes('application/json')) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    const detailMsg = responseData?.details
      ? responseData.details.map(d => `${d.field ? d.field + ': ' : ''}${d.description || d.issue}`).join('; ')
      : responseData?.message || responseData?.error_description || response.statusText;
    
    const err = new Error(`PayPal API Error [${response.status}]: ${detailMsg}`);
    err.status = response.status;
    err.details = responseData;
    throw err;
  }

  return responseData;
}

/**
 * Create a PayPal Order (Orders API v2)
 */
export async function createOrder(amount, description = 'Payment via PayAssist', currency = 'USD') {
  const formattedAmount = Number(amount).toFixed(2);

  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        description: description,
        amount: {
          currency_code: currency,
          value: formattedAmount
        }
      }
    ],
    application_context: {
      brand_name: 'PayAssist AI',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: 'http://localhost:5173/payment/success',
      cancel_url: 'http://localhost:5173/payment/cancel'
    }
  };

  const order = await paypalRequest('/v2/checkout/orders', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  const approvalUrl = order.links?.find(l => l.rel === 'approve')?.href ||
    `https://www.sandbox.paypal.com/checkoutnow?token=${order.id}`;

  return {
    ...order,
    approvalUrl
  };
}

/**
 * Capture payment for an approved order
 */
export async function captureOrder(orderId) {
  if (!orderId) throw new Error('orderId is required');

  return await paypalRequest(`/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    body: JSON.stringify({})
  });
}

/**
 * Create a draft invoice (Invoicing API v2)
 */
export async function createInvoice(invoiceData) {
  const currency = invoiceData.currency || 'USD';
  const amountVal = Number(invoiceData.amount || 0);

  let items = [];
  if (invoiceData.items && Array.isArray(invoiceData.items) && invoiceData.items.length > 0) {
    items = invoiceData.items.map(it => {
      const unitVal = it.unit_amount?.value || it.amount || (amountVal / invoiceData.items.length);
      return {
        name: it.name || invoiceData.description || 'Service',
        quantity: String(it.quantity || '1'),
        unit_amount: {
          currency_code: currency,
          value: Number(unitVal).toFixed(2)
        }
      };
    });
  } else {
    items = [
      {
        name: invoiceData.description || 'Professional Services',
        quantity: '1',
        unit_amount: {
          currency_code: currency,
          value: amountVal.toFixed(2)
        }
      }
    ];
  }

  const totalCalculated = items.reduce(
    (sum, item) => sum + parseFloat(item.unit_amount.value) * parseFloat(item.quantity),
    0
  );

  const payload = {
    detail: {
      invoice_number: invoiceData.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      reference: invoiceData.reference || `REF-${Date.now().toString().slice(-6)}`,
      invoice_date: invoiceData.invoiceDate || new Date().toISOString().split('T')[0],
      currency_code: currency,
      note: invoiceData.description || 'Thank you for your business.',
      payment_term: {
        term_type: 'DUE_ON_DATE_SPECIFIED',
        due_date: invoiceData.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
      }
    },
    invoicer: {
      name: {
        given_name: 'PayAssist',
        surname: 'Commerce'
      },
      email_address: process.env.PAYPAL_MERCHANT_EMAIL || 'merchant@payassist.ai'
    },
    primary_recipients: [
      {
        billing_info: {
          name: {
            given_name: invoiceData.customerName || 'Customer'
          },
          email_address: invoiceData.customerEmail
        }
      }
    ],
    items: items,
    amount: {
      currency_code: currency,
      value: totalCalculated.toFixed(2),
      breakdown: {
        item_total: {
          currency_code: currency,
          value: totalCalculated.toFixed(2)
        }
      }
    }
  };

  const invoice = await paypalRequest('/v2/invoicing/invoices', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return invoice;
}

/**
 * Send an invoice to the recipient
 */
export async function sendInvoice(invoiceId, subject, note) {
  if (!invoiceId) throw new Error('invoiceId is required to send invoice');

  const payload = {
    send_to_recipient: true,
    subject: subject || 'Invoice from PayAssist AI',
    note: note || 'Please review and remit payment at your earliest convenience.'
  };

  const result = await paypalRequest(`/v2/invoicing/invoices/${invoiceId}/send`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return { success: true, invoiceId, result };
}

/**
 * Get details of a specific invoice
 */
export async function getInvoiceDetails(invoiceId) {
  if (!invoiceId) throw new Error('invoiceId is required');
  return await paypalRequest(`/v2/invoicing/invoices/${invoiceId}`, {
    method: 'GET'
  });
}

/**
 * List invoices from PayPal
 */
export async function listInvoices(page = 1, pageSize = 20) {
  return await paypalRequest(`/v2/invoicing/invoices?page=${page}&page_size=${pageSize}&total_required=true`, {
    method: 'GET'
  });
}

/**
 * Send payout via PayPal Payouts API
 */
export async function createPayout(recipientEmail, amount, note = 'Payout from PayAssist AI', currency = 'USD') {
  if (!recipientEmail || !amount) {
    throw new Error('recipientEmail and amount are required');
  }

  const batchId = `Payout_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  const payload = {
    sender_batch_header: {
      sender_batch_id: batchId,
      email_subject: 'You have received a payout from PayAssist AI',
      email_message: note
    },
    items: [
      {
        recipient_type: 'EMAIL',
        amount: {
          value: Number(amount).toFixed(2),
          currency: currency
        },
        note: note,
        sender_item_id: `Item_${Date.now()}`,
        receiver: recipientEmail
      }
    ]
  };

  return await paypalRequest('/v1/payments/payouts', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Create a billing subscription plan
 */
export async function createSubscriptionPlan(name, description = '', amount, interval = 'MONTH', currency = 'USD') {
  if (!name || !amount) {
    throw new Error('Plan name and amount are required');
  }

  // 1. Create catalog product first
  const productPayload = {
    name: name,
    description: description || name,
    type: 'SERVICE',
    category: 'SOFTWARE'
  };

  const product = await paypalRequest('/v1/catalogs/products', {
    method: 'POST',
    body: JSON.stringify(productPayload)
  });

  // 2. Create Plan attached to product
  const planPayload = {
    product_id: product.id,
    name: name,
    description: description || name,
    status: 'ACTIVE',
    billing_cycles: [
      {
        frequency: {
          interval_unit: interval.toUpperCase(),
          interval_count: 1
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: {
            value: Number(amount).toFixed(2),
            currency_code: currency
          }
        }
      }
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: {
        value: '0.00',
        currency_code: currency
      },
      setup_fee_failure_action: 'CONTINUE',
      payment_failure_threshold: 3
    }
  };

  const plan = await paypalRequest('/v1/billing/plans', {
    method: 'POST',
    body: JSON.stringify(planPayload)
  });

  return { product, plan };
}

export default {
  getAccessToken,
  createOrder,
  captureOrder,
  createInvoice,
  sendInvoice,
  getInvoiceDetails,
  listInvoices,
  createPayout,
  createSubscriptionPlan
};
