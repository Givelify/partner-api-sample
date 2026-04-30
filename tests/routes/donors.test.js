'use strict';

jest.mock('../../src/apiClient');

const request = require('supertest');
const app = require('../../src/server');
const apiClient = require('../../src/apiClient');

const paginated = (data = []) => ({
  data,
  pagination: { current_page: 1, total_pages: 1, next_page_url: null },
});

describe('GET /donors', () => {
  it('renders donors page', async () => {
    apiClient.getDonors.mockResolvedValue(paginated());
    const res = await request(app).get('/donors');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Donors');
  });

  it('passes email and name filters to apiClient', async () => {
    apiClient.getDonors.mockResolvedValue(paginated());
    await request(app).get('/donors?email=test@example.com&name=Alice');
    expect(apiClient.getDonors).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com', name: 'Alice' })
    );
  });

  it('shows empty state when no results', async () => {
    apiClient.getDonors.mockResolvedValue(paginated([]));
    const res = await request(app).get('/donors');
    expect(res.text).toContain('No results found');
  });

  it('shows error banner on API error', async () => {
    apiClient.getDonors.mockRejectedValue({ status: 401, message: 'Unauthenticated.' });
    const res = await request(app).get('/donors');
    expect(res.text).toContain('Unauthenticated.');
  });
});

describe('GET /donors/:uuid', () => {
  const donor = {
    id: 'donor-uuid-789',
    external_id: 'EXT-001',
    name: 'Alice Smith',
    phone: '555-1234',
    email: 'alice@example.com',
    address: '123 Main St',
    city: 'Austin',
    state: 'TX',
    country: 'US',
    zip: '78701',
    created_at: '2023-06-01',
    updated_at: '2024-01-10',
  };

  it('renders donor detail page with 200', async () => {
    apiClient.getDonor.mockResolvedValue({ data: donor });
    const res = await request(app).get('/donors/donor-uuid-789');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Alice Smith');
  });

  it('calls getDonor with the uuid from the URL', async () => {
    apiClient.getDonor.mockResolvedValue({ data: donor });
    await request(app).get('/donors/donor-uuid-789');
    expect(apiClient.getDonor).toHaveBeenCalledWith('donor-uuid-789');
  });

  it('shows error banner on API error', async () => {
    apiClient.getDonor.mockRejectedValue({ status: 404, message: 'Not found.' });
    const res = await request(app).get('/donors/bad-uuid');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Not found.');
  });
});

describe('GET /donors list rows are clickable', () => {
  it('each row links to the donor detail page', async () => {
    apiClient.getDonors.mockResolvedValue({
      data: [{ id: 'donor-uuid-789', name: 'Alice Smith', email: 'alice@example.com' }],
      pagination: { current_page: 1, total_pages: 1, next_page_url: null },
    });
    const res = await request(app).get('/donors');
    expect(res.text).toContain('/donors/donor-uuid-789');
  });
});
