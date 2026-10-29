// Usage: node scripts/setAdmin.js dietitian@example.com
// Creates/updates the admin. The role lives in a custom claim that only this script can set.
require('dotenv').config();
const { auth, db } = require('../src/firebase');
(async () => {
  const email = process.argv[2];
  if (!email) throw new Error('Pass the admin email');
  const user = await auth.getUserByEmail(email); // create the account first (sign up in the app or Firebase console)
  await auth.setCustomUserClaims(user.uid, { role: 'admin' });
  await db.collection('users').doc(user.uid).set({ role: 'admin', email, name: 'Dietitian', createdAt: new Date() }, { merge: true });
  console.log('Admin set for', email, '- sign out and in again to refresh the token.');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
