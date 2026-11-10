import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '..', 'data', 'payassist.db');

let db = null;

export async function initDb(forceSeed = false) {
  if (db && !forceSeed) {
    return db;
  }

  const SQL = await initSqlJs();
  const dir = dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Load existing db or create new
  if (fs.existsSync(DB_PATH) && !forceSeed) {
    try {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } catch (err) {
      console.warn('Could not read existing database, creating a fresh one:', err.message);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Create tables
  createTables();

  // Check if seeding is needed
  const transCount = queryOne('SELECT COUNT(*) as count FROM transactions');
  if (forceSeed || !transCount || transCount.count === 0) {
    console.log('Seeding database with realistic initial data...');
    seedDatabase();
  }

  saveDb();
  console.log(`Database initialized at ${DB_PATH}`);
  return db;
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      paypal_order_id TEXT,
      amount REAL,
      currency TEXT DEFAULT 'USD',
      status TEXT,
      customer_name TEXT,
      customer_email TEXT,
      description TEXT,
      category TEXT,
      created_at TEXT,
      updated_at TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      paypal_invoice_id TEXT,
      customer_name TEXT,
      customer_email TEXT,
      amount REAL,
      currency TEXT DEFAULT 'USD',
      status TEXT,
      due_date TEXT,
      description TEXT,
      items TEXT,
      created_at TEXT,
      updated_at TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      total_spent REAL DEFAULT 0,
      transaction_count INTEGER DEFAULT 0,
      first_purchase TEXT,
      last_purchase TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT,
      content TEXT,
      created_at TEXT
    );
  `);
}

export function saveDb() {
  if (!db) return;
  const dir = dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export function getDb() {
  if (!db) {
    throw new Error('Database has not been initialized. Call initDb() first.');
  }
  return db;
}

export function query(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function queryOne(sql, params = []) {
  const rows = query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function run(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  if (params && params.length > 0) {
    db.run(sql, params);
  } else {
    db.run(sql);
  }
  const changes = db.getRowsModified();
  saveDb();
  return { changes };
}

function daysAgo(days, hour = 12) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), 0);
  return d.toISOString();
}

function daysAhead(days, hour = 12) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

export function seedDatabase() {
  // Clear any existing records if reseeding
  db.run('DELETE FROM transactions');
  db.run('DELETE FROM invoices');
  db.run('DELETE FROM customers');
  db.run('DELETE FROM chat_messages');

  const customers = [
    {
      id: uuidv4(),
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@techcorp.io',
      status: 'active',
      created_at: daysAgo(175)
    },
    {
      id: uuidv4(),
      name: 'Marcus Vance',
      email: 'marcus.vance@nexusinno.com',
      status: 'active',
      created_at: daysAgo(160)
    },
    {
      id: uuidv4(),
      name: 'Elena Rostova',
      email: 'elena.rostova@apexmedia.org',
      status: 'active',
      created_at: daysAgo(150)
    },
    {
      id: uuidv4(),
      name: 'David Keller',
      email: 'david.keller@blueskycargo.com',
      status: 'active',
      created_at: daysAgo(140)
    },
    {
      id: uuidv4(),
      name: 'Dr. Aravind Patel',
      email: 'dr.aravind@quantumdyn.com',
      status: 'active',
      created_at: daysAgo(130)
    },
    {
      id: uuidv4(),
      name: 'Chloe Bennett',
      email: 'chloe.bennett@stellarcreate.com',
      status: 'active',
      created_at: daysAgo(115)
    },
    {
      id: uuidv4(),
      name: 'Liam Thornton',
      email: 'liam.thornton@horizonretail.com',
      status: 'active',
      created_at: daysAgo(100)
    },
    {
      id: uuidv4(),
      name: 'Amanda Foster',
      email: 'amanda.foster@vanguardcloud.net',
      status: 'active',
      created_at: daysAgo(85)
    },
    {
      id: uuidv4(),
      name: 'Robert Sterling',
      email: 'robert.sterling@elevateconsult.biz',
      status: 'active',
      created_at: daysAgo(70)
    },
    {
      id: uuidv4(),
      name: 'Priya Sharma',
      email: 'priya.sharma@brightpathed.org',
      status: 'active',
      created_at: daysAgo(55)
    },
    {
      id: uuidv4(),
      name: 'Nathan Drake',
      email: 'nathan.drake@swiftscale.io',
      status: 'active',
      created_at: daysAgo(40)
    },
    {
      id: uuidv4(),
      name: 'Rachel Adams',
      email: 'rachel.adams@crestviewhealth.com',
      status: 'inactive',
      created_at: daysAgo(165)
    }
  ];

  for (const c of customers) {
    db.run(
      `INSERT INTO customers (id, name, email, total_spent, transaction_count, first_purchase, last_purchase, status, created_at)
       VALUES (?, ?, ?, 0, 0, NULL, NULL, ?, ?)`,
      [c.id, c.name, c.email, c.status, c.created_at]
    );
  }

  const rawTransactions = [
    {
      customerIndex: 0,
      amount: 2800.00,
      status: 'COMPLETED',
      category: 'Development',
      desc: 'Enterprise Cloud Portal Microservices Architecture',
      daysAgo: 170
    },
    {
      customerIndex: 1,
      amount: 1450.00,
      status: 'COMPLETED',
      category: 'Web Design',
      desc: 'UI/UX Redesign & Interactive Component Library',
      daysAgo: 158
    },
    {
      customerIndex: 2,
      amount: 3200.00,
      status: 'COMPLETED',
      category: 'Marketing',
      desc: 'Full Omnichannel Q3 Marketing & PPC Launch',
      daysAgo: 148
    },
    {
      customerIndex: 3,
      amount: 750.00,
      status: 'COMPLETED',
      category: 'Support',
      desc: 'Monthly SLA 24/7 Infrastructure Monitoring & Support',
      daysAgo: 138
    },
    {
      customerIndex: 4,
      amount: 4500.00,
      status: 'COMPLETED',
      category: 'Consulting',
      desc: 'AI Workflow Integration & Technical Feasibility Audit',
      daysAgo: 128
    },
    {
      customerIndex: 0,
      amount: 1850.00,
      status: 'COMPLETED',
      category: 'Development',
      desc: 'Automated CI/CD Pipeline & Security Hardening',
      daysAgo: 120
    },
    {
      customerIndex: 5,
      amount: 980.00,
      status: 'COMPLETED',
      category: 'Web Design',
      desc: 'Brand Identity Package, Logo & Typography System',
      daysAgo: 112
    },
    {
      customerIndex: 6,
      amount: 2400.00,
      status: 'COMPLETED',
      category: 'Development',
      desc: 'E-commerce Checkout Gateway & PayPal Fastlane Integration',
      daysAgo: 98
    },
    {
      customerIndex: 7,
      amount: 3600.00,
      status: 'COMPLETED',
      category: 'Consulting',
      desc: 'Cloud Infrastructure Migration & Multi-region Failover',
      daysAgo: 82
    },
    {
      customerIndex: 2,
      amount: 1250.00,
      status: 'COMPLETED',
      category: 'Marketing',
      desc: 'SEO Optimization, Technical Audit & Content Strategy',
      daysAgo: 78
    },
    {
      customerIndex: 8,
      amount: 1950.00,
      status: 'COMPLETED',
      category: 'Consulting',
      desc: 'Strategic Business Model & Pricing Architecture Advisory',
      daysAgo: 68
    },
    {
      customerIndex: 9,
      amount: 1100.00,
      status: 'COMPLETED',
      category: 'Development',
      desc: 'LMS Student Portal Custom Features & Gradebook API',
      daysAgo: 52
    },
    {
      customerIndex: 3,
      amount: 750.00,
      status: 'COMPLETED',
      category: 'Support',
      desc: 'Monthly SLA Infrastructure Support & Log Analysis',
      daysAgo: 48
    },
    {
      customerIndex: 1,
      amount: 2100.00,
      status: 'COMPLETED',
      category: 'Development',
      desc: 'AI Assistant Backend & Embeddings Search Engine',
      daysAgo: 45
    },
    {
      customerIndex: 10,
      amount: 1650.00,
      status: 'COMPLETED',
      category: 'Web Design',
      desc: 'Responsive Landing Page & A/B Funnel Optimization',
      daysAgo: 38
    },
    {
      customerIndex: 4,
      amount: 3800.00,
      status: 'COMPLETED',
      category: 'Consulting',
      desc: 'Quantum Algorithm Optimization & High Performance Compute',
      daysAgo: 32
    },
    {
      customerIndex: 0,
      amount: 3400.00,
      status: 'COMPLETED',
      category: 'Development',
      desc: 'Payment Orchestration System & Stripe/PayPal Dual Routing',
      daysAgo: 26
    },
    {
      customerIndex: 5,
      amount: 1350.00,
      status: 'COMPLETED',
      category: 'Marketing',
      desc: 'Social Media Growth Sprint & Retargeting Setup',
      daysAgo: 22
    },
    {
      customerIndex: 7,
      amount: 2900.00,
      status: 'COMPLETED',
      category: 'Consulting',
      desc: 'Zero-Trust Architecture Implementation & SOC2 Compliance',
      daysAgo: 19
    },
    {
      customerIndex: 6,
      amount: 850.00,
      status: 'COMPLETED',
      category: 'Support',
      desc: 'Emergency Hotfix Support & Database Tuning',
      daysAgo: 16
    },
    {
      customerIndex: 8,
      amount: 2200.00,
      status: 'COMPLETED',
      category: 'Consulting',
      desc: 'Executive Strategy Roadmap & Q4 Growth Planning',
      daysAgo: 14
    },
    {
      customerIndex: 10,
      amount: 2750.00,
      status: 'COMPLETED',
      category: 'Development',
      desc: 'Agentic Workflow Engine & Tool Calling Framework',
      daysAgo: 11
    },
    {
      customerIndex: 3,
      amount: 750.00,
      status: 'COMPLETED',
      category: 'Support',
      desc: 'Monthly Maintenance & Continuous Availability SLA',
      daysAgo: 8
    },
    {
      customerIndex: 9,
      amount: 1400.00,
      status: 'COMPLETED',
      category: 'Development',
      desc: 'Interactive Quiz Builder & Analytics Dashboard',
      daysAgo: 6
    },
    {
      customerIndex: 1,
      amount: 1750.00,
      status: 'COMPLETED',
      category: 'Marketing',
      desc: 'Global Search Engine Marketing & Conversion Setup',
      daysAgo: 4
    },
    {
      customerIndex: 2,
      amount: 2950.00,
      status: 'COMPLETED',
      category: 'Web Design',
      desc: 'Next-Gen Interactive 3D Web Experience',
      daysAgo: 3
    },
    {
      customerIndex: 4,
      amount: 4200.00,
      status: 'COMPLETED',
      category: 'Consulting',
      desc: 'Advanced Predictive Modeling & Machine Learning Review',
      daysAgo: 1
    },
    // Pending transactions
    {
      customerIndex: 0,
      amount: 3100.00,
      status: 'PENDING',
      category: 'Development',
      desc: 'Multi-Tenant Auth Migration & Session Manager',
      daysAgo: 1
    },
    {
      customerIndex: 5,
      amount: 1200.00,
      status: 'PENDING',
      category: 'Web Design',
      desc: 'Mobile App Wireframes & Figma Prototype',
      daysAgo: 2
    },
    {
      customerIndex: 8,
      amount: 2500.00,
      status: 'PENDING',
      category: 'Consulting',
      desc: 'Enterprise Digital Transformation Sprint 1',
      daysAgo: 0
    },
    {
      customerIndex: 10,
      amount: 800.00,
      status: 'PENDING',
      category: 'Support',
      desc: 'Dedicated On-Call Developer Hours - November',
      daysAgo: 0
    },
    // Failed transactions
    {
      customerIndex: 11,
      amount: 1500.00,
      status: 'FAILED',
      category: 'Development',
      desc: 'Card Declined - Health Portal API Webhook Integration',
      daysAgo: 120
    },
    {
      customerIndex: 6,
      amount: 650.00,
      status: 'FAILED',
      category: 'Support',
      desc: 'Payment Expired - Urgent Weekend Bugfix Support',
      daysAgo: 42
    },
    // Refunded transactions
    {
      customerIndex: 11,
      amount: 1800.00,
      status: 'REFUNDED',
      category: 'Consulting',
      desc: 'Patient Intake Workflow Review (Cancelled by Client)',
      daysAgo: 145
    },
    {
      customerIndex: 7,
      amount: 450.00,
      status: 'REFUNDED',
      category: 'Support',
      desc: 'Overbilled Hours Adjustment for Infrastructure Audit',
      daysAgo: 60
    }
  ];

  // Helper for random PayPal order ID
  const generateOrderId = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let id = '';
    for (let i = 0; i < 17; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  };

  for (const t of rawTransactions) {
    const cust = customers[t.customerIndex];
    const createdAt = daysAgo(t.daysAgo);
    const transId = uuidv4();
    const orderId = generateOrderId();

    db.run(
      `INSERT INTO transactions (id, paypal_order_id, amount, currency, status, customer_name, customer_email, description, category, created_at, updated_at)
       VALUES (?, ?, ?, 'USD', ?, ?, ?, ?, ?, ?, ?)`,
      [
        transId,
        orderId,
        t.amount,
        t.status,
        cust.name,
        cust.email,
        t.desc,
        t.category,
        createdAt,
        createdAt
      ]
    );
  }

  // Update customer totals and purchase dates from completed transactions
  const custStats = query(`
    SELECT customer_email,
           COUNT(*) as trans_count,
           SUM(amount) as total_spent,
           MIN(created_at) as first_purchase,
           MAX(created_at) as last_purchase
    FROM transactions
    WHERE status = 'COMPLETED'
    GROUP BY customer_email
  `);

  for (const stat of custStats) {
    db.run(
      `UPDATE customers
       SET total_spent = ?, transaction_count = ?, first_purchase = ?, last_purchase = ?
       WHERE email = ?`,
      [stat.total_spent, stat.trans_count, stat.first_purchase, stat.last_purchase, stat.customer_email]
    );
  }

  // Seed Invoices (18 realistic invoices)
  const rawInvoices = [
    {
      customerIndex: 0,
      amount: 2800.00,
      status: 'PAID',
      dueDate: daysAgo(156).split('T')[0],
      createdAt: daysAgo(170),
      desc: 'Enterprise Cloud Portal Microservices Architecture',
      items: [
        { name: 'Architecture Blueprint', quantity: 1, unit_amount: { currency_code: 'USD', value: '1800.00' } },
        { name: 'Microservice Boilerplate & Docker Config', quantity: 1, unit_amount: { currency_code: 'USD', value: '1000.00' } }
      ]
    },
    {
      customerIndex: 1,
      amount: 1450.00,
      status: 'PAID',
      dueDate: daysAgo(144).split('T')[0],
      createdAt: daysAgo(158),
      desc: 'UI/UX Redesign & Interactive Component Library',
      items: [
        { name: 'Figma Design System', quantity: 1, unit_amount: { currency_code: 'USD', value: '850.00' } },
        { name: 'Tailwind CSS Component Implementation', quantity: 1, unit_amount: { currency_code: 'USD', value: '600.00' } }
      ]
    },
    {
      customerIndex: 2,
      amount: 3200.00,
      status: 'PAID',
      dueDate: daysAgo(134).split('T')[0],
      createdAt: daysAgo(148),
      desc: 'Full Omnichannel Q3 Marketing & PPC Launch',
      items: [
        { name: 'Google Ads & Meta Retargeting Campaign', quantity: 1, unit_amount: { currency_code: 'USD', value: '2200.00' } },
        { name: 'Creative Copywriting & Ad Assets', quantity: 1, unit_amount: { currency_code: 'USD', value: '1000.00' } }
      ]
    },
    {
      customerIndex: 4,
      amount: 4500.00,
      status: 'PAID',
      dueDate: daysAgo(114).split('T')[0],
      createdAt: daysAgo(128),
      desc: 'AI Workflow Integration & Technical Feasibility Audit',
      items: [
        { name: 'Feasibility Report & Benchmarks', quantity: 1, unit_amount: { currency_code: 'USD', value: '2500.00' } },
        { name: 'Prototype Implementation & Gemini 2.0 Integration', quantity: 1, unit_amount: { currency_code: 'USD', value: '2000.00' } }
      ]
    },
    {
      customerIndex: 6,
      amount: 2400.00,
      status: 'PAID',
      dueDate: daysAgo(84).split('T')[0],
      createdAt: daysAgo(98),
      desc: 'E-commerce Checkout Gateway & PayPal Fastlane Integration',
      items: [
        { name: 'Checkout Frontend Integration', quantity: 1, unit_amount: { currency_code: 'USD', value: '1400.00' } },
        { name: 'Webhook & Order Sync Services', quantity: 1, unit_amount: { currency_code: 'USD', value: '1000.00' } }
      ]
    },
    {
      customerIndex: 7,
      amount: 3600.00,
      status: 'PAID',
      dueDate: daysAgo(68).split('T')[0],
      createdAt: daysAgo(82),
      desc: 'Cloud Infrastructure Migration & Multi-region Failover',
      items: [
        { name: 'Terraform Scripts & AWS Setup', quantity: 1, unit_amount: { currency_code: 'USD', value: '2400.00' } },
        { name: 'Load Balancer & Route53 Geo-Routing', quantity: 1, unit_amount: { currency_code: 'USD', value: '1200.00' } }
      ]
    },
    {
      customerIndex: 8,
      amount: 1950.00,
      status: 'PAID',
      dueDate: daysAgo(54).split('T')[0],
      createdAt: daysAgo(68),
      desc: 'Strategic Business Model & Pricing Architecture Advisory',
      items: [
        { name: 'Executive Strategy Workshop', quantity: 1, unit_amount: { currency_code: 'USD', value: '1200.00' } },
        { name: 'Financial Model & SaaS Packaging Deck', quantity: 1, unit_amount: { currency_code: 'USD', value: '750.00' } }
      ]
    },
    {
      customerIndex: 1,
      amount: 2100.00,
      status: 'PAID',
      dueDate: daysAgo(31).split('T')[0],
      createdAt: daysAgo(45),
      desc: 'AI Assistant Backend & Embeddings Search Engine',
      items: [
        { name: 'Vector DB Setup & Chunking Pipeline', quantity: 1, unit_amount: { currency_code: 'USD', value: '1300.00' } },
        { name: 'Express API & Agent Endpoints', quantity: 1, unit_amount: { currency_code: 'USD', value: '800.00' } }
      ]
    },
    {
      customerIndex: 0,
      amount: 3400.00,
      status: 'PAID',
      dueDate: daysAgo(12).split('T')[0],
      createdAt: daysAgo(26),
      desc: 'Payment Orchestration System & Stripe/PayPal Dual Routing',
      items: [
        { name: 'Smart Routing Logic & Fallback Handler', quantity: 1, unit_amount: { currency_code: 'USD', value: '2000.00' } },
        { name: 'Reconciliation Service & Admin View', quantity: 1, unit_amount: { currency_code: 'USD', value: '1400.00' } }
      ]
    },
    {
      customerIndex: 4,
      amount: 4200.00,
      status: 'PAID',
      dueDate: daysAgo(2).split('T')[0],
      createdAt: daysAgo(16),
      desc: 'Advanced Predictive Modeling & Machine Learning Review',
      items: [
        { name: 'Predictive Model Training & Evaluation', quantity: 1, unit_amount: { currency_code: 'USD', value: '2800.00' } },
        { name: 'Production Inference API Packaging', quantity: 1, unit_amount: { currency_code: 'USD', value: '1400.00' } }
      ]
    },
    // SENT invoices (waiting for payment)
    {
      customerIndex: 3,
      amount: 750.00,
      status: 'SENT',
      dueDate: daysAhead(14),
      createdAt: daysAgo(2),
      desc: 'Monthly SLA Infrastructure Support - November',
      items: [
        { name: 'November SLA Retainer & Incident Response', quantity: 1, unit_amount: { currency_code: 'USD', value: '750.00' } }
      ]
    },
    {
      customerIndex: 10,
      amount: 2750.00,
      status: 'SENT',
      dueDate: daysAhead(18),
      createdAt: daysAgo(3),
      desc: 'Agentic Workflow Engine & Tool Calling Framework',
      items: [
        { name: 'Tool Calling Runtime Engine', quantity: 1, unit_amount: { currency_code: 'USD', value: '1750.00' } },
        { name: 'Session Memory & Context Manager', quantity: 1, unit_amount: { currency_code: 'USD', value: '1000.00' } }
      ]
    },
    {
      customerIndex: 5,
      amount: 1600.00,
      status: 'SENT',
      dueDate: daysAhead(21),
      createdAt: daysAgo(4),
      desc: 'Brand Campaign Assets & Video Motion Graphics',
      items: [
        { name: 'Promo Video Animation (30s & 60s)', quantity: 2, unit_amount: { currency_code: 'USD', value: '800.00' } }
      ]
    },
    {
      customerIndex: 8,
      amount: 2500.00,
      status: 'SENT',
      dueDate: daysAhead(25),
      createdAt: daysAgo(1),
      desc: 'Enterprise Digital Transformation Sprint 1',
      items: [
        { name: 'Legacy System Audit & Gap Analysis', quantity: 1, unit_amount: { currency_code: 'USD', value: '1500.00' } },
        { name: 'Target Modernization Architecture', quantity: 1, unit_amount: { currency_code: 'USD', value: '1000.00' } }
      ]
    },
    // DRAFT invoices
    {
      customerIndex: 9,
      amount: 1850.00,
      status: 'DRAFT',
      dueDate: daysAhead(30),
      createdAt: daysAgo(1),
      desc: 'Custom Student Analytics & Progress Tracking Portal',
      items: [
        { name: 'Analytics Dashboard Views', quantity: 1, unit_amount: { currency_code: 'USD', value: '1100.00' } },
        { name: 'CSV & PDF Export Automation', quantity: 1, unit_amount: { currency_code: 'USD', value: '750.00' } }
      ]
    },
    {
      customerIndex: 0,
      amount: 3100.00,
      status: 'DRAFT',
      dueDate: daysAhead(30),
      createdAt: daysAgo(0),
      desc: 'Multi-Tenant Auth Migration & Session Manager',
      items: [
        { name: 'OAuth2 / OIDC Auth Provider Setup', quantity: 1, unit_amount: { currency_code: 'USD', value: '1900.00' } },
        { name: 'Role Based Access Control (RBAC) Module', quantity: 1, unit_amount: { currency_code: 'USD', value: '1200.00' } }
      ]
    },
    // OVERDUE invoices
    {
      customerIndex: 6,
      amount: 1550.00,
      status: 'OVERDUE',
      dueDate: daysAgo(15).split('T')[0],
      createdAt: daysAgo(45),
      desc: 'Mobile Responsive Audit & Speed Optimization',
      items: [
        { name: 'Core Web Vitals Remediation', quantity: 1, unit_amount: { currency_code: 'USD', value: '1000.00' } },
        { name: 'Image Compression & CDN Pipeline', quantity: 1, unit_amount: { currency_code: 'USD', value: '550.00' } }
      ]
    },
    {
      customerIndex: 11,
      amount: 2200.00,
      status: 'OVERDUE',
      dueDate: daysAgo(28).split('T')[0],
      createdAt: daysAgo(60),
      desc: 'Telehealth Integration & Patient Video Chat Module',
      items: [
        { name: 'WebRTC Video Consultation Room', quantity: 1, unit_amount: { currency_code: 'USD', value: '1400.00' } },
        { name: 'HIPAA Compliance Security Audit', quantity: 1, unit_amount: { currency_code: 'USD', value: '800.00' } }
      ]
    }
  ];

  for (let i = 0; i < rawInvoices.length; i++) {
    const inv = rawInvoices[i];
    const cust = customers[inv.customerIndex];
    const invoiceId = uuidv4();
    const paypalInvId = `INV2-9X${1000 + i}-772L-5Q4P-${2000 + i}`;

    db.run(
      `INSERT INTO invoices (id, paypal_invoice_id, customer_name, customer_email, amount, currency, status, due_date, description, items, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'USD', ?, ?, ?, ?, ?, ?)`,
      [
        invoiceId,
        paypalInvId,
        cust.name,
        cust.email,
        inv.amount,
        inv.status,
        inv.dueDate,
        inv.desc,
        JSON.stringify(inv.items),
        inv.createdAt,
        inv.createdAt
      ]
    );
  }

  // Initial welcome message in chat_messages
  db.run(
    `INSERT INTO chat_messages (role, content, created_at)
     VALUES ('assistant', 'Hello! I am PayAssist, your AI commerce agent. I can help you create and send PayPal invoices, inspect revenue and cash flow, query transactions, issue payouts, and give business health recommendations. What would you like to do today?', ?)`,
    [new Date().toISOString()]
  );
}
