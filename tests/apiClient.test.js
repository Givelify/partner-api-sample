'use strict';

const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

// apiClient reads env at require-time; set before requiring
process.env.API_BASE_URL = 'https://api.example.com/v1';
process.env.API_KEY = 'test-key';

const apiClient = require('../src/apiClient');

// Reach into the module to get the active axios instance for mocking
let mock;

beforeEach(() => {
  mock = new MockAdapter(apiClient._getInstance());
});

afterEach(() => {
  mock.restore();
});

describe('getDonations', () => {
  it('calls GET /donations with supplied params', async () => {
    const responseBody = { data: [{ id: 'abc' }], links: {}, meta: {} };
    mock.onGet('/donations').reply(200, responseBody);

    const result = await apiClient.getDonations({ page: 1, per_page: 20 });

    expect(result).toEqual(responseBody);
    expect(mock.history.get[0].params).toMatchObject({ page: 1, per_page: 20 });
  });

  it('throws normalized error on 401', async () => {
    mock.onGet('/donations').reply(401, { message: 'Unauthenticated.' });

    await expect(apiClient.getDonations({})).rejects.toMatchObject({
      status: 401,
      message: 'Unauthenticated.',
    });
  });

  it('throws network error message when request fails to reach server', async () => {
    mock.onGet('/donations').networkError();

    await expect(apiClient.getDonations({})).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining('Could not reach the API'),
    });
  });
});

describe('getDonors', () => {
  it('calls GET /donors with supplied params', async () => {
    const responseBody = { data: [], links: {}, meta: {} };
    mock.onGet('/donors').reply(200, responseBody);

    await apiClient.getDonors({ email: 'test@example.com' });

    expect(mock.history.get[0].params).toMatchObject({ email: 'test@example.com' });
  });
});

describe('getEnvelopes', () => {
  it('calls GET /envelopes with supplied params', async () => {
    mock.onGet('/envelopes').reply(200, { data: [] });
    await apiClient.getEnvelopes({ organization_id: 'org-uuid' });
    expect(mock.history.get[0].params).toMatchObject({ organization_id: 'org-uuid' });
  });
});

describe('getOrganizations', () => {
  it('calls GET /organizations', async () => {
    mock.onGet('/organizations').reply(200, { data: [] });
    await apiClient.getOrganizations();
    expect(mock.history.get[0].url).toBe('/organizations');
  });
});

describe('updateCredentials', () => {
  it('rebuilds the instance with new baseURL and key', () => {
    apiClient.updateCredentials('https://new.example.com', 'new-key');
    const state = apiClient._getState();
    expect(state.baseURL).toBe('https://new.example.com');
    expect(state.apiKey).toBe('new-key');
  });
});
