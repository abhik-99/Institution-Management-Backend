let {db, sequelize} = require('./db');
// let {SQL_USER, SQL_PASSWORD, SQL_DATABASE, INSTANCE_CONNECTION_NAME} = require('../config/db');
// let {Sequelize} = require('sequelize');
let {Attendance} = require('../models/attendance');
let {Classes} = require('../models/class_info');

exports.get_students = function(req,res){
    body = req.query;
    icode = body.icode;
    cl = body.class;
    sec = body.sec;
    if( !icode || !cl || !sec) { res.send({'status':'failure', 'error': "Please provide proper parameters"});}
    else{
        db.collection(`profiles/students/${icode}`)
        .where('class', '==', cl)
        .where('sec', '==', sec)
        .get()
        .then(snap => {

            if( !snap) { res.send({'status':'failure', 'error': 'No such School found!'}); }
            else{
                list = [];
                snap.forEach(doc => {
                    info = doc.data();
                    list.push({'name': info.name, 'code': info.code});
                });
                res.send({'status':'success','students': list});
            }
        })
        .catch(err => {
            console.log("Error",err); res.send({'status':'failure', 'error': err});
        });
    }    
};
exports.give_attendance = function(req,res){
    sequelize.authenticate()
    .then((obj)=> {console.log("connection successful!",obj); })
    .catch((err)=> {console.log("Error Occured!",err); });
    sequelize
    .sync({
        logging: console.log,
        force: true
    })
    .then(()=>{
        console.log("All done!");
        sequelize.close()
        .then(()=>console.log('Connection Closed'))
        .catch(err => console.log('Error Occured!', err));
        res.send("All ok!");
    })
    .catch(err =>{
        console.log("Error",err);
        res.send("SNAFU!!");
    });


};