const jwt = require('jsonwebtoken');
let {db} = require('./db');
let {secret} = require('../config/secrets');

exports.login = function(req, res) {
    type = req.headers.type;
    iCode = req.body.icode;
    username = req.body.uname;
    password = req.body.pass;
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
          list.push(doc.id);
          if(aboutDoc.session){
            sessions = aboutDoc.session;
          }
        });
        if(list.length > 1){
          res.send({"Error":"Duplicate Users Exists, Signing Halted!"});
        }
        console.log(sessions)
        let token = jwt.sign({
           exp: Math.floor(Date.now() / 1000) + (60 * 60),
           data: JSON.stringify({ 
              0: type,
              1: username,
              2: iCode,
              3:Date.now()
            })},
           secret);
        sessions.push(token);
        console.log("Session Tokens",sessions);
        db.collection('users').doc(list[0])
        .update({session: sessions});
        res.send({"x-access-token": token});
        
      })
      .catch(err =>{
        console.log(err);
        res.send(err);
      });
  };
  exports.logout = function(req,res,next){
    token = req.headers['x-access-token'];
    jwt.verify(token, secret, function(err,decoded){
      if(err){
        res.send({"Message": "Token Invalid"});
      }
      blackToken = token;
      db.doc('blacklist/tokens').get()
      .then(doc =>{
        tokens=doc.data();
        tokens = tokens.token_arr;
        tokens.push(token);
        db.doc('blacklist/tokens').update({token_arr: tokens});
        res.send({"Message": "Token Blaclisted!"});
      });
    });
  };