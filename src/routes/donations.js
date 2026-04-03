/**
 * routes/donations.js
 *
 * Handles the Donations tab. Reads filter params from the query string,
 * calls apiClient.getDonations(), and renders donations.ejs.
 *
 * The API supports pagination via `page` and `per_page`.
 * We preserve all filter params in the pagination links so clicking
 * "Next" doesn't lose the user's current filters.
 */

'use strict';

const express = require('express');
const router = express.Router();
const apiClient = require('../apiClient');

/**
 * Builds a query string for a pagination link.
 * Copies all current query params and overrides `page`.
 *
 * Example: currentQuery = { start_time: '2024-01-01', page: '1' }, page = 2
 *          → 'start_time=2024-01-01&page=2'
 */
function pageQuery(currentQuery, page) {
  return new URLSearchParams({ ...currentQuery, page }).toString();
}

router.get('/', async (req, res) => {
  const { start_time, end_time, donor_id, organization_id, updated_since, page = 1, per_page = 20 } = req.query;

  // Build params — only include filters the user actually provided
  const params = { page, per_page };
  if (start_time)      params.start_time      = start_time;
  if (end_time)        params.end_time        = end_time;
  if (donor_id)        params.donor_id        = donor_id;
  if (organization_id) params.organization_id = organization_id;
  if (updated_since)   params.updated_since   = updated_since;

  let data = [], links = null, meta = null, error = null;

  try {
    const response = await apiClient.getDonations(params);
    data  = response.data;
    links = response.links;
    meta  = response.meta;
  } catch (err) {
    error = err;
  }

  const debug = apiClient.getLastDebug();

  res.render('donations', {
    activeTab: 'donations',
    data,
    links,
    meta,
    error,
    debug,
    filters: {
      start_time: start_time || '',
      end_time: end_time || '',
      donor_id: donor_id || '',
      organization_id: organization_id || '',
      updated_since: updated_since || '',
    },
    prevQuery: links && links.prev ? pageQuery(req.query, Number(page) - 1) : null,
    nextQuery: links && links.next ? pageQuery(req.query, Number(page) + 1) : null,
  });
});

module.exports = router;
