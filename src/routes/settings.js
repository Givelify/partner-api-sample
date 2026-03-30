/**
 * routes/settings.js
 *
 * GET  /settings — show current credentials (API key masked)
 * POST /settings — validate, rewrite .env, update live axios instance
 *
 * Why rewrite .env?
 *   So the user's settings survive a server restart. Without this, updating
 *   credentials in the UI would reset on the next `npm start`.
 *
 * Why call apiClient.updateCredentials()?
 *   axios instances bake the baseURL and Authorization header at creation time.
 *   updateCredentials() rebuilds the instance so subsequent requests use the
 *   new values immediately — no server restart needed.
 */

'use strict';

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const apiClient = require('../apiClient');

const ENV_PATH = path.join(__dirname, '..', '..', '.env');

/**
 * Rewrites a single key in .env content.
 * If the key exists, replaces its value. If not, appends it.
 */
function setEnvValue(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  return regex.test(content)
    ? content.replace(regex, line)
    : content.trimEnd() + '\n' + line + '\n';
}

router.get('/', (req, res) => {
  res.render('settings', {
    activeTab: 'settings',
    apiBaseUrl: process.env.API_BASE_URL || '',
    apiKey: process.env.API_KEY || '',
    saved: req.query.saved === '1',
    error: null,
  });
});

router.post('/', (req, res) => {
  const { api_base_url, api_key } = req.body;

  // Validate — neither field may be blank
  if (!api_base_url || !api_key) {
    return res.status(400).render('settings', {
      activeTab: 'settings',
      apiBaseUrl: api_base_url || process.env.API_BASE_URL || '',
      apiKey: api_key || process.env.API_KEY || '',
      saved: false,
      error: 'Both API Base URL and API Key are required.',
    });
  }

  // Rewrite .env so settings survive a server restart
  let envContent = '';
  try {
    envContent = fs.readFileSync(ENV_PATH, 'utf8');
  } catch {
    // .env doesn't exist yet — start with empty content
  }
  envContent = setEnvValue(envContent, 'API_BASE_URL', api_base_url);
  envContent = setEnvValue(envContent, 'API_KEY', api_key);
  fs.writeFileSync(ENV_PATH, envContent, 'utf8');

  // Update in-memory config and rebuild the axios instance immediately
  process.env.API_BASE_URL = api_base_url;
  process.env.API_KEY = api_key;
  apiClient.updateCredentials(api_base_url, api_key);

  res.redirect('/settings?saved=1');
});

module.exports = router;
