const path = require('path');
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require(path.resolve(process.env.GOOGLE_SA_PATH || './serviceAccount.json'))) });
module.exports = {
  db: admin.firestore(),
  auth: admin.auth(),
  messaging: admin.messaging(),
  FieldValue: admin.firestore.FieldValue,
};
