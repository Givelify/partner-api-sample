/**
 * routes/envelopes.js
 *
 * Handles the Envelopes tab.
 *
 * Unlike donations and donors, the Partner API returns ALL envelopes for the
 * authenticated organization in a single response — there is no pagination.
 * The response shape is simply { data: [...] }.
 */

'use strict';

const express = require('express');
const router = express.Router();
const apiClient = require('../apiClient');

router.get('/', async (req, res) => {
  const { updated_since, organization_id } = req.query;

  const params = {};
  if (updated_since)   params.updated_since   = updated_since;
  if (organization_id) params.organization_id = organization_id;

  let data = [], error = null;

  try {
    const response = await apiClient.getEnvelopes(params);
    data = response.data;
  } catch (err) {
    error = err;
  }

  const debug = apiClient.getLastDebug();

  res.render('envelopes', {
    activeTab: 'envelopes',
    data,
    error,
    debug,
    filters: { updated_since: updated_since || '', organization_id: organization_id || '' },
  });
});

module.exports = router;
