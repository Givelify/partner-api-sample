/**
 * routes/organizations.js
 *
 * Handles the Organizations tab.
 *
 * The Partner API returns all organizations visible to the authenticated API key
 * in a single response — no filters and no pagination.
 * Response shape: { data: [...] }
 */

'use strict';

const express = require('express');
const router = express.Router();
const apiClient = require('../apiClient');

router.get('/', async (req, res) => {
  let data = [], error = null;

  try {
    const response = await apiClient.getOrganizations();
    data = response.data;
  } catch (err) {
    error = err;
  }

  const debug = apiClient.getLastDebug();

  res.render('organizations', {
    activeTab: 'organizations',
    data,
    error,
    debug,
  });
});

module.exports = router;
