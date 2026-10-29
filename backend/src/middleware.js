const { auth, db } = require('./firebase');

// Verifies the Firebase ID token and reads the role from the custom claim.
async function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'NO_TOKEN' });
  try {
    const d = await auth.verifyIdToken(token);
    req.user = { uid: d.uid, role: d.role === 'admin' ? 'admin' : 'user', authTime: d.auth_time };
    next();
  } catch {
    res.status(401).json({ error: 'BAD_TOKEN' });
  }
}
const requireUser = (req, res, next) =>
  req.user.role === 'user' ? next() : res.status(403).json({ error: 'FORBIDDEN' });

// Admin routes re-check the account itself (not just the token), so a removed or disabled
// admin loses access immediately instead of when their token expires (up to an hour).
async function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'FORBIDDEN' });
  try {
    const rec = await auth.getUser(req.user.uid);
    if (rec.disabled || rec.customClaims?.role !== 'admin') return res.status(403).json({ error: 'FORBIDDEN' });
    next();
  } catch (e) { next(e); }
}

// Records which admin did what, and to whom.
const audit = (action) => (req, _res, next) => {
  db.collection('auditLogs')
    .add({ adminId: req.user.uid, action, userId: req.params.id || req.body?.userId || null, createdAt: new Date() })
    .catch(console.error);
  next();
};

const validate = (schema) => (req, res, next) => {
  const r = schema.safeParse(req.body);
  if (!r.success) return res.status(400).json({ error: 'INVALID', details: r.error.flatten() });
  req.body = r.data;
  next();
};

const h = (fn) => (req, res, next) => fn(req, res, next).catch(next); // async error wrapper
const errorHandler = (err, _req, res, _next) => {
  if (err.status) return res.status(err.status).json({ error: err.code || 'ERROR', message: err.message });
  console.error(err);
  res.status(500).json({ error: 'SERVER_ERROR' });
};
const httpError = (status, code, message) => Object.assign(new Error(message || code), { status, code });

module.exports = { requireAuth, requireUser, requireAdmin, audit, validate, h, errorHandler, httpError };
