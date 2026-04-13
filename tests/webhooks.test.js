'use strict';

process.env.API_BASE_URL = 'https://api.example.com/v1';
process.env.API_KEY = 'test-key';
process.env.WEBHOOK_RECEIVER_URL = 'https://example.ngrok.io/webhooks/receive';

const request = require('supertest');
const MockAdapter = require('axios-mock-adapter');
const apiClient = require('../src/apiClient');
const app = require('../src/server');

let mock;

beforeEach(() => {
  mock = new MockAdapter(apiClient._getInstance());
  // Clear received webhooks between tests
  const webhooksRoute = require('../src/routes/webhooks');
  webhooksRoute._receivedWebhooks.splice(0);
});

afterEach(() => {
  mock.restore();
});

describe('GET /webhooks', () => {
  it('returns 200 and renders the webhooks page', async () => {
    const res = await request(app).get('/webhooks');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Send Test Webhook');
  });

  it('pre-fills the target URL from WEBHOOK_RECEIVER_URL env var', async () => {
    const res = await request(app).get('/webhooks');
    expect(res.text).toContain('https://example.ngrok.io/webhooks/receive');
  });

  it('shows empty log message when no webhooks received', async () => {
    const res = await request(app).get('/webhooks');
    expect(res.text).toContain('No webhooks received yet');
  });
});

describe('POST /webhooks/trigger', () => {
  it('renders success banner when API returns 200', async () => {
    mock.onPost('/sandbox/webhooks/test').reply(200, { data: { event: 'donation.created' } });

    const res = await request(app)
      .post('/webhooks/trigger')
      .type('form')
      .send({ webhook_url: 'https://example.com/receive', event: 'donation.created' });

    expect(res.status).toBe(200);
    expect(res.text).toContain('Webhook dispatched successfully');
  });

  it('renders error banner on API error', async () => {
    mock.onPost('/sandbox/webhooks/test').reply(422, { message: 'The url field must be a valid HTTPS URL.' });

    const res = await request(app)
      .post('/webhooks/trigger')
      .type('form')
      .send({ webhook_url: 'http://not-https.example.com', event: 'donation.created' });

    expect(res.status).toBe(422);
    expect(res.text).toContain('The url field must be a valid HTTPS URL.');
  });

  it('returns 400 when webhook_url is missing', async () => {
    const res = await request(app)
      .post('/webhooks/trigger')
      .type('form')
      .send({ event: 'donation.created' });

    expect(res.status).toBe(400);
    expect(res.text).toContain('Webhook URL and event are required');
  });

  it('returns 400 when event is missing', async () => {
    const res = await request(app)
      .post('/webhooks/trigger')
      .type('form')
      .send({ webhook_url: 'https://example.com/receive' });

    expect(res.status).toBe(400);
    expect(res.text).toContain('Webhook URL and event are required');
  });
});

describe('POST /webhooks/receive', () => {
  it('returns { received: true } and stores the payload', async () => {
    const payload = { event: 'donation.created', event_id: 'abc', version: 'v1', data: {} };

    const res = await request(app)
      .post('/webhooks/receive')
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });

    const webhooksRoute = require('../src/routes/webhooks');
    expect(webhooksRoute._receivedWebhooks).toHaveLength(1);
    expect(webhooksRoute._receivedWebhooks[0].payload).toMatchObject({ event: 'donation.created' });
  });

  it('stores newest payload first', async () => {
    const webhooksRoute = require('../src/routes/webhooks');

    await request(app)
      .post('/webhooks/receive')
      .set('Content-Type', 'application/json')
      .send({ event: 'donation.created' });

    await request(app)
      .post('/webhooks/receive')
      .set('Content-Type', 'application/json')
      .send({ event: 'donor.updated' });

    expect(webhooksRoute._receivedWebhooks[0].payload.event).toBe('donor.updated');
    expect(webhooksRoute._receivedWebhooks[1].payload.event).toBe('donation.created');
  });

  it('is visible on the webhooks page after being received', async () => {
    await request(app)
      .post('/webhooks/receive')
      .set('Content-Type', 'application/json')
      .send({ event: 'donation.refunded', event_id: 'xyz' });

    const res = await request(app).get('/webhooks');
    expect(res.text).toContain('donation.refunded');
  });
});

describe('GET /webhooks/clear', () => {
  it('clears the received webhook log and redirects', async () => {
    const webhooksRoute = require('../src/routes/webhooks');

    await request(app)
      .post('/webhooks/receive')
      .set('Content-Type', 'application/json')
      .send({ event: 'donation.created' });

    expect(webhooksRoute._receivedWebhooks).toHaveLength(1);

    const res = await request(app).get('/webhooks/clear');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/webhooks');
    expect(webhooksRoute._receivedWebhooks).toHaveLength(0);
  });
});
