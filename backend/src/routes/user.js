const express = require('express');
const { z } = require('zod');
const { db, auth, FieldValue } = require('../firebase');
const { requireAuth, requireUser, validate, h, httpError } = require('../middleware');
const { dayFor, DAY } = require('../services/plans');

const router = express.Router();
router.use(requireAuth);

const userRef = (uid) => db.collection('users').doc(uid);
const cleanList = (s) => [...new Set(String(s || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean))];
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// Called once after the app creates the Firebase account. Role is ALWAYS 'user' here.
router.post('/me/init', requireUser, validate(z.object({ name: z.string().min(1).max(80) })), h(async (req, res) => {
  const ref = userRef(req.user.uid);
  if (!(await ref.get()).exists) {
    const fb = await auth.getUser(req.user.uid);
    await ref.set({ role: 'user', name: req.body.name, email: fb.email || null, planStatus: 'none', notifOn: true, fcmTokens: [], createdAt: new Date() });
  }
  res.json({ ok: true });
}));

router.get('/me', h(async (req, res) => {
  const s = await userRef(req.user.uid).get();
  if (!s.exists) throw httpError(404, 'NO_PROFILE');
  res.json({ id: s.id, ...s.data() });
}));

router.post('/me/consent', requireUser, validate(z.object({ version: z.string().max(20) })), h(async (req, res) => {
  await userRef(req.user.uid).update({ consentVersion: req.body.version, consentAt: new Date() });
  res.json({ ok: true });
}));

const profileSchema = z.object({
  gender: z.enum(['male', 'female', 'other']),
  age: z.number().int().min(18, 'You must be 18 or older').max(100),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(25).max(300),
  diet: z.enum(['veg', 'nonveg', 'jain']),
  goal: z.string().max(1000).default(''),        // goal + health notes ("tell us about yourself")
  allergiesText: z.string().max(500).default(''),
  dislikesText: z.string().max(500).default(''),
});
router.put('/me', requireUser, validate(profileSchema), h(async (req, res) => {
  const ref = userRef(req.user.uid);
  const u = (await ref.get()).data();
  if (!u?.consentAt) throw httpError(403, 'CONSENT_REQUIRED');
  const b = req.body;
  const upd = { ...b, allergies: cleanList(b.allergiesText), dislikes: cleanList(b.dislikesText), updatedAt: new Date() };
  // First time the profile is completed, the user joins the dietitian's 'waiting for a plan' queue.
  if (!u.currentPlanId && !u.profileCompletedAt) { upd.profileCompletedAt = new Date(); upd.waitingSince = new Date(); upd.planStatus = 'preparing'; }
  await ref.update(upd);
  res.json({ ok: true });
}));

router.patch('/me', requireUser, validate(z.object({ notifOn: z.boolean() })), h(async (req, res) => {
  await userRef(req.user.uid).update({ notifOn: req.body.notifOn, updatedAt: new Date() });
  res.json({ ok: true });
}));

router.post('/me/fcm-token', validate(z.object({ token: z.string().min(20) })), h(async (req, res) => {
  await userRef(req.user.uid).update({ fcmTokens: FieldValue.arrayUnion(req.body.token) });
  res.json({ ok: true });
}));

// Called on logout so a signed-out phone stops receiving this user's notifications.
router.post('/me/fcm-token/remove', validate(z.object({ token: z.string().min(20) })), h(async (req, res) => {
  await userRef(req.user.uid).update({ fcmTokens: FieldValue.arrayRemove(req.body.token) });
  res.json({ ok: true });
}));

// ---- Plan for a date. Repeats weekly until access ends. ----
router.get('/me/plan', requireUser, h(async (req, res) => {
  const dateResult = dateStr.safeParse(req.query.date);
  if (!dateResult.success) throw httpError(400, 'INVALID_DATE');
  const date = dateResult.data;
  const u = (await userRef(req.user.uid).get()).data();
  if (!u?.currentPlanId) return res.json({ status: u?.planStatus || 'none' });
  const planSnap = await db.collection('assignedPlans').doc(u.currentPlanId).get();
  if (!planSnap.exists) return res.json({ status: 'none' });
  const plan = planSnap.data();
  const planData = {
    id: planSnap.id,
    userId: req.user.uid,
    templateId: plan.templateId,
    name: plan.name,
    days: plan.days,
    progress: plan.progress || {},
    startDate: plan.startDate.toDate(),
    endDate: plan.endDate.toDate(),
    repeatDays: plan.repeatDays,
  };
  // After the last day the plan stops showing; before the start date it is 'upcoming'.
  if (Date.parse(`${date}T00:00:00Z`) > plan.endDate.toDate().getTime()) return res.json({ status: 'ended', endedOn: plan.endDate.toDate(), plan: planData });
  const d = dayFor(plan, date);
  if (!d) return res.json({ status: 'upcoming', startDate: plan.startDate.toDate(), plan: planData });
  const done = Object.entries(plan.progress || {}).filter(([k, v]) => v && k.startsWith(`${date}|`)).map(([k]) => k);
  res.json({ status: 'active', date, dayIndex: d.index, day: d.day, done, plan: planData });
}));

router.post('/me/plan/progress', requireUser, validate(z.object({ date: dateStr, meal: z.string().max(20), itemId: z.string().max(40), done: z.boolean() })), h(async (req, res) => {
  const u = (await userRef(req.user.uid).get()).data();
  if (!u?.currentPlanId) throw httpError(400, 'NO_PLAN');
  const { date, meal, itemId, done } = req.body;
  await db.collection('assignedPlans').doc(u.currentPlanId).set({ progress: { [`${date}|${meal}|${itemId}`]: done } }, { merge: true });
  res.json({ ok: true });
}));

router.get('/me/notifications', requireUser, h(async (req, res) => {
  const s = await db.collection('notifications').where('userId', '==', req.user.uid).orderBy('createdAt', 'desc').limit(50).get();
  const cut = Date.now() - 7 * DAY;
  res.json(s.docs.map((d) => ({ id: d.id, ...d.data() })).filter((n) => n.createdAt.toDate().getTime() > cut));
}));
router.delete('/me/notifications/:id', requireUser, h(async (req, res) => {
  const ref = db.collection('notifications').doc(req.params.id);
  const notification = await ref.get();
  if (!notification.exists || notification.get('userId') !== req.user.uid) throw httpError(404, 'NOT_FOUND');
  await ref.delete();
  res.json({ ok: true });
}));

// ---- Ask us ----
router.post('/queries', requireUser, validate(z.object({ text: z.string().min(1).max(2000) })), h(async (req, res) => {
  const u = (await userRef(req.user.uid).get()).data();
  const q = db.collection('queries').doc();
  const now = new Date();
  await q.set({ userId: req.user.uid, userName: u.name, status: 'open', preview: req.body.text.slice(0, 120), lastMessageAt: now, createdAt: now });
  await q.collection('messages').add({ from: 'user', text: req.body.text, createdAt: now });
  res.json({ id: q.id });
}));
router.get('/queries', requireUser, h(async (req, res) => {
  const s = await db.collection('queries').where('userId', '==', req.user.uid).orderBy('lastMessageAt', 'desc').get();
  const rows = await Promise.all(s.docs.map(async (d) => {
    const messages = await d.ref.collection('messages').orderBy('createdAt').get();
    return { id: d.id, ...d.data(), messages: messages.docs.map((m) => ({ id: m.id, ...m.data() })) };
  }));
  res.json(rows);
}));
router.get('/queries/:id/messages', requireUser, h(async (req, res) => {
  const q = await db.collection('queries').doc(req.params.id).get();
  if (!q.exists || q.data().userId !== req.user.uid) throw httpError(404, 'NOT_FOUND');
  const m = await q.ref.collection('messages').orderBy('createdAt').get();
  res.json(m.docs.map((d) => ({ id: d.id, ...d.data() })));
}));
router.post('/queries/:id/messages', requireUser, validate(z.object({ text: z.string().min(1).max(2000) })), h(async (req, res) => {
  const ref = db.collection('queries').doc(req.params.id);
  const q = await ref.get();
  if (!q.exists || q.data().userId !== req.user.uid) throw httpError(404, 'NOT_FOUND');
  const now = new Date();
  await ref.collection('messages').add({ from: 'user', text: req.body.text, createdAt: now });
  await ref.update({ status: 'open', lastMessageAt: now, preview: req.body.text.slice(0, 120) });
  res.json({ ok: true });
}));

// ---- Delete account. Client re-enters password first (Firebase re-auth), then calls this. ----
router.delete('/me', requireUser, h(async (req, res) => {
  if (Date.now() / 1000 - req.user.authTime > 300) throw httpError(401, 'REAUTH_REQUIRED');
  const uid = req.user.uid;
  const qs = await db.collection('queries').where('userId', '==', uid).get();
  await Promise.all(qs.docs.map((d) => db.recursiveDelete(d.ref)));
  for (const col of ['assignedPlans', 'notifications']) {
    const s = await db.collection(col).where('userId', '==', uid).get();
    await Promise.all(s.docs.map((d) => d.ref.delete()));
  }
  await userRef(uid).delete();
  await auth.deleteUser(uid);
  res.json({ ok: true });
}));

module.exports = router;
