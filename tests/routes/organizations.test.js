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

describe('GET /organizations/:id', () => {
  const org = {
    id: 'org-uuid-456',
    name: 'First Church',
    type: 'main-campus',
    address: '100 Church St',
    address2: null,
    city: 'Austin',
    state: 'TX',
    country: 'US',
    zip: '78701',
    phone: '512-555-0100',
    created_at: '2020-01-01',
    updated_at: '2024-01-01',
  };

  it('renders organization detail page with 200', async () => {
    apiClient.getOrganization.mockResolvedValue({ data: org });
    const res = await request(app).get('/organizations/org-uuid-456');
    expect(res.status).toBe(200);
    expect(res.text).toContain('First Church');
  });

  it('calls getOrganization with the id from the URL', async () => {
    apiClient.getOrganization.mockResolvedValue({ data: org });
    await request(app).get('/organizations/org-uuid-456');
    expect(apiClient.getOrganization).toHaveBeenCalledWith('org-uuid-456');
  });

  it('shows error banner on API error', async () => {
    apiClient.getOrganization.mockRejectedValue({ status: 404, message: 'Not found.' });
    const res = await request(app).get('/organizations/bad-id');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Not found.');
  });
});

describe('GET /organizations list rows are clickable', () => {
  it('each row links to the organization detail page', async () => {
    apiClient.getOrganizations.mockResolvedValue({
      data: [{ id: 'org-uuid-456', name: 'First Church', type: 'main-campus', city: 'Austin', state: 'TX' }],
    });
    const res = await request(app).get('/organizations');
    expect(res.text).toContain('/organizations/org-uuid-456');
  });
});
