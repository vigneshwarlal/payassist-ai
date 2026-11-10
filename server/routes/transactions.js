import express from 'express';
import { query, queryOne } from '../db.js';

const router = express.Router();

/**
 * GET /api/transactions/stats/summary
 * Aggregate transaction statistics
 */
router.get('/stats/summary', (req, res) => {
  try {
    const totalRow = queryOne(`
      SELECT 
        COUNT(*) as totalCount,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' AND amount > 0 THEN amount ELSE 0 END), 0) as totalRevenue,
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as totalPayouts,
        COALESCE(AVG(CASE WHEN status = 'COMPLETED' AND amount > 0 THEN amount ELSE NULL END), 0) as avgOrderValue
      FROM transactions
    `);

    const statusBreakdown = query(`
      SELECT status, COUNT(*) as count, COALESCE(SUM(amount), 0) as totalAmount
      FROM transactions
      GROUP BY status
    `);

    const categoryBreakdown = query(`
      SELECT category, COUNT(*) as count, COALESCE(SUM(amount), 0) as totalAmount
      FROM transactions
      WHERE status = 'COMPLETED'
      GROUP BY category
      ORDER BY totalAmount DESC
    `);

    res.json({
      totalCount: totalRow?.totalCount || 0,
      totalRevenue: Number((totalRow?.totalRevenue || 0).toFixed(2)),
      totalPayouts: Number((totalRow?.totalPayouts || 0).toFixed(2)),
      avgOrderValue: Number((totalRow?.avgOrderValue || 0).toFixed(2)),
      byStatus: statusBreakdown,
      byCategory: categoryBreakdown
    });
  } catch (err) {
    console.error('Error fetching transaction stats:', err);
    res.status(500).json({ error: 'Failed to fetch transaction stats' });
  }
});

/**
 * GET /api/transactions
 * List all transactions with search, filters, pagination, and sorting
 */
router.get('/', (req, res) => {
  try {
    const {
      status,
      category,
      dateFrom,
      dateTo,
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

    if (category && category !== 'ALL') {
      conditions.push('category = ?');
      params.push(category);
    }

    if (dateFrom) {
      conditions.push('created_at >= ?');
      params.push(dateFrom);
    }

    if (dateTo) {
      conditions.push('created_at <= ?');
      params.push(dateTo + 'T23:59:59');
    }

    if (search) {
      conditions.push('(customer_name LIKE ? OR customer_email LIKE ? OR description LIKE ? OR paypal_order_id LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching
    const countRow = queryOne(`SELECT COUNT(*) as total FROM transactions ${whereClause}`, params);
    const total = countRow ? countRow.total : 0;

    // Allowed sort columns
    const allowedSortCols = ['created_at', 'amount', 'status', 'customer_name', 'category'];
    const sortCol = allowedSortCols.includes(sort) ? sort : 'created_at';
    const sortDir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT id, paypal_order_id, amount, currency, status, customer_name, customer_email, description, category, created_at, updated_at
      FROM transactions
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `;

    const transactions = query(sql, [...params, limitNum, offset]);

    res.json({
      transactions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('Error querying transactions:', err);
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
});

/**
 * GET /api/transactions/:id
 * Retrieve a single transaction by ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const transaction = queryOne(
      `SELECT * FROM transactions WHERE id = ? OR paypal_order_id = ?`,
      [id, id]
    );

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (err) {
    console.error('Error fetching transaction:', err);
    res.status(500).json({ error: 'Failed to retrieve transaction' });
  }
});

export default router;
