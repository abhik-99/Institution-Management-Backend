// const admin = require('firebase-admin');

// let serviceAccount = require('../service/service_key.json');

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// let db = admin.firestore();
let {db} = require('./db');
exports.show_firebase_data = function(req,res,next){
    let profiles_school_ref = db.doc('profiles/schools/a101/a101');
    profiles_school_ref.get()
    .then(doc =>{
        // if (!doc.exists) {
        //     console.log('No such document!');
        //   } else {
            console.log('Document data:', doc.data());
            res.send(doc.data());
         // }
    })
    .catch(err=> {
        console.log("Error Occured!",err);
        res.send(err);
    });
};