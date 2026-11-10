import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '..', 'dist');

// Route imports
import paypalRouter from './routes/paypal.js';
import transactionsRouter from './routes/transactions.js';
import invoicesRouter from './routes/invoices.js';
import customersRouter from './routes/customers.js';
import agentRouter from './routes/agent.js';
import dashboardRouter from './routes/dashboard.js';
import sentinelRouter from './routes/sentinel.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.url.startsWith('/api/health')) {
      console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PayAssist AI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: {
      paypalConfigured: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
    }
  });
});

// Mount Routes
app.use('/api/paypal', paypalRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/agent', agentRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/sentinel', sentinelRouter);

// 404 Handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Serve compiled static assets if dist exists
if (fs.existsSync(distPath)) {
  // Never cache HTML so users always get the freshest asset URLs
  app.use((req, res, next) => {
    if (req.path === '/' || req.path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });

  // Specific alias for old Vite hash
  app.get('/assets/index-*.css', (req, res) => {
    const fallbackCss = path.join(distPath, 'assets', 'style.css');
    res.type('text/css').sendFile(fallbackCss);
  });

  // Empty CSS fallback for any missing sub-imports to prevent infinite loops
  app.get('/assets/*.css', (req, res, next) => {
    const requestedFile = path.join(distPath, req.path);
    if (fs.existsSync(requestedFile)) {
      res.type('text/css').sendFile(requestedFile);
    } else {
      res.type('text/css').status(200).send('/* Asset not found */');
    }
  });

  app.use(express.static(distPath));

  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) return next();
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start Server after initializing SQLite Database
async function startServer() {
  try {
    console.log('Initializing PayAssist AI Database...');
    await initDb();
    console.log('Database initialized successfully.');

    app.listen(PORT, () => {
      console.log('====================================================');
      console.log(` 🏆 PayAssist AI Server Running on port ${PORT}`);
      console.log(` 🌐 Open Web Application: http://localhost:${PORT}`);
      console.log(` 🩺 Health Check: http://localhost:${PORT}/api/health`);
      console.log(` 💳 PayPal Base: ${process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com'}`);
      console.log(` 🤖 Gemini 2.0 AI: ${process.env.GEMINI_API_KEY ? 'Configured & Online' : 'Offline / Fallback Mode'}`);
      console.log('====================================================');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

export default app;
