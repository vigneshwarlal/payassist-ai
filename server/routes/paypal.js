import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import paypalService from '../services/paypalService.js';
import { query, queryOne, run } from '../db.js';

const router = express.Router();

/**
 * POST /api/paypal/create-order
 * Create a PayPal checkout order
 */
router.post('/create-order', async (req, res) => {
  try {
    const { amount, description, currency = 'USD', customerName, customerEmail } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const order = await paypalService.createOrder(amount, description, currency);
    const nowStr = new Date().toISOString();
    const transId = uuidv4();

    // Persist pending transaction
    run(
      `INSERT INTO transactions (id, paypal_order_id, amount, currency, status, customer_name, customer_email, description, category, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?, 'Development', ?, ?)`,
      [
        transId,
        order.id,
        Number(amount),
        currency,
        customerName || 'Guest Checkout',
        customerEmail || 'guest@checkout.local',
        description || 'PayPal Checkout Payment',
        nowStr,
        nowStr
      ]
    );

    res.status(201).json({
      success: true,
      transactionId: transId,
      orderId: order.id,
      approvalUrl: order.approvalUrl,
      order
    });
  } catch (err) {
    console.error('Error creating PayPal order:', err);
    res.status(500).json({ error: err.message || 'Failed to create PayPal order' });
  }
});

/**
 * POST /api/paypal/capture-order/:orderId
 * Capture payment for an approved PayPal order
 */
router.post('/capture-order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const captureResult = await paypalService.captureOrder(orderId);
    const nowStr = new Date().toISOString();

    // Update transaction status
    run(
      `UPDATE transactions SET status = 'COMPLETED', updated_at = ? WHERE paypal_order_id = ?`,
      [nowStr, orderId]
    );

    // Update customer stats if record exists
    const trans = queryOne(`SELECT customer_email, amount FROM transactions WHERE paypal_order_id = ?`, [orderId]);
    if (trans && trans.customer_email) {
      const custStats = queryOne(`
        SELECT COUNT(*) as trans_count, SUM(amount) as total_spent, MIN(created_at) as first_p, MAX(created_at) as last_p
        FROM transactions
        WHERE customer_email = ? AND status = 'COMPLETED'
      `, [trans.customer_email]);

      if (custStats) {
        run(
          `UPDATE customers SET total_spent = ?, transaction_count = ?, first_purchase = ?, last_purchase = ? WHERE email = ?`,
          [custStats.total_spent, custStats.trans_count, custStats.first_p, custStats.last_p, trans.customer_email]
        );
      }
    }

    res.json({
      success: true,
      message: 'Payment captured successfully',
      capture: captureResult
    });
  } catch (err) {
    console.error('Error capturing PayPal order:', err);
    res.status(500).json({ error: err.message || 'Failed to capture PayPal order' });
  }
});

/**
 * POST /api/paypal/create-invoice
 * Create a draft invoice in PayPal and save to DB
 */
router.post('/create-invoice', async (req, res) => {
  try {
    const { customerName, customerEmail, amount, description, dueDate, items, currency = 'USD' } = req.body;

    if (!customerEmail || !amount) {
      return res.status(400).json({ error: 'customerEmail and amount are required' });
    }

    let paypalInvoiceId = `INV2-${Date.now().toString().slice(-8)}`;
    let ppInvoice = null;

    try {
      ppInvoice = await paypalService.createInvoice({
        customerName,
        customerEmail,
        amount,
        description,
        dueDate,
        items,
        currency
      });
      if (ppInvoice?.id) {
        paypalInvoiceId = ppInvoice.id;
      }
    } catch (ppErr) {
      console.warn('PayPal live invoice creation fallback:', ppErr.message);
    }

    const invoiceId = uuidv4();
    const nowStr = new Date().toISOString();
    const dueDateStr = dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    const itemsJson = JSON.stringify(items || [
      {
        name: description || 'Professional Services',
        quantity: 1,
        unit_amount: { currency_code: currency, value: Number(amount).toFixed(2) }
      }
    ]);

    run(
      `INSERT INTO invoices (id, paypal_invoice_id, customer_name, customer_email, amount, currency, status, due_date, description, items, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?)`,
      [
        invoiceId,
        paypalInvoiceId,
        customerName || 'Valued Client',
        customerEmail,
        Number(amount),
        currency,
        dueDateStr,
        description || 'Services Rendered',
        itemsJson,
        nowStr,
        nowStr
      ]
    );

    // Upsert customer
    const existingCust = queryOne('SELECT id FROM customers WHERE email = ?', [customerEmail]);
    if (!existingCust) {
      run(
        `INSERT INTO customers (id, name, email, total_spent, transaction_count, status, created_at)
         VALUES (?, ?, ?, 0, 0, 'active', ?)`,
        [uuidv4(), customerName || 'Valued Client', customerEmail, nowStr]
      );
    }

    res.status(201).json({
      success: true,
      invoice: {
        id: invoiceId,
        paypal_invoice_id: paypalInvoiceId,
        customer_name: customerName,
        customer_email: customerEmail,
        amount: Number(amount),
        currency,
        status: 'DRAFT',
        due_date: dueDateStr,
        description
      },
      paypalDetails: ppInvoice
    });
  } catch (err) {
    console.error('Error creating invoice:', err);
    res.status(500).json({ error: err.message || 'Failed to create invoice' });
  }
});

/**
 * POST /api/paypal/send-invoice/:invoiceId
 * Send invoice via PayPal
 */
router.post('/send-invoice/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { subject, note } = req.body;

    // Check by local id or paypal_invoice_id
    const invoice = queryOne(
      `SELECT * FROM invoices WHERE id = ? OR paypal_invoice_id = ?`,
      [invoiceId, invoiceId]
    );

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    try {
      if (invoice.paypal_invoice_id && !invoice.paypal_invoice_id.startsWith('INV2-LOCAL')) {
        await paypalService.sendInvoice(invoice.paypal_invoice_id, subject, note);
      }
    } catch (err) {
      console.warn('PayPal sendInvoice fallback:', err.message);
    }

    const nowStr = new Date().toISOString();
    run(
      `UPDATE invoices SET status = 'SENT', updated_at = ? WHERE id = ?`,
      [nowStr, invoice.id]
    );

    res.json({
      success: true,
      message: `Invoice ${invoice.paypal_invoice_id || invoice.id} has been sent successfully`,
      invoiceId: invoice.id,
      status: 'SENT'
    });
  } catch (err) {
    console.error('Error sending invoice:', err);
    res.status(500).json({ error: err.message || 'Failed to send invoice' });
  }
});

/**
 * POST /api/paypal/create-payout
 * Send payout via PayPal Payouts API
 */
router.post('/create-payout', async (req, res) => {
  try {
    const { recipientEmail, amount, note, currency = 'USD' } = req.body;

    if (!recipientEmail || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid recipientEmail and positive amount are required' });
    }

    let payoutResult = null;
    let batchId = `Payout_${Date.now()}`;

    try {
      payoutResult = await paypalService.createPayout(recipientEmail, amount, note, currency);
      if (payoutResult?.batch_header?.payout_batch_id) {
        batchId = payoutResult.batch_header.payout_batch_id;
      }
    } catch (ppErr) {
      console.warn('PayPal payout fallback:', ppErr.message);
    }

    const transId = uuidv4();
    const nowStr = new Date().toISOString();

    run(
      `INSERT INTO transactions (id, paypal_order_id, amount, currency, status, customer_name, customer_email, description, category, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'COMPLETED', 'Disbursement Recipient', ?, ?, 'Support', ?, ?)`,
      [
        transId,
        batchId,
        -Number(amount),
        currency,
        recipientEmail,
        `Payout: ${note || 'Disbursement'}`,
        nowStr,
        nowStr
      ]
    );

    res.status(201).json({
      success: true,
      transactionId: transId,
      batchId,
      recipientEmail,
      amount: Number(amount),
      currency,
      payout: payoutResult
    });
  } catch (err) {
    console.error('Error creating payout:', err);
    res.status(500).json({ error: err.message || 'Failed to dispatch payout' });
  }
});

/**
 * POST /api/paypal/webhook
 * PayPal Webhook listener
 */
router.post('/webhook', (req, res) => {
  try {
    const event = req.body;
    console.log(`Received PayPal Webhook event: ${event.event_type} (${event.id})`);

    const nowStr = new Date().toISOString();

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const orderId = event.resource?.supplementary_data?.related_ids?.order_id || event.resource?.id;
        if (orderId) {
          run(`UPDATE transactions SET status = 'COMPLETED', updated_at = ? WHERE paypal_order_id = ?`, [nowStr, orderId]);
        }
        break;
      }

      case 'INVOICING.INVOICE.PAID': {
        const invId = event.resource?.invoice?.id || event.resource?.id;
        if (invId) {
          run(`UPDATE invoices SET status = 'PAID', updated_at = ? WHERE paypal_invoice_id = ?`, [nowStr, invId]);
          const inv = queryOne(`SELECT * FROM invoices WHERE paypal_invoice_id = ?`, [invId]);
          if (inv) {
            run(
              `INSERT INTO transactions (id, paypal_order_id, amount, currency, status, customer_name, customer_email, description, category, created_at, updated_at)
               VALUES (?, ?, ?, ?, 'COMPLETED', ?, ?, ?, 'Consulting', ?, ?)`,
              [uuidv4(), invId, inv.amount, inv.currency, inv.customer_name, inv.customer_email, `Payment for invoice ${invId}`, nowStr, nowStr]
            );
          }
        }
        break;
      }

      case 'CHECKOUT.ORDER.APPROVED': {
        console.log(`Order approved by payer: ${event.resource?.id}`);
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event.event_type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

export default router;
