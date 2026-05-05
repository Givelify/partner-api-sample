'use strict';

jest.mock('../../src/apiClient');

const fs = require('fs');
const request = require('supertest');
const apiClient = require('../../src/apiClient');

// Set env before requiring app
process.env.API_BASE_URL = 'https://api.example.com';
process.env.API_KEY = 'initial-key';

const app = require('../../src/server');

describe('GET /settings', () => {
  it('renders settings page', async () => {
    const res = await request(app).get('/settings');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Settings');
  });

  it('shows the API Base URL field', async () => {
    const res = await request(app).get('/settings');
    expect(res.text).toContain('api_base_url');
  });
});

describe('POST /settings', () => {
  // Use spyOn (not jest.mock('fs')) so EJS can still read template files normally.
  // We only mock the specific fs methods the settings route uses.
  let readSpy, writeSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    readSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue(
      'API_BASE_URL=https://old.example.com\nAPI_KEY=old-key\n'
    );
    writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  });

  afterEach(() => {
    readSpy.mockRestore();
    writeSpy.mockRestore();
  });

  it('updates credentials and redirects to settings', async () => {
    const res = await request(app)
      .post('/settings')
      .type('form')
      .send({ api_base_url: 'https://new.example.com', api_key: 'new-key' });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/settings?saved=1');
    expect(apiClient.updateCredentials).toHaveBeenCalledWith('https://new.example.com', 'new-key');
  });

  it('rewrites .env with new values', async () => {
    await request(app)
      .post('/settings')
      .type('form')
      .send({ api_base_url: 'https://new.example.com', api_key: 'new-key' });

    expect(writeSpy).toHaveBeenCalled();
    const written = writeSpy.mock.calls[0][1];
    expect(written).toContain('API_BASE_URL=https://new.example.com');
    expect(written).toContain('API_KEY=new-key');
  });

  it('rejects empty fields with 400', async () => {
    const res = await request(app)
      .post('/settings')
      .type('form')
      .send({ api_base_url: '', api_key: 'new-key' });

    expect(res.status).toBe(400);
  });

  it('calls fetchOrgName after saving credentials', async () => {
    apiClient.fetchOrgName.mockResolvedValue(undefined);

    await request(app)
      .post('/settings')
      .type('form')
      .send({ api_base_url: 'https://new.example.com', api_key: 'new-key' });

    expect(apiClient.fetchOrgName).toHaveBeenCalled();
  });
});
