const express = require('express');
const { z } = require('zod');
const { db } = require('../firebase');
const { requireAuth, requireAdmin, audit, validate, h, httpError } = require('../middleware');
const { assignPlan, DAY } = require('../services/plans');
const { notifyUser } = require('../services/notify');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// ---- Users ----
// 'none' = work queue: users waiting for their first plan, plus users whose plan has ended. Longest waiting first.
// Needs composite indexes (planStatus + waitingSince, planStatus + planEndDate): Firestore prints a link on first run.
router.get('/users', h(async (req, res) => {
  const { filter = 'all', q = '' } = req.query;
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  let docs;
  if (filter === 'none') {
    const [waiting, ended] = await Promise.all([
      db.collection('users').where('planStatus', '==', 'preparing').orderBy('waitingSince', 'asc').limit(300).get(),
      db.collection('users').where('planStatus', '==', 'active').where('planEndDate', '<', today).limit(300).get(),
    ]);
    docs = [...waiting.docs, ...ended.docs];
  } else {
    let ref = db.collection('users').where('role', '==', 'user');
    if (filter === 'active') ref = ref.where('planStatus', '==', 'active');
    docs = (await ref.limit(300).get()).docs;
  }
  let rows = docs.map((d) => {
    const u = d.data();
    const ended = u.planStatus === 'active' && u.planEndDate && u.planEndDate.toDate() < today;
    const since = ended ? u.planEndDate.toDate() : u.waitingSince?.toDate() || null;
    return {
      id: d.id, role: u.role, name: u.name, email: u.email, age: u.age, gender: u.gender, heightCm: u.heightCm, weightKg: u.weightKg,
      diet: u.diet, goal: u.goal, allergies: u.allergies, allergiesText: u.allergiesText, dislikes: u.dislikes, dislikesText: u.dislikesText,
      profileCompletedAt: u.profileCompletedAt?.toDate() || null, createdAt: u.createdAt?.toDate() || null,
      currentPlanId: u.currentPlanId || null,
      planStatus: ended ? 'ended' : u.planStatus, planEndDate: u.planEndDate?.toDate() || null,
      waitingSince: since, waitingHours: filter === 'none' && since ? Math.floor((now - since) / 36e5) : 0,
    };
  });
  if (filter === 'active') rows = rows.filter((r) => r.planStatus === 'active');
  if (filter === 'none') rows.sort((x, y) => x.waitingSince - y.waitingSince);
  if (q) rows = rows.filter((r) => `${r.name}`.toLowerCase().includes(String(q).toLowerCase()));
  res.json(rows);
}));
router.get('/users/:id', audit('view_user'), h(async (req, res) => {
  const s = await db.collection('users').doc(req.params.id).get();
  if (!s.exists) throw httpError(404, 'NOT_FOUND');
  const u = s.data();
  res.json({ id: s.id, ...u, bmi: u.heightCm && u.weightKg ? +(u.weightKg / (u.heightCm / 100) ** 2).toFixed(1) : null });
}));

router.get('/plans', h(async (_req, res) => {
  const s = await db.collection('assignedPlans').orderBy('createdAt', 'desc').limit(500).get();
  res.json(s.docs.map((d) => {
    const p = d.data();
    return {
      id: d.id, ...p,
      startDate: p.startDate.toDate(),
      endDate: p.endDate.toDate(),
    };
  }));
}));

// ---- Templates ----
const item = z.object({ id: z.string().max(40), name: z.string().min(1).max(100), quantity: z.string().max(40), calories: z.number().optional(), notes: z.string().max(300).optional(), directions: z.string().max(2000).optional() });
const nutrition = z.object({
  calories: z.number().finite().nonnegative(),
  protein: z.number().finite().nonnegative(),
  carbs: z.number().finite().nonnegative(),
  fat: z.number().finite().nonnegative(),
  fiber: z.number().finite().nonnegative(),
}).partial();
const dayNutrition = z.object({
  breakfast: nutrition.optional(),
  lunch: nutrition.optional(),
  dinner: nutrition.optional(),
  snack: z.object({ pre: nutrition.optional(), post: nutrition.optional() }).partial().optional(),
}).partial();
const day = z.object({
  breakfast: z.array(item),
  lunch: z.array(item),
  dinner: z.array(item),
  snack: z.object({ pre: z.array(item), post: z.array(item) }),
  nutrition: dayNutrition.optional(),
});
const tplSchema = z.object({
  name: z.string().min(1).max(100),
  days: z.array(day).min(1).max(7),
  durationDays: z.number().int().min(1).max(365).optional(),
});

router.get('/templates', h(async (_req, res) => {
  const s = await db.collection('planTemplates').orderBy('updatedAt', 'desc').get();
  const counts = {};
  (await db.collection('assignedPlans').select('templateId').get()).forEach((d) => { counts[d.get('templateId')] = (counts[d.get('templateId')] || 0) + 1; });
  res.json(s.docs.map((d) => ({
    id: d.id, name: d.get('name'), days: d.get('days'),
    numDays: d.get('days').length, durationDays: d.get('durationDays') || d.get('days').length,
    assignedTo: counts[d.id] || 0,
  })));
}));
router.get('/templates/:id', h(async (req, res) => {
  const s = await db.collection('planTemplates').doc(req.params.id).get();
  if (!s.exists) throw httpError(404, 'NOT_FOUND');
  res.json({ id: s.id, ...s.data() });
}));
router.post('/templates', validate(tplSchema), audit('create_template'), h(async (req, res) => {
  const ref = await db.collection('planTemplates').add({ ...req.body, createdBy: req.user.uid, createdAt: new Date(), updatedAt: new Date() });
  res.json({ id: ref.id });
}));
router.put('/templates/:id', validate(tplSchema), audit('edit_template'), h(async (req, res) => {
  await db.collection('planTemplates').doc(req.params.id).update({ ...req.body, updatedAt: new Date() }); // assigned copies are unaffected
  res.json({ ok: true });
}));
router.delete('/templates/:id', audit('delete_template'), h(async (req, res) => {
  await db.collection('planTemplates').doc(req.params.id).delete();
  res.json({ ok: true });
}));
router.post('/templates/:id/clone', audit('clone_template'), h(async (req, res) => {
  const s = await db.collection('planTemplates').doc(req.params.id).get();
  if (!s.exists) throw httpError(404, 'NOT_FOUND');
  const ref = await db.collection('planTemplates').add({ ...s.data(), name: `${s.get('name')} (copy)`, createdBy: req.user.uid, createdAt: new Date(), updatedAt: new Date() });
  res.json({ id: ref.id });
}));

// ---- A user's ongoing plan: view, edit, delete ----
router.get('/users/:id/plan', audit('view_user_plan'), h(async (req, res) => {
  const u = (await db.collection('users').doc(req.params.id).get()).data();
  const p = u?.currentPlanId ? await db.collection('assignedPlans').doc(u.currentPlanId).get() : null;
  if (!p?.exists) throw httpError(404, 'NO_PLAN');
  const d = p.data();
  res.json({ id: p.id, ...d, startDate: d.startDate.toDate(), endDate: d.endDate.toDate() });
}));

// Edit this user's copy only: meals, name, start date, or number of days. Templates are not touched.
const planEditSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  days: z.array(day).min(1).max(7).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  repeatDays: z.number().int().min(1).max(365).optional(),
}).refine((b) => Object.keys(b).length > 0, 'Nothing to change');
router.put('/users/:id/plan', validate(planEditSchema), audit('edit_user_plan'), h(async (req, res) => {
  const uref = db.collection('users').doc(req.params.id);
  const u = (await uref.get()).data();
  if (!u?.currentPlanId) throw httpError(404, 'NO_PLAN');
  const pref = db.collection('assignedPlans').doc(u.currentPlanId);
  const p = (await pref.get()).data();
  const b = req.body;
  const start = b.startDate ? new Date(`${b.startDate}T00:00:00Z`) : p.startDate.toDate();
  const repeatDays = b.repeatDays ?? p.repeatDays;
  const end = new Date(start.getTime() + (repeatDays - 1) * DAY);
  const upd = { startDate: start, endDate: end, repeatDays, updatedAt: new Date(), updatedBy: req.user.uid };
  if (b.name) upd.name = b.name;
  if (b.days) { upd.days = b.days; upd.numDays = b.days.length; }
  await pref.update(upd);
  await uref.update({ planEndDate: end, planStatus: 'active' });
  res.json({ ok: true });
}));

// ---- Assign ----
router.post('/assignments', validate(z.object({ userId: z.string(), templateId: z.string(), startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), repeatDays: z.number().int().min(1).max(365) })), audit('assign_plan'), h(async (req, res) => {
  const planId = await assignPlan({ adminId: req.user.uid, ...req.body });
  notifyUser(req.body.userId, { title: 'Your plan is ready', body: 'Open the app to see your meals.', type: 'plan' }).catch(console.error);
  res.json({ planId });
}));

// ---- Queries ----
router.get('/queries', h(async (req, res) => {
  let ref = db.collection('queries').orderBy('lastMessageAt', 'desc');
  if (req.query.status) ref = db.collection('queries').where('status', '==', req.query.status).orderBy('lastMessageAt', 'desc');
  const s = await ref.limit(200).get();
  res.json(s.docs.map((d) => ({ id: d.id, ...d.data() })));
}));
router.get('/queries/:id', audit('view_query'), h(async (req, res) => {
  const q = await db.collection('queries').doc(req.params.id).get();
  if (!q.exists) throw httpError(404, 'NOT_FOUND');
  const m = await q.ref.collection('messages').orderBy('createdAt').get();
  res.json({ id: q.id, ...q.data(), messages: m.docs.map((d) => ({ id: d.id, ...d.data() })) });
}));
router.post('/queries/:id/reply', validate(z.object({ text: z.string().min(1).max(2000) })), audit('reply_query'), h(async (req, res) => {
  const ref = db.collection('queries').doc(req.params.id);
  const q = await ref.get();
  if (!q.exists) throw httpError(404, 'NOT_FOUND');
  const now = new Date();
  await ref.collection('messages').add({ from: 'admin', adminId: req.user.uid, text: req.body.text, createdAt: now });
  await ref.update({ status: 'answered', lastMessageAt: now, preview: req.body.text.slice(0, 120) });
  notifyUser(q.data().userId, { title: 'Your dietitian replied', body: 'Open Ask us to read the answer.', type: 'reply' }).catch(console.error);
  res.json({ ok: true });
}));
router.post('/queries/:id/resolve', audit('resolve_query'), h(async (req, res) => {
  await db.collection('queries').doc(req.params.id).update({ status: 'resolved' });
  res.json({ ok: true });
}));

module.exports = router;
