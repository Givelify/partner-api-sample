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
