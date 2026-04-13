/**
 * server.js
 *
 * Express application setup. Exports `app` so tests can import it via supertest.
 * Only calls app.listen() when run directly (node src/server.js / npm start).
 */

'use strict';

require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();

// Parse form submissions from the Settings page
app.use(express.urlencoded({ extended: false }));

// Parse JSON bodies — used by the webhook receiver endpoint
app.use(express.json());

// Serve CSS from /public
app.use(express.static(path.join(__dirname, '..', 'public')));

// EJS for server-side HTML rendering
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Mount routes
app.use('/donations',     require('./routes/donations'));
app.use('/donors',        require('./routes/donors'));
app.use('/envelopes',     require('./routes/envelopes'));
app.use('/organizations', require('./routes/organizations'));
app.use('/settings',      require('./routes/settings'));
app.use('/webhooks',      require('./routes/webhooks'));

// Root → donations tab
app.get('/', (_req, res) => res.redirect('/donations'));

module.exports = app;

// Start the server only when this file is the entry point
if (require.main === module) {
  const port = parseInt(process.env.PORT || '3000', 10);
  app.listen(port, () => {
    console.log(`Givelify Partner API Dashboard → http://localhost:${port}`);
    console.log('Press Ctrl+C to stop.');
  });
}
