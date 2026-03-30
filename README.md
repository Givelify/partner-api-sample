# Givelify Partner API — Sample Dashboard

A working Node.js web dashboard that demonstrates how to integrate with the
Givelify Partner API. Browse donations, donors, envelopes, and organizations
from your browser using your API credentials.

## What This Shows You

| Feature | Where to look |
|---|---|
| API authentication (Bearer token) | `src/apiClient.js` — `buildInstance()` |
| Calling a paginated endpoint | `src/routes/donations.js` |
| Calling a non-paginated endpoint | `src/routes/envelopes.js` |
| Error handling | `src/apiClient.js` — `get()` |
| Updating credentials at runtime | `src/routes/settings.js` — `POST /` |

## Prerequisites

- [Node.js](https://nodejs.org) v18 or later
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
API_BASE_URL=https://api.givelify.com/api/v1
API_KEY=your-api-key-here
PORT=3000
```

## Running the Dashboard

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You can also update your API Base URL and API Key through the **Settings** tab
in the dashboard — no restart needed.

## Project Structure

```
src/
  server.js         Express app (entry point)
  apiClient.js      All API calls — start here
  routes/           One file per tab
  views/            EJS templates (one per tab + shared partials)
```

## Running Tests

```bash
npm test
```
