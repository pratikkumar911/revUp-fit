const { db, messaging, FieldValue } = require('../firebase');
const DEAD = ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'];

// Only two kinds of notification are sent: a dietitian reply, and a diet plan assigned.
// Saves to the 7-day history and sends a push. Keep text free of health details (lock screen).
async function notifyUser(uid, { title, body, type }) {
  const now = new Date();
  await db.collection('notifications').add({
    userId: uid, title, body, type, read: false, createdAt: now,
    expiresAt: new Date(now.getTime() + 7 * 864e5), // add a Firestore TTL policy on this field
  });
  const snap = await db.collection('users').doc(uid).get();
  if (snap.get('notifOn') === false) return;
  const tokens = snap.get('fcmTokens') || [];
  if (!tokens.length) return;
  const res = await messaging.sendEachForMulticast({ tokens, notification: { title, body }, data: { type } });
  const bad = tokens.filter((_, i) => !res.responses[i].success && DEAD.includes(res.responses[i].error?.code));
  if (bad.length) await snap.ref.update({ fcmTokens: FieldValue.arrayRemove(...bad) });
}
module.exports = { notifyUser };
