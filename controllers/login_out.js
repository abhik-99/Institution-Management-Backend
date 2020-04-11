const jwt = require('jsonwebtoken');
const FieldValue = require('firebase-admin').firestore.FieldValue;
const {db} = require('./db');
const {secret} = require('../config/secrets');
const bcrypt = require('bcrypt')
const _ = require('lodash')
const {transport} = require('../mail/index')

exports.login = function(req, res) {
    type = req.headers.type;
    iCode = req.body.icode;
    username = req.body.uname;
    password = req.body.pass;
    if(!iCode || !type || !username || !password) res.send({'status':'failure','message':'Please provide proper data!'})
    // console.log(req.body);
    // console.log(iCode, username, password);
    db.collection('users')
    .where('type', 'array-contains', type)
    .where('username', '==', username)
    .where('icode', '==', iCode)
    .get()
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
        if(list[0].firstSignin || list[0].resetPass ){
          res.send({'status': 'failure', 'message': 'User must change the Password first!'})
          return;
        }
        if(!bcrypt.compareSync(password, list[0].data.password)){
          res.send({'status': 'failure','message': 'Passwords not Matched!'})
          return;
        }
        let token = jwt.sign({
           exp: Math.floor(Date.now() / 1000) + (60 * 60 * 72), //72 hrs
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

exports.recover_password = function(req,res){
  try {
    token = req.headers['x-access-token'];
    decoded = jwt.verify(token, secret);
  } catch (error) {
    res.send({'status': 'failure', 'error': error})
  }
  db.collection('users')
  .where('type', 'array-contains', type)
  .where('username', '==', username)
  .where('icode', '==', iCode)
  .get()
  .then( snap => {
    if(snap.empty || snap.docs.length !== 1) throw 'No or Duplicate Errors detected!'

    var user;
    snap.forEach( doc => user = {id: doc.id, data: _.pick(doc.data(), ['email', 'username'])})

    if(!user.data.email) throw 'User Email not defined! Contact Admin.'

    var token = jwt.sign({
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 72), //72 hrs
      data: JSON.stringify({ 
         0: type,
         1: iCode,
         2: username,
         3: Date.now()
       })},
      secret);

    db.collection('users').doc(user.id).update({resetPass: true, resetPassToken: token})

    transport.sendMail({
      to: user.data.email,
      from: "test@thestudieapp.com",
      subject: "Password Recovery Initiated.",
      html: `<h1> Please head to the <a href="http://fp.thestudieapp.com/?t=${token}">Link</a> to change password</h1><br>
      Dear ${user.data.username},<br>A password recovery request was initiated against your account recently.Please head
      onto this <a href="http://fp.thestudieapp.com/?t=${token}">link</a> to reset your password.<br>If this was not you, we recommend
      that you change your password immediately as it might be vulnerable and also contact your admin immediately.
      <br>You will not be able to login until you have changed your password.
      <br>Hope you are happy with our services.<br><br>
      With Best Regards,<br>The Studie App Team`
    })
    res.send({'status': 'success', 'message': 'Password Change initiated!'})
  })
  .catch( err => res.send({'status': 'failure','error': err}))

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