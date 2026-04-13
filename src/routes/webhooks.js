/**
 * routes/webhooks.js
 *
 * GET  /webhooks          — show trigger form + in-memory received webhook log
 * POST /webhooks/trigger  — call POST /sandbox/webhooks/test on the Partner API
 * POST /webhooks/receive  — receive incoming webhook payloads from the Partner API
 *
 * Received payloads are stored in a module-level array (max 20 entries, newest first).
 * This is intentionally simple for a single-user sample app.
 */

'use strict';

const express = require('express');
const router = express.Router();
const apiClient = require('../apiClient');

/** Supported webhook event types (must match TestWebhookPayloadFactory::supportedEvents()) */
const SUPPORTED_EVENTS = [
  'donation.created',
  'donation.refunded',
  'donation.adjusted',
  'donation.disbursed',
  'donor.updated',
  'donor.merged',
];

const MAX_LOG_SIZE = 20;

/** In-memory log of received webhook payloads, newest first. */
const receivedWebhooks = [];

router.get('/', (req, res) => {
  const defaultUrl = process.env.WEBHOOK_RECEIVER_URL || '';
  res.render('webhooks', {
    activeTab: 'webhooks',
    events: SUPPORTED_EVENTS,
    defaultUrl,
    result: null,
    error: null,
    receivedWebhooks,
    debug: null,
  });
});

router.post('/trigger', async (req, res) => {
  const { webhook_url, event } = req.body;
  const defaultUrl = process.env.WEBHOOK_RECEIVER_URL || '';

  if (!webhook_url || !event) {
    return res.status(400).render('webhooks', {
      activeTab: 'webhooks',
      events: SUPPORTED_EVENTS,
      defaultUrl,
      result: null,
      error: { status: null, message: 'Webhook URL and event are required.' },
      receivedWebhooks,
      debug: null,
    });
  }

  try {
    const result = await apiClient.triggerTestWebhook({ url: webhook_url, event });
    const debug = apiClient.getLastDebug();
    res.render('webhooks', {
      activeTab: 'webhooks',
      events: SUPPORTED_EVENTS,
      defaultUrl,
      result,
      error: null,
      receivedWebhooks,
      debug,
    });
  } catch (err) {
    const debug = apiClient.getLastDebug();
    res.status(err.status || 500).render('webhooks', {
      activeTab: 'webhooks',
      events: SUPPORTED_EVENTS,
      defaultUrl,
      result: null,
      error: err,
      receivedWebhooks,
      debug,
    });
  }
});

router.get('/clear', (_req, res) => {
  receivedWebhooks.splice(0);
  res.redirect('/webhooks');
});

router.post('/receive', (req, res) => {
  const payload = req.body;
  receivedWebhooks.unshift({
    receivedAt: new Date().toISOString(),
    payload,
  });
  // Keep log bounded
  if (receivedWebhooks.length > MAX_LOG_SIZE) {
    receivedWebhooks.splice(MAX_LOG_SIZE);
  }
  res.json({ received: true });
});

module.exports = router;
// Exposed for tests
module.exports._receivedWebhooks = receivedWebhooks;
