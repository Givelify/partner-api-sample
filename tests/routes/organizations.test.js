'use strict';

jest.mock('../../src/apiClient');

const request = require('supertest');
const app = require('../../src/server');
const apiClient = require('../../src/apiClient');

describe('GET /organizations', () => {
  it('renders organizations page', async () => {
    apiClient.getOrganizations.mockResolvedValue({ data: [] });
    const res = await request(app).get('/organizations');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Organizations');
  });

  it('shows organization rows', async () => {
    apiClient.getOrganizations.mockResolvedValue({
      data: [{ id: 'org-1', name: 'First Church', type: 'main-campus', city: 'Austin', state: 'TX' }],
    });
    const res = await request(app).get('/organizations');
    expect(res.text).toContain('First Church');
  });

  it('shows empty state when no organizations', async () => {
    apiClient.getOrganizations.mockResolvedValue({ data: [] });
    const res = await request(app).get('/organizations');
    expect(res.text).toContain('No results found');
  });

  it('shows error banner on API error', async () => {
    apiClient.getOrganizations.mockRejectedValue({ status: 401, message: 'Unauthenticated.' });
    const res = await request(app).get('/organizations');
    expect(res.text).toContain('Unauthenticated.');
  });
});
