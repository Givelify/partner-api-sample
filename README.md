# Givelify Partner API — Sample Dashboard

A working Node.js web dashboard that demonstrates how to integrate with the
Givelify Partner API. Browse donations, donors, envelopes, and organizations
from your browser using your API credentials, and test webhook delivery end-to-end.

## What This Shows You

| Feature | Where to look |
|---|---|
| API authentication (Bearer token) | `src/apiClient.js` — `buildInstance()` |
| Calling a paginated endpoint | `src/routes/donations.js` |
| Calling a non-paginated endpoint | `src/routes/envelopes.js` |
| Calling a POST endpoint | `src/apiClient.js` — `post()` |
| Error handling | `src/apiClient.js` — `get()`, `post()` |
| Updating credentials at runtime | `src/routes/settings.js` — `POST /` |
| Triggering a test webhook | `src/routes/webhooks.js` — `POST /trigger` |
| Receiving webhook payloads | `src/routes/webhooks.js` — `POST /receive` |

## Prerequisites

- [Node.js](https://nodejs.org) v24 or later
- A Givelify Partner API key — contact your Givelify account manager to obtain one

## Setup

```bash
# 1. Clone this repository
git clone https://github.com/Givelify/givelify-partner-api-sample.git
cd givelify-partner-api-sample

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env
```

Open `.env` and fill in your values:

```
API_BASE_URL=https://api-sandbox.givelify.com/v1/
API_KEY=your-api-key-here
PORT=3000

# Optional — pre-fills the webhook target URL (must be HTTPS, see Webhooks section below)
WEBHOOK_RECEIVER_URL=
```

## Running the Dashboard

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You can also update your API Base URL and API Key through the **Settings** tab
in the dashboard — no restart needed.

## Testing Webhooks

The **Webhooks** tab lets you trigger a test webhook delivery from the Partner API
(sandbox/QA environments only) and inspect the received payload in the browser.

**How it works:**

1. The Partner API requires an **HTTPS** URL as the webhook target. For local testing,
   expose this app with a tunneling tool such as [ngrok](https://ngrok.com):

   ```bash
   ngrok http 3000
   ```

2. Copy the HTTPS tunnel URL and set it as `WEBHOOK_RECEIVER_URL` in your `.env`
   (or paste it directly into the Webhooks form):

   ```
   WEBHOOK_RECEIVER_URL=https://abc123.ngrok.io/webhooks/receive
   ```

3. Open the **Webhooks** tab, choose an event type, and click **Send Test Webhook**.
   The Partner API will POST a payload to `/webhooks/receive` on this app, and it will
   appear in the **Received Webhooks** log immediately.

## Project Structure

```
src/
  server.js         Express app (entry point)
  apiClient.js      All API calls — start here
  routes/           One file per tab
    donations.js
    donors.js
    envelopes.js
    organizations.js
    webhooks.js     Trigger + receive + log
    settings.js
  views/            EJS templates (one per tab + shared partials)
```

## Running Tests

```bash
npm test
```
