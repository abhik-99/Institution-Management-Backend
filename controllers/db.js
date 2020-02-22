const admin = require('firebase-admin');

let serviceAccount = require('../service/service_key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

exports.db = admin.firestore();