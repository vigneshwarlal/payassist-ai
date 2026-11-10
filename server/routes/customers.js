import express from 'express';
import { query, queryOne } from '../db.js';
import analytics from '../services/analytics.js';

const router = express.Router();

/**
 * GET /api/customers/stats/top
 * Top customers ranked by total spend
 */
router.get('/stats/top', (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const top = analytics.getTopCustomers(limit);
    res.json(top);
  } catch (err) {
    console.error('Error fetching top customers:', err);
    res.status(500).json({ error: 'Failed to retrieve top customers' });
  }
});

/**
 * GET /api/customers
 * List all customers with search, status filtering, and sorting
 */
router.get('/', (req, res) => {
  try {
    const {
      search,
      status,
      page = 1,
      limit = 50,
      sort = 'total_spent',
      order = 'DESC'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    if (status && status !== 'ALL') {
      conditions.push('status = ?');
      params.push(status.toLowerCase());
    }

    if (search) {
      conditions.push('(name LIKE ? OR email LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = queryOne(`SELECT COUNT(*) as total FROM customers ${whereClause}`, params);
    const total = countRow ? countRow.total : 0;

    const allowedSortCols = ['total_spent', 'transaction_count', 'name', 'created_at', 'last_purchase'];
    const sortCol = allowedSortCols.includes(sort) ? sort : 'total_spent';
    const sortDir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const customers = query(
      `SELECT * FROM customers ${whereClause} ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    res.json({
      customers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Failed to retrieve customers' });
  }
});

/**
 * GET /api/customers/:id
 * Retrieve single customer with complete transaction & invoice history
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const customer = queryOne(
      `SELECT * FROM customers WHERE id = ? OR email = ?`,
      [id, id]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const transactions = query(
      `SELECT * FROM transactions WHERE customer_email = ? ORDER BY created_at DESC`,
      [customer.email]
    );

    const invoices = query(
      `SELECT * FROM invoices WHERE customer_email = ? ORDER BY created_at DESC`,
      [customer.email]
    );

    const parsedInvoices = invoices.map(inv => {
      let items = [];
      try {
        items = inv.items ? JSON.parse(inv.items) : [];
      } catch (e) {
        items = [];
      }
      return { ...inv, items };
    });

    res.json({
      ...customer,
      transactions,
      invoices: parsedInvoices
    });
  } catch (err) {
    console.error('Error fetching customer details:', err);
    res.status(500).json({ error: 'Failed to retrieve customer details' });
  }
});

export default router;
