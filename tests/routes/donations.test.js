'use strict';

jest.mock('../../src/apiClient');

const request = require('supertest');
const app = require('../../src/server');
const apiClient = require('../../src/apiClient');

const paginated = (data = [], extra = {}) => ({
  data,
  links: { prev: null, next: null },
  meta: { current_page: 1, last_page: 1, total: data.length, per_page: 20 },
  ...extra,
});

describe('GET /donations', () => {
  it('renders donations page', async () => {
    apiClient.getDonations.mockResolvedValue(paginated());
    const res = await request(app).get('/donations');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Donations');
  });

  it('passes filter params to apiClient', async () => {
    apiClient.getDonations.mockResolvedValue(paginated());
    await request(app).get('/donations?start_time=2024-01-01&donor_id=uuid-123');
    expect(apiClient.getDonations).toHaveBeenCalledWith(
      expect.objectContaining({ start_time: '2024-01-01', donor_id: 'uuid-123' })
    );
  });

  it('shows empty state when no results', async () => {
    apiClient.getDonations.mockResolvedValue(paginated([]));
    const res = await request(app).get('/donations');
    expect(res.text).toContain('No results found');
  });

  it('shows error banner on API error', async () => {
    apiClient.getDonations.mockRejectedValue({ status: 401, message: 'Unauthenticated.' });
    const res = await request(app).get('/donations');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Unauthenticated.');
  });

  it('shows next page link when links.next is present', async () => {
    apiClient.getDonations.mockResolvedValue(
      paginated([{ id: 'x', amount: 10, status: 'donated', envelopes: [] }], {
        links: { prev: null, next: 'http://api/donations?page=2' },
      })
    );
    const res = await request(app).get('/donations');
    expect(res.text).toContain('Next');
  });
});
