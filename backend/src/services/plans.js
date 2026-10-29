const { db, FieldValue } = require('../firebase');
const { httpError } = require('../middleware');

const DAY = 864e5;

// Admin assigns a plan with a start date and a number of days. The week repeats from the start date
// until the last day (startDate + repeatDays - 1). The template is copied so later edits never touch other users.
async function assignPlan({ adminId, userId, templateId, startDate, repeatDays }) {
  const userRef = db.collection('users').doc(userId);
  const tplRef = db.collection('planTemplates').doc(templateId);
  const planRef = db.collection('assignedPlans').doc();
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(start.getTime() + (repeatDays - 1) * DAY);
  await db.runTransaction(async (tx) => {
    const [u, t] = await Promise.all([tx.get(userRef), tx.get(tplRef)]);
    if (!u.exists || !t.exists) throw httpError(404, 'NOT_FOUND');
    const oldId = u.data().currentPlanId;
    const old = oldId ? await tx.get(db.collection('assignedPlans').doc(oldId)) : null;
    const tpl = t.data();
    tx.set(planRef, {
      userId, templateId, name: tpl.name, days: tpl.days, numDays: tpl.days.length,
      startDate: start, endDate: end, repeatDays, assignedBy: adminId, progress: {}, createdAt: new Date(),
    });
    if (old?.exists) tx.update(old.ref, { replacedAt: new Date() }); // kept as history
    tx.update(userRef, {
      currentPlanId: planRef.id, planStatus: 'active', planEndDate: end,
      planAssignedAt: new Date(), waitingSince: FieldValue.delete(),
    });
  });
  return planRef.id;
}

// Which day of the repeating week to show on a date.
function dayFor(plan, dateStr) {
  const n = plan.days.length;
  const diff = Math.floor((Date.parse(`${dateStr}T00:00:00Z`) - plan.startDate.toDate().getTime()) / DAY);
  if (diff < 0) return null;
  const index = ((diff % n) + n) % n;
  return { index, day: plan.days[index] };
}

module.exports = { assignPlan, dayFor, DAY };
