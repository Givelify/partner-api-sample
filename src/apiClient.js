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
 * Internal GET helper. Normalizes all errors to { status, message }.
 */
async function get(path, params = {}) {
  try {
    const response = await instance.get(path, { params });
    return response.data;
  } catch (err) {
    if (err.response) {
      // API responded with a non-2xx code
      throw {
        status: err.response.status,
        message:
          (err.response.data && err.response.data.message) ||
          err.response.statusText ||
          'Unknown error',
      };
    }
    // Network error, timeout, DNS failure, or wrong base URL
    throw {
      status: 0,
      message: 'Could not reach the API — check the Base URL in Settings',
    };
  }
}

// ── Donations ────────────────────────────────────────────────────────────────

/**
 * GET /donations
 * Paginated. Returns { data, links, meta }.
 *
 * @param {{ start_time?, end_time?, donor_id?, updated_since?, page?, per_page? }} params
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
  updateCredentials,
  // Test helpers — not for production use
  _getInstance: () => instance,
  _getState: () => state,
};
