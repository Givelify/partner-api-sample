/**
 * apiClient.js
 *
 * Central HTTP client for the Givelify Partner API.
 *
 * Why this module exists:
 *   - The API key must never reach the browser. All requests go through this
 *     server-side module so the key stays in the Node.js process.
 *   - Centralizing requests means auth and error handling live in one place.
 *   - updateCredentials() lets the Settings route swap credentials at runtime
 *     without restarting the server.
 *
 * Error contract: every rejected promise has shape { status: number, message: string }.
 *   status 0 means we couldn't reach the server at all.
 */

'use strict';

const axios = require('axios');

// Mutable state — holds the current credentials.
// Updated by updateCredentials() when the user saves Settings.
let state = {
  baseURL: process.env.API_BASE_URL || '',
  apiKey: process.env.API_KEY || '',
};

// The active axios instance. Replaced entirely when credentials change,
// because axios instances bake the baseURL and headers in at creation time.
let instance = buildInstance();

function buildInstance() {
  return axios.create({
    baseURL: state.baseURL,
    timeout: 10_000,
    headers: {
      // The Partner API uses Laravel Sanctum: Bearer token in Authorization header
      Authorization: `Bearer ${state.apiKey}`,
      Accept: 'application/json',
    },
  });
}

/**
 * Called by the Settings route after persisting new credentials to .env.
 * Rebuilds the axios instance so all subsequent requests use the new values.
 */
function updateCredentials(baseURL, apiKey) {
  state = { baseURL, apiKey };
  instance = buildInstance();
}

/**
 * Builds the full request URL including query params.
 * Used for debug output only — Axios doesn't expose the final URL directly.
 */
function buildFullUrl(baseURL, path, params) {
  const base = baseURL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  const paramStr = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return paramStr ? `${base}${cleanPath}?${paramStr}` : `${base}${cleanPath}`;
}

/**
 * Returns a masked version of the API key for safe display in the debug panel.
 * Shows the first 4 characters followed by bullets so users can identify which
 * key is in use without exposing the full secret in screenshots.
 */
function maskApiKey(key) {
  if (!key || key.length <= 4) return '••••••••';
  return key.slice(0, 4) + '••••••••';
}

/**
 * Stores request/response details from the most recent API call.
 *
 * NOTE: Module-level state is fine for this single-user sample app.
 * Do not use this pattern in a multi-user production service — concurrent
 * requests would overwrite each other's debug info.
 */
let lastDebug = null;

/**
 * Internal GET helper. Normalizes all errors to { status, message }.
 * Also populates lastDebug with request/response details for the UI panel.
 */
async function get(path, params = {}) {
  const url = buildFullUrl(state.baseURL, path, params);
  const headers = {
    Authorization: `Bearer ${maskApiKey(state.apiKey)}`,
    Accept: 'application/json',
  };

  // Capture request details before the call so they're available even if it throws
  lastDebug = {
    request: { url, headers },
    response: null,
  };

  try {
    const response = await instance.get(path, { params });
    lastDebug.response = {
      status: response.status,
      body: JSON.stringify(response.data, null, 2),
    };
    return response.data;
  } catch (err) {
    if (err.response) {
      // API responded with a non-2xx code
      lastDebug.response = {
        status: err.response.status,
        body: JSON.stringify(err.response.data, null, 2),
      };
      throw {
        status: err.response.status,
        message:
          (err.response.data && err.response.data.message) ||
          err.response.statusText ||
          'Unknown error',
      };
    }
    // Network error, timeout, DNS failure, or wrong base URL
    lastDebug.response = { status: 0, body: null };
    throw {
      status: 0,
      message: 'Could not reach the API — check the Base URL in Settings',
    };
  }
}

/**
 * Internal POST helper. Normalizes all errors to { status, message }.
 * Populates lastDebug with request/response details for the UI panel.
 */
async function post(path, body = {}) {
  const url = buildFullUrl(state.baseURL, path, {});
  const headers = {
    Authorization: `Bearer ${maskApiKey(state.apiKey)}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  lastDebug = {
    request: { url, headers, body: JSON.stringify(body, null, 2) },
    response: null,
  };

  try {
    const response = await instance.post(path, body);
    lastDebug.response = {
      status: response.status,
      body: JSON.stringify(response.data, null, 2),
    };
    return response.data;
  } catch (err) {
    if (err.response) {
      lastDebug.response = {
        status: err.response.status,
        body: JSON.stringify(err.response.data, null, 2),
      };
      throw {
        status: err.response.status,
        message:
          (err.response.data && err.response.data.message) ||
          err.response.statusText ||
          'Unknown error',
      };
    }
    lastDebug.response = { status: 0, body: null };
    throw {
      status: 0,
      message: 'Could not reach the API — check the Base URL in Settings',
    };
  }
}

// ── Webhooks ─────────────────────────────────────────────────────────────────

/**
 * POST /sandbox/webhooks/test
 * Triggers a test webhook delivery. Only available in sandbox/QA environments.
 *
 * @param {{ url: string, event: string }} params
 *   url   - HTTPS URL the Partner API will POST the webhook payload to
 *   event - one of the supported event types (e.g. 'donation.created')
 */
async function triggerTestWebhook({ url, event }) {
  return post('/sandbox/webhooks/test', { url, event });
}

// ── Donations ────────────────────────────────────────────────────────────────

/**
 * GET /donations
 * Paginated. Returns { data, links, meta }.
 *
 * @param {{ start_time?, end_time?, donor_id?, organization_id?, updated_since?, page?, per_page? }} params
 */
async function getDonations(params) {
  return get('/donations', params);
}

/** GET /donations/:uuid */
async function getDonation(uuid) {
  return get(`/donations/${uuid}`);
}

// ── Donors ───────────────────────────────────────────────────────────────────

/**
 * GET /donors
 * Paginated. Returns { data, links, meta }.
 *
 * @param {{ email?, name?, updated_since?, page?, per_page? }} params
 */
async function getDonors(params) {
  return get('/donors', params);
}

/** GET /donors/:uuid */
async function getDonor(uuid) {
  return get(`/donors/${uuid}`);
}

// ── Envelopes ────────────────────────────────────────────────────────────────

/**
 * GET /envelopes
 * Not paginated — returns all records as { data: [...] }.
 *
 * @param {{ updated_since?, organization_id? }} params
 */
async function getEnvelopes(params) {
  return get('/envelopes', params);
}

/** GET /envelopes/:id */
async function getEnvelope(id) {
  return get(`/envelopes/${id}`);
}

// ── Organizations ────────────────────────────────────────────────────────────

/**
 * GET /organizations
 * Not paginated — returns all records as { data: [...] }.
 */
async function getOrganizations() {
  return get('/organizations');
}

/** GET /organizations/:id */
async function getOrganization(id) {
  return get(`/organizations/${id}`);
}

module.exports = {
  getDonations,
  getDonation,
  getDonors,
  getDonor,
  getEnvelopes,
  getEnvelope,
  getOrganizations,
  getOrganization,
  triggerTestWebhook,
  updateCredentials,
  getLastDebug: () => lastDebug,
  // Test helpers — not for production use
  _getInstance: () => instance,
  _getState: () => state,
};
