'use strict';

jest.mock('../../src/apiClient');

const request = require('supertest');
const app = require('../../src/server');
const apiClient = require('../../src/apiClient');

describe('GET /envelopes', () => {
  it('renders envelopes page', async () => {
    apiClient.getEnvelopes.mockResolvedValue({ data: [] });
    const res = await request(app).get('/envelopes');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Envelopes');
  });

  it('shows envelope rows', async () => {
    apiClient.getEnvelopes.mockResolvedValue({
      data: [{ id: 'env-1', name: 'General Fund', description: null, external_id: 'EXT-1', created_at: '2024-01-01' }],
    });
    const res = await request(app).get('/envelopes');
    expect(res.text).toContain('General Fund');
  });

  it('shows empty state when no envelopes', async () => {
    apiClient.getEnvelopes.mockResolvedValue({ data: [] });
    const res = await request(app).get('/envelopes');
    expect(res.text).toContain('No results found');
  });

  it('shows error banner on API error', async () => {
    apiClient.getEnvelopes.mockRejectedValue({ status: 0, message: 'Could not reach the API — check the Base URL in Settings' });
    const res = await request(app).get('/envelopes');
    expect(res.text).toContain('Could not reach the API');
  });
});

describe('GET /envelopes/:id', () => {
  const envelope = {
    id: 'env-uuid-1',
    name: 'General Fund',
    description: 'Main giving fund',
    external_id: 'GF1',
    organization_id: 'org-uuid-456',
    created_at: '2023-01-01',
    updated_at: '2024-01-01',
  };

  it('renders envelope detail page with 200', async () => {
    apiClient.getEnvelope.mockResolvedValue({ data: envelope });
    const res = await request(app).get('/envelopes/env-uuid-1');
    expect(res.status).toBe(200);
    expect(res.text).toContain('General Fund');
  });

  it('calls getEnvelope with the id from the URL', async () => {
    apiClient.getEnvelope.mockResolvedValue({ data: envelope });
    await request(app).get('/envelopes/env-uuid-1');
    expect(apiClient.getEnvelope).toHaveBeenCalledWith('env-uuid-1');
  });

  it('shows organization_id as a cross-link to /organizations/:id', async () => {
    apiClient.getEnvelope.mockResolvedValue({ data: envelope });
    const res = await request(app).get('/envelopes/env-uuid-1');
    expect(res.text).toContain('href="/organizations/org-uuid-456"');
  });

  it('shows error banner on API error', async () => {
    apiClient.getEnvelope.mockRejectedValue({ status: 404, message: 'Not found.' });
    const res = await request(app).get('/envelopes/bad-id');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Not found.');
  });
});

describe('GET /envelopes list rows are clickable', () => {
  it('each row links to the envelope detail page', async () => {
    apiClient.getEnvelopes.mockResolvedValue({
      data: [{ id: 'env-uuid-1', name: 'General Fund', description: null, external_id: 'GF1', organization_id: 'org-uuid-456', created_at: '2023-01-01' }],
    });
    const res = await request(app).get('/envelopes');
    expect(res.text).toContain('/envelopes/env-uuid-1');
  });
});
