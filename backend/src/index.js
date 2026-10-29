require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('./firebase');
const { errorHandler } = require('./middleware');

const app = express();
app.use(helmet());
const webOrigins = new Set(
  (process.env.WEB_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);
app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || webOrigins.has(origin));
  },
}));
app.set('trust proxy', 1);
app.use(express.json({ limit: '100kb' }));
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));

app.get('/health', (_req, res) => res.json({ ok: true }));
// The APK has no auto-update: the app compares its version with this and asks users to update.
app.get('/config', (_req, res) => res.json({ minAppVersion: process.env.MIN_APP_VERSION || '1.0.0' }));

app.use('/admin', require('./routes/admin'));
app.use('/', require('./routes/user'));
app.use((_req, res) => res.status(404).json({ error: 'NOT_FOUND' }));
app.use(errorHandler);

app.listen(process.env.PORT || 8080, () => console.log('API listening'));
