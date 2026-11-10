import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, run } from '../db.js';
import paypalService from '../services/paypalService.js';

const router = express.Router();

/**
 * GET /api/invoices
 * List all invoices with filters, search, and pagination
 */
router.get('/', (req, res) => {
  try {
    const {
      status,
      customerEmail,
      search,
      page = 1,
      limit = 50,
      sort = 'created_at',
      order = 'DESC'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    if (status && status !== 'ALL') {
      conditions.push('status = ?');
      params.push(status.toUpperCase());
    }

    if (customerEmail) {
      conditions.push('customer_email = ?');
      params.push(customerEmail);
    }

    if (search) {
      conditions.push('(customer_name LIKE ? OR customer_email LIKE ? OR description LIKE ? OR paypal_invoice_id LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = queryOne(`SELECT COUNT(*) as total FROM invoices ${whereClause}`, params);
    const total = countRow ? countRow.total : 0;

    const allowedSortCols = ['created_at', 'amount', 'status', 'customer_name', 'due_date'];
    const sortCol = allowedSortCols.includes(sort) ? sort : 'created_at';
    const sortDir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const invoicesRaw = query(
      `SELECT * FROM invoices ${whereClause} ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    const invoices = invoicesRaw.map(inv => {
      let items = [];
      try {
        items = inv.items ? JSON.parse(inv.items) : [];
      } catch (e) {
        items = [];
      }
      return { ...inv, items };
    });

    // Summary stats
    const statsRow = queryOne(`
      SELECT 
        COUNT(*) as totalCount,
        COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as paidAmount,
        COALESCE(SUM(CASE WHEN status = 'SENT' THEN amount ELSE 0 END), 0) as pendingAmount,
        COALESCE(SUM(CASE WHEN status = 'OVERDUE' THEN amount ELSE 0 END), 0) as overdueAmount,
        SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paidCount,
        SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) as sentCount,
        SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) as draftCount,
        SUM(CASE WHEN status = 'OVERDUE' THEN 1 ELSE 0 END) as overdueCount
      FROM invoices
    `);

    res.json({
      invoices,
      stats: statsRow,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ error: 'Failed to retrieve invoices' });
  }
});

/**
 * GET /api/invoices/:id
 * Retrieve single invoice
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const invoice = queryOne(
      `SELECT * FROM invoices WHERE id = ? OR paypal_invoice_id = ?`,
      [id, id]
    );

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    let items = [];
    try {
      items = invoice.items ? JSON.parse(invoice.items) : [];
    } catch (e) {
      items = [];
    }

    res.json({ ...invoice, items });
  } catch (err) {
    console.error('Error fetching invoice:', err);
    res.status(500).json({ error: 'Failed to retrieve invoice' });
  }
});

/**
 * POST /api/invoices
 * Create a new invoice locally & on PayPal
 */
router.post('/', async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      amount,
      currency = 'USD',
      description,
      due_date,
      items,
      send_now = false
    } = req.body;

    if (!customer_email || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'customer_email and a valid amount are required' });
    }

    let paypalInvoiceId = `INV2-${Date.now().toString().slice(-8)}`;
    const dueDateStr = due_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    // Attempt PayPal API creation
    try {
      const ppResult = await paypalService.createInvoice({
        customerName: customer_name,
        customerEmail: customer_email,
        amount: Number(amount),
        description: description || 'Professional Services',
        dueDate: dueDateStr,
        items,
        currency
      });

      if (ppResult?.id) {
        paypalInvoiceId = ppResult.id;
        if (send_now) {
          await paypalService.sendInvoice(paypalInvoiceId);
        }
      }
    } catch (ppErr) {
      console.warn('PayPal invoice creation fallback:', ppErr.message);
    }

    const initialStatus = send_now ? 'SENT' : 'DRAFT';
    const invoiceId = uuidv4();
    const nowStr = new Date().toISOString();
    const itemsJson = JSON.stringify(items || [
      {
        name: description || 'Professional Services',
        quantity: 1,
        unit_amount: { currency_code: currency, value: Number(amount).toFixed(2) }
      }
    ]);

    run(
      `INSERT INTO invoices (id, paypal_invoice_id, customer_name, customer_email, amount, currency, status, due_date, description, items, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceId,
        paypalInvoiceId,
        customer_name || 'Valued Client',
        customer_email,
        Number(amount),
        currency,
        initialStatus,
        dueDateStr,
        description || 'Services Rendered',
        itemsJson,
        nowStr,
        nowStr
      ]
    );

    // Upsert customer
    const existingCust = queryOne('SELECT id FROM customers WHERE email = ?', [customer_email]);
    if (!existingCust) {
      run(
        `INSERT INTO customers (id, name, email, total_spent, transaction_count, status, created_at)
         VALUES (?, ?, ?, 0, 0, 'active', ?)`,
        [uuidv4(), customer_name || 'Valued Client', customer_email, nowStr]
      );
    }

    const created = {
      id: invoiceId,
      paypal_invoice_id: paypalInvoiceId,
      customer_name: customer_name || 'Valued Client',
      customer_email,
      amount: Number(amount),
      currency,
      status: initialStatus,
      due_date: dueDateStr,
      description,
      items: items || [],
      created_at: nowStr,
      updated_at: nowStr
    };

    res.status(201).json({
      success: true,
      invoice: created
    });
  } catch (err) {
    console.error('Error creating invoice:', err);
    res.status(500).json({ error: err.message || 'Failed to create invoice' });
  }
});

/**
 * PUT /api/invoices/:id
 * Update an existing invoice
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = queryOne(`SELECT * FROM invoices WHERE id = ? OR paypal_invoice_id = ?`, [id, id]);

    if (!existing) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const {
      customer_name = existing.customer_name,
      customer_email = existing.customer_email,
      amount = existing.amount,
      currency = existing.currency,
      status = existing.status,
      due_date = existing.due_date,
      description = existing.description,
      items
    } = req.body;

    const itemsJson = items ? JSON.stringify(items) : existing.items;
    const nowStr = new Date().toISOString();

    run(
      `UPDATE invoices
       SET customer_name = ?, customer_email = ?, amount = ?, currency = ?, status = ?, due_date = ?, description = ?, items = ?, updated_at = ?
       WHERE id = ?`,
      [customer_name, customer_email, Number(amount), currency, status, due_date, description, itemsJson, nowStr, existing.id]
    );

    const updated = queryOne(`SELECT * FROM invoices WHERE id = ?`, [existing.id]);
    let parsedItems = [];
    try {
      parsedItems = updated.items ? JSON.parse(updated.items) : [];
    } catch (e) {
      parsedItems = [];
    }

    res.json({
      success: true,
      invoice: { ...updated, items: parsedItems }
    });
  } catch (err) {
    console.error('Error updating invoice:', err);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

/**
 * POST /api/invoices/:id/send
 * Mark invoice as SENT and invoke PayPal send
 */
router.post('/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = queryOne(`SELECT * FROM invoices WHERE id = ? OR paypal_invoice_id = ?`, [id, id]);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    try {
      if (invoice.paypal_invoice_id && !invoice.paypal_invoice_id.startsWith('INV2-LOCAL')) {
        await paypalService.sendInvoice(invoice.paypal_invoice_id);
      }
    } catch (err) {
      console.warn('PayPal sendInvoice fallback:', err.message);
    }

    const nowStr = new Date().toISOString();
    run(`UPDATE invoices SET status = 'SENT', updated_at = ? WHERE id = ?`, [nowStr, invoice.id]);

    res.json({
      success: true,
      message: `Invoice ${invoice.paypal_invoice_id || invoice.id} has been marked as SENT`,
      invoiceId: invoice.id,
      status: 'SENT'
    });
  } catch (err) {
    console.error('Error sending invoice:', err);
    res.status(500).json({ error: 'Failed to send invoice' });
  }
});

export default router;
