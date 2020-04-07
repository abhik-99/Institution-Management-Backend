const jwt = require('jsonwebtoken');
const FieldValue = require('firebase-admin').firestore.FieldValue;
const {db} = require('./db');
const {secret} = require('../config/secrets');
const bcrypt = require('bcrypt')

exports.login = function(req, res) {
    type = req.headers.type;
    iCode = req.body.icode;
    username = req.body.uname;
    password = req.body.pass;
    if(!iCode || !type || !username || !password) res.send({'status':'failure','message':'Please provide proper data!'})
    // console.log(req.body);
    // console.log(iCode, username, password);
    userCollecRef = db.collection('users')
    .where('type', 'array-contains', type)
    .where('username', '==', username)
    .where('password', '==', password)
    .where('icode', '==', iCode);
    userCollecRef.get()
    .then(snapshot => 
      {
        if (snapshot.empty) {
          res.send({"Error":"User not Found!"});
        } 
        list = [];
        sessions = [];    
        snapshot.forEach(doc => {
          aboutDoc = doc.data();
          list.push({'id':doc.id,'data':aboutDoc});
          if(aboutDoc.session){
            sessions = aboutDoc.session;
          }
        });
        if(list.length > 1){
          res.send({"Error":"Duplicate Users Exists, Signing Halted!"});
          return;
        } 
        // if(list[0].data.lastSignin  && (list[0].data.lastSignin + (60*60*1000) > Date.now() ) ){
        //   res.send({'status':'failure','message':'Timeout!'})
        //   return;
        // }
        if(list[0].firstSignin === true || resetPass === true){
          res.send({'status': 'failure', 'message': 'User must change the default password first!'})
          return;
        }

        let token = jwt.sign({
           exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), //24 hrs
           data: JSON.stringify({ 
              0: type,
              1: iCode,
              2: username,
              3: Date.now()
            })},
           secret);
        sessions.push(token);

        lastSignin = Date.now();

        db.collection('users').doc(list[0].id)
        .update({'lastSignin':lastSignin,'session': sessions})
        .then(()=> res.send({"x-access-token": token, 'user':{ "icode": iCode, 'code': username}}))
        .catch(err=> res.send({'status':'failure','message':err.message}));
        
      })
      .catch(err =>{
        console.log(err);
        res.send(err);
      });
  };

exports.logout = function(req,res){
  token = req.headers['x-access-token'];
  if(!token){
    res.send({"message": "No token received!"});
    res.end();
  } else{
    jwt.verify(token, secret, function(err,decoded){
      if(err){
        console.log("Ivalid token", token);
        res.send({"Message": "Token Invalid"});
      }else{
        tokenData = JSON.parse(decoded.data);
        db.collection('users')
        .where('session', 'array-contains', token)
        .get()
        .then(snap=>{
          snap.forEach(doc=>{
            db.collection('users').doc(doc.id).update({session: FieldValue.delete(), lastSignin: FieldValue.delete()});
          });
        });
        
        db.doc('blacklist/tokens').get()
        .then(doc =>{
          tokens=doc.data();
          tokens = tokens.token_arr;
          tokens.push(token);
          db.doc('blacklist/tokens').update({token_arr: tokens});
          res.send({"Message": "Logged out!"});
        });
      }
    });
  }
};