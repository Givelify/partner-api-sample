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

describe('getLastDebug', () => {
  it('captures full request URL with params after a successful call', async () => {
    mock.onGet('/donations').reply(200, { data: [] });
    await apiClient.getDonations({ page: 1, per_page: 20 });

    const debug = apiClient.getLastDebug();
    expect(debug.request.url).toContain('/donations');
    expect(debug.request.url).toContain('page=1');
    expect(debug.request.url).toContain('per_page=20');
  });

  it('includes Authorization and Accept headers in debug output', async () => {
    mock.onGet('/donations').reply(200, { data: [] });
    await apiClient.getDonations({});

    const debug = apiClient.getLastDebug();
    expect(debug.request.headers).toHaveProperty('Authorization');
    expect(debug.request.headers).toHaveProperty('Accept', 'application/json');
  });

  it('masks the API key in the Authorization header', async () => {
    mock.onGet('/donations').reply(200, { data: [] });
    await apiClient.getDonations({});

    const debug = apiClient.getLastDebug();
    // Should NOT contain the raw key 'new-key' (set by updateCredentials above)
    expect(debug.request.headers.Authorization).not.toMatch(/new-key/);
    expect(debug.request.headers.Authorization).toContain('••••');
  });

  it('captures HTTP status and response body on success', async () => {
    mock.onGet('/donations').reply(200, { data: [{ id: 'abc' }] });
    await apiClient.getDonations({});

    const debug = apiClient.getLastDebug();
    expect(debug.response.status).toBe(200);
    expect(debug.response.body).toContain('"id": "abc"');
  });

  it('captures HTTP status and body on API error', async () => {
    mock.onGet('/donations').reply(401, { message: 'Unauthenticated.' });
    await expect(apiClient.getDonations({})).rejects.toBeDefined();

    const debug = apiClient.getLastDebug();
    expect(debug.response.status).toBe(401);
    expect(debug.response.body).toContain('Unauthenticated');
  });

  it('captures status 0 and null body on network error', async () => {
    mock.onGet('/donations').networkError();
    await expect(apiClient.getDonations({})).rejects.toBeDefined();

    const debug = apiClient.getLastDebug();
    expect(debug.response.status).toBe(0);
    expect(debug.response.body).toBeNull();
  });
});
