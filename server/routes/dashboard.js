import express from 'express';
import analytics from '../services/analytics.js';

const router = express.Router();

/**
 * GET /api/dashboard/kpis
 * KPI Cards data (Total Revenue, Transactions, Avg Order, Active Customers, Pending Invoices, Growth)
 */
router.get('/kpis', (req, res) => {
  try {
    const kpis = analytics.getDashboardKPIs();
    res.json(kpis);
  } catch (err) {
    console.error('Error fetching dashboard KPIs:', err);
    res.status(500).json({ error: 'Failed to retrieve dashboard KPIs' });
  }
});

/**
 * GET /api/dashboard/revenue
 * Chart revenue time-series data
 * Query: period = week | month | quarter | year
 */
router.get('/revenue', (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const data = analytics.getRevenueByPeriod(period);
    res.json(data);
  } catch (err) {
    console.error('Error fetching revenue trend:', err);
    res.status(500).json({ error: 'Failed to retrieve revenue chart data' });
  }
});

/**
 * GET /api/dashboard/activity
 * Recent activity feed (transactions & invoices)
 * Query: limit
 */
router.get('/activity', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const activities = analytics.getRecentActivity(limit);
    res.json(activities);
  } catch (err) {
    console.error('Error fetching recent activity:', err);
    res.status(500).json({ error: 'Failed to retrieve recent activity' });
  }
});

/**
 * GET /api/dashboard/categories
 * Revenue breakdown by category
 */
router.get('/categories', (req, res) => {
  try {
    const categories = analytics.getCategoryBreakdown();
    res.json(categories);
  } catch (err) {
    console.error('Error fetching category breakdown:', err);
    res.status(500).json({ error: 'Failed to retrieve category breakdown' });
  }
});

/**
 * GET /api/dashboard/forecast
 * Cash flow forecast & projection
 */
router.get('/forecast', (req, res) => {
  try {
    const { days = 30 } = req.query;
    const forecast = analytics.getCashFlowForecast(parseInt(days, 10) || 30);
    res.json(forecast);
  } catch (err) {
    console.error('Error fetching forecast:', err);
    res.status(500).json({ error: 'Failed to retrieve cash flow forecast' });
  }
});

export default router;
