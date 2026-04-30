'use strict';

jest.mock('../../src/apiClient');

const request = require('supertest');
const app = require('../../src/server');
const apiClient = require('../../src/apiClient');

const paginated = (data = [], extra = {}) => ({
  data,
  pagination: { current_page: 1, total_pages: 1, next_page_url: null },
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

  it('shows next page link when pagination.next_page_url is present', async () => {
    apiClient.getDonations.mockResolvedValue(
      paginated([{ id: 'x', amount: 10, status: 'disbursed', envelopes: [] }], {
        pagination: { current_page: 1, total_pages: 3, next_page_url: 'http://api/donations?page=2' },
      })
    );
    const res = await request(app).get('/donations');
    expect(res.text).toContain('Next');
  });

  it('passes organization_id filter to apiClient', async () => {
    apiClient.getDonations.mockResolvedValue(paginated());
    await request(app).get('/donations?organization_id=org-uuid-123');
    expect(apiClient.getDonations).toHaveBeenCalledWith(
      expect.objectContaining({ organization_id: 'org-uuid-123' })
    );
  });

  it('renders formatted amount when present', async () => {
    apiClient.getDonations.mockResolvedValue(
      paginated([{ id: 'x', amount: 25, status: 'disbursed', envelopes: [] }])
    );
    const res = await request(app).get('/donations');
    expect(res.text).toContain('$25.00');
  });

  it('renders em dash when amount is null', async () => {
    apiClient.getDonations.mockResolvedValue(
      paginated([{ id: 'x', amount: null, status: 'pending', envelopes: [] }])
    );
    const res = await request(app).get('/donations');
    expect(res.text).toContain('—');
  });

  it('applies green badge for disbursed status', async () => {
    apiClient.getDonations.mockResolvedValue(
      paginated([{ id: 'x', amount: 10, status: 'disbursed', envelopes: [] }])
    );
    const res = await request(app).get('/donations');
    expect(res.text).toContain('bg-green-100');
    expect(res.text).toContain('disbursed');
  });

  it('applies red badge for refunded status', async () => {
    apiClient.getDonations.mockResolvedValue(
      paginated([{ id: 'x', amount: 10, status: 'refunded', envelopes: [] }])
    );
    const res = await request(app).get('/donations');
    expect(res.text).toContain('bg-red-100');
    expect(res.text).toContain('refunded');
  });

  it('applies yellow badge for pending status', async () => {
    apiClient.getDonations.mockResolvedValue(
      paginated([{ id: 'x', amount: 10, status: 'pending', envelopes: [] }])
    );
    const res = await request(app).get('/donations');
    expect(res.text).toContain('bg-yellow-100');
    expect(res.text).toContain('pending');
  });
});

describe('GET /donations/:uuid', () => {
  const donation = {
    id: 'don-uuid-123',
    organization_id: 'org-uuid-456',
    donor_id: 'donor-uuid-789',
    receipt_number: 'R001',
    status: 'disbursed',
    amount: 100.00,
    amount_refunded: 0,
    fees: 2.5,
    is_recurring: false,
    payment_method: { type: 'card', card: { brand: 'visa' } },
    note: null,
    note_reply: null,
    refund_date: null,
    disbursement_date: '2024-02-01',
    created_at: '2024-01-15',
    updated_at: '2024-02-01',
    envelopes: [{ id: 'env-uuid-1', name: 'General Fund', amount: 100.00, description: 'Main fund', external_id: 'GF1' }],
  };

  it('renders donation detail page with 200', async () => {
    apiClient.getDonation.mockResolvedValue({ data: donation });
    const res = await request(app).get('/donations/don-uuid-123');
    expect(res.status).toBe(200);
    expect(res.text).toContain('don-uuid-123');
  });

  it('calls getDonation with the uuid from the URL', async () => {
    apiClient.getDonation.mockResolvedValue({ data: donation });
    await request(app).get('/donations/don-uuid-123');
    expect(apiClient.getDonation).toHaveBeenCalledWith('don-uuid-123');
  });

  it('shows donor_id as a cross-link to /donors/:id', async () => {
    apiClient.getDonation.mockResolvedValue({ data: donation });
    const res = await request(app).get('/donations/don-uuid-123');
    expect(res.text).toContain('href="/donors/donor-uuid-789"');
  });

  it('shows organization_id as a cross-link to /organizations/:id', async () => {
    apiClient.getDonation.mockResolvedValue({ data: donation });
    const res = await request(app).get('/donations/don-uuid-123');
    expect(res.text).toContain('href="/organizations/org-uuid-456"');
  });

  it('shows envelope cross-link to /envelopes/:id', async () => {
    apiClient.getDonation.mockResolvedValue({ data: donation });
    const res = await request(app).get('/donations/don-uuid-123');
    expect(res.text).toContain('href="/envelopes/env-uuid-1"');
  });

  it('shows error banner on API error', async () => {
    apiClient.getDonation.mockRejectedValue({ status: 404, message: 'Not found.' });
    const res = await request(app).get('/donations/bad-uuid');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Not found.');
  });
});

describe('GET /donations list rows are clickable', () => {
  it('each row links to the donation detail page', async () => {
    apiClient.getDonations.mockResolvedValue({
      data: [{ id: 'don-uuid-123', amount: 50, status: 'pending', envelopes: [] }],
      pagination: { current_page: 1, total_pages: 1, next_page_url: null },
    });
    const res = await request(app).get('/donations');
    expect(res.text).toContain('/donations/don-uuid-123');
  });
});
