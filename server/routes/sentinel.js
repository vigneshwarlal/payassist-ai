import express from 'express';
import sentinelService from '../services/sentinelService.js';

const router = express.Router();

/**
 * GET /api/sentinel/stream
 * Fetch recent risk events evaluated by Sentinel AI
 */
router.get('/stream', (req, res) => {
  try {
    const events = sentinelService.getLiveEventStream();
    res.json({
      success: true,
      events,
      count: events.length,
      activeShield: true
    });
  } catch (err) {
    console.error('Sentinel stream error:', err);
    res.status(500).json({ error: 'Failed to retrieve sentinel event stream' });
  }
});

/**
 * POST /api/sentinel/evaluate
 * Inspect an ad-hoc transaction payload
 */
router.post('/evaluate', (req, res) => {
  try {
    const transaction = req.body;
    const result = sentinelService.evaluateTransactionRisk(transaction);
    res.json({
      success: true,
      analysis: result
    });
  } catch (err) {
    console.error('Sentinel evaluate error:', err);
    res.status(500).json({ error: 'Failed to evaluate transaction risk' });
  }
});

/**
 * POST /api/sentinel/simulate
 * Generate a simulated incoming transaction to demonstrate real-time AI fraud detection in demo
 */
router.post('/simulate', (req, res) => {
  try {
    const customData = req.body || {};
    const result = sentinelService.simulateIncomingTransaction(customData);
    res.json({
      success: true,
      simulatedEvent: result
    });
  } catch (err) {
    console.error('Sentinel simulate error:', err);
    res.status(500).json({ error: 'Failed to simulate transaction event' });
  }
});

export default router;
