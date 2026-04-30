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

  let data = [], pagination = null, error = null;

  try {
    const response = await apiClient.getDonors(params);
    data       = response.data;
    pagination = response.pagination;
  } catch (err) {
    error = err;
  }

  const debug = apiClient.getLastDebug();

  res.render('donors', {
    activeTab: 'donors',
    data,
    pagination,
    error,
    debug,
    filters: { email: email || '', name: name || '', updated_since: updated_since || '' },
    prevQuery: pagination && pagination.current_page > 1 ? pageQuery(req.query, pagination.current_page - 1) : null,
    nextQuery: pagination && pagination.next_page_url   ? pageQuery(req.query, pagination.current_page + 1) : null,
  });
});

router.get('/:uuid', async (req, res) => {
  let data = null, error = null;
  try {
    const response = await apiClient.getDonor(req.params.uuid);
    data = response.data;
  } catch (err) {
    error = err;
  }
  res.render('donor-detail', {
    activeTab: 'donors',
    data,
    error,
    debug: apiClient.getLastDebug(),
  });
});

module.exports = router;
