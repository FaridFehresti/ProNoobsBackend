require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { pool } = require('./db');
const api = require('./routes');
const { uploadRoot } = require('./storage/team-logos');

const app = express();
const port = Number(process.env.PORT) || 3000;
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',').map((origin) => origin.trim()).filter(Boolean);

app.disable('x-powered-by');
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : false }));
app.use(express.json({ limit: '32kb' }));
app.use((req, _res, next) => {
  req.body = req.body || {};
  next();
});
app.use('/uploads', (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}, express.static(uploadRoot, { dotfiles: 'deny', index: false, maxAge: '1d', immutable: true }));

async function healthCheck(_req, res) {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (_error) {
    res.status(503).json({ status: 'error', database: 'unavailable' });
  }
}
app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

app.use('/api', api);
app.use((error, _req, res, _next) => {
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body must be valid JSON.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });
  if (error.code === '23505') return res.status(409).json({ error: 'A record with that Discord or Steam ID already exists.' });
  if (error.code === '23503' || error.code === '23514') return res.status(400).json({ error: 'The submitted data does not satisfy a database constraint.' });
  console.error(error);
  res.status(500).json({ error: 'Internal server error.' });
});

const server = app.listen(port, () => console.log(`ProNoobs API listening on port ${port}`));

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
