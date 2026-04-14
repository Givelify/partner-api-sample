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
