import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import aiAgent from '../services/aiAgent.js';
import { query, run } from '../db.js';

const router = express.Router();

/**
 * POST /api/agent/chat
 * Send a prompt to PayAssist AI Agent and receive actions & response
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId = uuidv4() } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'A valid non-empty message is required' });
    }

    const response = await aiAgent.processMessage(message.trim(), sessionId);

    res.json({
      success: true,
      text: response.text,
      actions: response.actions,
      functionResults: response.functionResults,
      sessionId: response.sessionId
    });
  } catch (err) {
    console.error('AI Agent chat processing error:', err);
    res.status(500).json({
      error: err.message || 'AI Agent failed to process message',
      text: 'Sorry, I encountered an internal error while processing your request. Please try again or rephrase.'
    });
  }
});

/**
 * GET /api/agent/history
 * Fetch past chat messages
 */
router.get('/history', (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

    const messages = query(
      `SELECT id, role, content, created_at FROM chat_messages ORDER BY id ASC LIMIT ?`,
      [safeLimit]
    );

    res.json({ messages });
  } catch (err) {
    console.error('Error fetching chat history:', err);
    res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
});

/**
 * DELETE /api/agent/history
 * Clear chat history
 */
router.delete('/history', (req, res) => {
  try {
    run('DELETE FROM chat_messages');
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (err) {
    console.error('Error clearing chat history:', err);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

export default router;
