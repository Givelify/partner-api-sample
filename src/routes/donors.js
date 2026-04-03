/**
 * routes/donors.js
 *
 * Handles the Donors tab. Supports filtering by email, name, and updated_since.
 * Response is paginated — same pattern as donations.js.
 */

'use strict';

const express = require('express');
const router = express.Router();
const apiClient = require('../apiClient');

function pageQuery(currentQuery, page) {
  return new URLSearchParams({ ...currentQuery, page }).toString();
}

router.get('/', async (req, res) => {
  const { email, name, updated_since, page = 1, per_page = 20 } = req.query;

  const params = { page, per_page };
  if (email)         params.email         = email;
  if (name)          params.name          = name;
  if (updated_since) params.updated_since = updated_since;

  let data = [], links = null, meta = null, error = null;

  try {
    const response = await apiClient.getDonors(params);
    data  = response.data;
    links = response.links;
    meta  = response.meta;
  } catch (err) {
    error = err;
  }

  const debug = apiClient.getLastDebug();

  res.render('donors', {
    activeTab: 'donors',
    data,
    links,
    meta,
    error,
    debug,
    filters: { email: email || '', name: name || '', updated_since: updated_since || '' },
    prevQuery: links && links.prev ? pageQuery(req.query, Number(page) - 1) : null,
    nextQuery: links && links.next ? pageQuery(req.query, Number(page) + 1) : null,
  });
});

module.exports = router;
