import { query, queryOne } from '../db.js';

/**
 * Get core dashboard KPI metrics and period-over-period comparisons
 */
export function getDashboardKPIs() {
  // Lifetime completed metrics
  const totalRevRow = queryOne(`
    SELECT COALESCE(SUM(amount), 0) as totalRevenue, COUNT(*) as completedCount
    FROM transactions
    WHERE status = 'COMPLETED'
  `);
  const totalRevenue = totalRevRow ? totalRevRow.totalRevenue : 0;
  const completedCount = totalRevRow ? totalRevRow.completedCount : 0;
  const avgOrderValue = completedCount > 0 ? (totalRevenue / completedCount) : 0;

  // Total customer count
  const custCountRow = queryOne(`
    SELECT COUNT(*) as totalCustomers,
           SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeCustomers
    FROM customers
  `);
  const activeCustomers = custCountRow ? custCountRow.activeCustomers : 0;
  const totalCustomers = custCountRow ? custCountRow.totalCustomers : 0;

  // Invoices summary
  const invoiceStats = queryOne(`
    SELECT 
      COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as paidAmount,
      COALESCE(SUM(CASE WHEN status = 'SENT' THEN amount ELSE 0 END), 0) as pendingAmount,
      COALESCE(SUM(CASE WHEN status = 'OVERDUE' THEN amount ELSE 0 END), 0) as overdueAmount,
      SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) as pendingCount,
      SUM(CASE WHEN status = 'OVERDUE' THEN 1 ELSE 0 END) as overdueCount,
      COUNT(*) as totalInvoices
    FROM invoices
  `);

  // Growth calculation: compare last 30 days vs prior 30 days (days 31-60)
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const recentRevenueRow = queryOne(`
    SELECT COALESCE(SUM(amount), 0) as rev
    FROM transactions
    WHERE status = 'COMPLETED' AND created_at >= ?
  `, [d30]);

  const priorRevenueRow = queryOne(`
    SELECT COALESCE(SUM(amount), 0) as rev
    FROM transactions
    WHERE status = 'COMPLETED' AND created_at >= ? AND created_at < ?
  `, [d60, d30]);

  const currentMonthRev = recentRevenueRow ? recentRevenueRow.rev : 0;
  const priorMonthRev = priorRevenueRow ? priorRevenueRow.rev : 0;
  
  let revenueGrowth = 0;
  if (priorMonthRev > 0) {
    revenueGrowth = Number((((currentMonthRev - priorMonthRev) / priorMonthRev) * 100).toFixed(1));
  } else if (currentMonthRev > 0) {
    revenueGrowth = 100.0;
  }

  return {
    totalRevenue: Number(totalRevenue.toFixed(2)),
    transactionCount: completedCount,
    avgOrderValue: Number(avgOrderValue.toFixed(2)),
    activeCustomers,
    totalCustomers,
    pendingInvoices: {
      amount: Number((invoiceStats?.pendingAmount || 0).toFixed(2)),
      count: invoiceStats?.pendingCount || 0
    },
    overdueInvoices: {
      amount: Number((invoiceStats?.overdueAmount || 0).toFixed(2)),
      count: invoiceStats?.overdueCount || 0
    },
    revenueGrowthPercent: revenueGrowth,
    recent30DaysRevenue: Number(currentMonthRev.toFixed(2))
  };
}

/**
 * Get revenue trend data for charts by period ('week' | 'month' | 'quarter' | 'year')
 */
export function getRevenueByPeriod(period = 'month') {
  const transactions = query(`
    SELECT amount, created_at, category, status
    FROM transactions
    WHERE status = 'COMPLETED'
    ORDER BY created_at ASC
  `);

  const now = new Date();
  let daysBack = 30;
  let grouping = 'day'; // 'day', 'week', 'month'

  if (period === 'week') {
    daysBack = 7;
    grouping = 'day';
  } else if (period === 'month') {
    daysBack = 30;
    grouping = 'day';
  } else if (period === 'quarter') {
    daysBack = 90;
    grouping = 'week';
  } else if (period === 'year') {
    daysBack = 365;
    grouping = 'month';
  }

  const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const filtered = transactions.filter(t => new Date(t.created_at) >= cutoff);

  // Bucket data
  const buckets = new Map();

  // Helper to format keys
  const getKey = (dateStr) => {
    const d = new Date(dateStr);
    if (grouping === 'day') {
      return d.toISOString().split('T')[0];
    } else if (grouping === 'week') {
      // Find start of week (Sunday)
      const copy = new Date(d);
      copy.setDate(d.getDate() - d.getDay());
      return `Week of ${copy.toISOString().split('T')[0]}`;
    } else {
      // Month (e.g. 2026-05)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    }
  };

  // Pre-fill daily buckets if period is week or month for continuous charts
  if (grouping === 'day') {
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      buckets.set(key, { date: key, revenue: 0, transactions: 0 });
    }
  }

  for (const t of filtered) {
    const key = getKey(t.created_at);
    if (!buckets.has(key)) {
      buckets.set(key, { date: key, revenue: 0, transactions: 0 });
    }
    const item = buckets.get(key);
    item.revenue += t.amount;
    item.transactions += 1;
  }

  const result = Array.from(buckets.values()).map(b => ({
    ...b,
    revenue: Number(b.revenue.toFixed(2))
  }));

  // Sort chronologically
  return result;
}

/**
 * Get top customers ranked by lifetime spend
 */
export function getTopCustomers(limit = 5) {
  const safeLimit = Math.max(1, parseInt(limit, 10) || 5);
  return query(`
    SELECT id, name, email, total_spent, transaction_count, first_purchase, last_purchase, status
    FROM customers
    ORDER BY total_spent DESC
    LIMIT ?
  `, [safeLimit]);
}

/**
 * Get breakdown of completed transactions by category
 */
export function getCategoryBreakdown() {
  const rows = query(`
    SELECT category,
           COUNT(*) as count,
           COALESCE(SUM(amount), 0) as revenue
    FROM transactions
    WHERE status = 'COMPLETED'
    GROUP BY category
    ORDER BY revenue DESC
  `);

  const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);

  return rows.map(r => ({
    category: r.category || 'Other',
    count: r.count,
    revenue: Number(r.revenue.toFixed(2)),
    percentage: totalRevenue > 0 ? Number(((r.revenue / totalRevenue) * 100).toFixed(1)) : 0
  }));
}

/**
 * Get unified recent activity feed (transactions & invoices)
 */
export function getRecentActivity(limit = 10) {
  const safeLimit = Math.max(1, parseInt(limit, 10) || 10);

  const trans = query(`
    SELECT id, 'transaction' as type, description as title, customer_name, customer_email,
           amount, currency, status, created_at, category
    FROM transactions
    ORDER BY created_at DESC
    LIMIT ?
  `, [safeLimit]);

  const invoices = query(`
    SELECT id, 'invoice' as type, description as title, customer_name, customer_email,
           amount, currency, status, created_at, paypal_invoice_id
    FROM invoices
    ORDER BY created_at DESC
    LIMIT ?
  `, [safeLimit]);

  const combined = [...trans, ...invoices];
  combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return combined.slice(0, safeLimit);
}

/**
 * Cash flow forecast using linear regression over last 60 days of revenue
 */
export function getCashFlowForecast(forecastDays = 30) {
  const transactions = query(`
    SELECT amount, created_at
    FROM transactions
    WHERE status = 'COMPLETED'
    ORDER BY created_at ASC
  `);

  const now = new Date();
  const past60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const relevant = transactions.filter(t => new Date(t.created_at) >= past60);

  // Group by day for the last 60 days
  const dailyMap = new Map();
  for (let i = 59; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dailyMap.set(d.toISOString().split('T')[0], 0);
  }

  for (const t of relevant) {
    const day = t.created_at.split('T')[0];
    if (dailyMap.has(day)) {
      dailyMap.set(day, dailyMap.get(day) + t.amount);
    }
  }

  const historicalPoints = Array.from(dailyMap.entries()).map(([date, revenue], index) => ({
    x: index,
    date,
    revenue
  }));

  // Linear regression: y = m*x + b
  const n = historicalPoints.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const p of historicalPoints) {
    sumX += p.x;
    sumY += p.revenue;
    sumXY += p.x * p.revenue;
    sumXX += p.x * p.x;
  }

  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  const intercept = denominator !== 0 ? (sumY - slope * sumX) / n : (sumY / (n || 1));

  // Compute standard error for confidence interval
  let sumResidualSquared = 0;
  for (const p of historicalPoints) {
    const predicted = slope * p.x + intercept;
    sumResidualSquared += Math.pow(p.revenue - predicted, 2);
  }
  const stdError = Math.sqrt(sumResidualSquared / Math.max(1, n - 2));

  // Generate forecast points
  const forecast = [];
  let cumulativeForecast = 0;

  for (let i = 1; i <= forecastDays; i++) {
    const futureDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = futureDate.toISOString().split('T')[0];
    const x = n + i - 1;
    const rawVal = slope * x + intercept;
    const predictedVal = Math.max(0, rawVal);
    cumulativeForecast += predictedVal;

    forecast.push({
      date: dateStr,
      predictedRevenue: Number(predictedVal.toFixed(2)),
      lowerBound: Number(Math.max(0, predictedVal - 1.96 * stdError).toFixed(2)),
      upperBound: Number((predictedVal + 1.96 * stdError).toFixed(2)),
      cumulativeRevenue: Number(cumulativeForecast.toFixed(2))
    });
  }

  return {
    trend: slope > 5 ? 'growing' : slope < -5 ? 'declining' : 'steady',
    dailySlope: Number(slope.toFixed(2)),
    averageDailyRevenue: Number((sumY / Math.max(1, n)).toFixed(2)),
    projected30DayRevenue: Number(cumulativeForecast.toFixed(2)),
    forecast
  };
}

export default {
  getDashboardKPIs,
  getRevenueByPeriod,
  getTopCustomers,
  getCategoryBreakdown,
  getRecentActivity,
  getCashFlowForecast
};
