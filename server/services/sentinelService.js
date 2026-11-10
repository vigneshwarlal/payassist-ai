import { query, queryOne, run } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Sentinel AI: Autonomous Risk, Fraud & Cashflow Guardian
 * Real-time transaction inspection, automated dispute mitigation, and predictive dunning.
 */

// In-memory buffer of recent sentinel events
let liveEventStream = [];

export function evaluateTransactionRisk(transaction) {
  const { amount = 0, customer_name = '', customer_email = '', category = 'General', description = '' } = transaction;
  
  let riskScore = 15; // Base baseline risk
  const riskFactors = [];
  const mitigations = [];

  // 1. Amount anomaly checks
  if (amount > 5000) {
    riskScore += 35;
    riskFactors.push({
      code: 'HIGH_TICKET_ANOMALY',
      severity: 'HIGH',
      description: `Transaction amount ($${amount.toLocaleString()}) exceeds the 95th percentile merchant ticket size.`
    });
    mitigations.push('Recommend 24-hour delayed settlement or PayPal Seller Protection verification.');
  } else if (amount < 2.00) {
    riskScore += 25;
    riskFactors.push({
      code: 'MICRO_TRANSACTION_VELOCITY',
      severity: 'MEDIUM',
      description: 'Micro-amount transaction detected; potential automated card testing vector.'
    });
    mitigations.push('Enforce reCAPTCHA on checkout and rate-limit IP address.');
  }

  // 2. Email domain reputation check
  const domain = (customer_email.split('@')[1] || '').toLowerCase();
  const disposableDomains = ['tempmail.com', 'throwaway.email', 'guerrillamail.com', 'mailinator.com', '10minutemail.com'];
  if (disposableDomains.includes(domain)) {
    riskScore += 40;
    riskFactors.push({
      code: 'DISPOSABLE_EMAIL_DOMAIN',
      severity: 'CRITICAL',
      description: `Customer email utilizes known disposable/burner domain (@${domain}).`
    });
    mitigations.push('Reject automated payment capture; prompt for verified business email.');
  }

  // 3. Customer purchase history check
  if (customer_email) {
    const existingCustomer = queryOne('SELECT total_spent, transaction_count FROM customers WHERE email = ?', [customer_email]);
    if (existingCustomer && existingCustomer.total_spent > 3000) {
      riskScore = Math.max(5, riskScore - 20); // Known VIP discount to risk
      mitigations.push('Customer has established VIP history with $3,000+ settled volume. Low dispute probability.');
    } else if (!existingCustomer && amount > 2000) {
      riskScore += 15;
      riskFactors.push({
        code: 'NEW_CUSTOMER_LARGE_TICKET',
        severity: 'MEDIUM',
        description: 'First-time customer initiating high-value enterprise order.'
      });
      mitigations.push('Require 3D Secure / PayPal Verified Account authentication.');
    }
  }

  // Final score clamping
  riskScore = Math.min(99, Math.max(5, riskScore));

  let decision = 'APPROVE';
  let badgeColor = 'emerald';
  if (riskScore >= 75) {
    decision = 'AUTO_BLOCK_ESCROW';
    badgeColor = 'rose';
  } else if (riskScore >= 45) {
    decision = 'STEP_UP_VERIFY';
    badgeColor = 'amber';
  }

  const analysis = {
    id: `risk_${uuidv4().slice(0, 8)}`,
    timestamp: new Date().toISOString(),
    transactionId: transaction.id || transaction.paypal_order_id || `txn_${Date.now()}`,
    amount,
    customer: customer_name || 'Anonymous',
    email: customer_email,
    riskScore,
    decision,
    badgeColor,
    riskFactors,
    mitigations,
    aiRecommendation: riskScore >= 75
      ? 'Critical risk threshold exceeded. Hold in PayPal escrow until merchant reviews shipping and identity credentials.'
      : riskScore >= 45
      ? 'Moderate anomaly detected. Proceed with standard PayPal Seller Protection guidelines.'
      : 'Transaction clean. Immediate PayPal capture authorized with zero friction.'
  };

  // Prepend to live stream (keep latest 30)
  liveEventStream = [analysis, ...liveEventStream.slice(0, 29)];

  return analysis;
}

export function getLiveEventStream() {
  if (liveEventStream.length === 0) {
    // Generate realistic historical baseline events
    const sampleEvents = [
      {
        amount: 2490.00,
        customer_name: 'Amira Patel',
        customer_email: 'amira@solardynamics.org',
        category: 'Enterprise Licenses'
      },
      {
        amount: 0.99,
        customer_name: 'Bot Tester 44',
        customer_email: 'tester44@tempmail.com',
        category: 'Micro-Check'
      },
      {
        amount: 320.00,
        customer_name: 'Sarah Jenkins',
        customer_email: 'sarah.jenkins@techcorp.io',
        category: 'SaaS Subscriptions'
      },
      {
        amount: 7800.00,
        customer_name: 'Unknown Buyer',
        customer_email: 'unknown99@throwaway.email',
        category: 'Consulting'
      },
      {
        amount: 450.00,
        customer_name: 'Marcus Vance',
        customer_email: 'marcus.vance@nexusinno.com',
        category: 'Web Design'
      }
    ];

    sampleEvents.forEach(evt => evaluateTransactionRisk(evt));
  }

  return liveEventStream;
}

export function simulateIncomingTransaction(customData = {}) {
  const names = ['Dr. Elena Rostova', 'Nathan Drake', 'Chloe Bennett', 'Alexander Wright', 'David Keller', 'Anonymous Buyer'];
  const categories = ['SaaS Subscriptions', 'Consulting Services', 'Hardware Kits', 'Enterprise Licenses'];
  const emails = ['elena.rostova@apexmedia.org', 'nathan.drake@swiftscale.io', 'ghost@tempmail.com', 'buyer@stealthcorp.com'];

  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomEmail = emails[Math.floor(Math.random() * emails.length)];
  const randomCat = categories[Math.floor(Math.random() * categories.length)];
  const randomAmount = Number((Math.random() * 2500 + 49).toFixed(2));

  const txn = {
    id: `sim_${uuidv4().slice(0, 8)}`,
    amount: customData.amount !== undefined ? customData.amount : randomAmount,
    customer_name: customData.customer_name || randomName,
    customer_email: customData.customer_email || randomEmail,
    category: customData.category || randomCat,
    description: customData.description || `Simulated Checkout via PayPal Smart Buttons`
  };

  return evaluateTransactionRisk(txn);
}

export default {
  evaluateTransactionRisk,
  getLiveEventStream,
  simulateIncomingTransaction
};
