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
                    list.push({'id': doc.id, 'name': info.name, 'code': info.code});
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
    /*
    1. Get the doc ids of the absent students, the teacher's code, subject (subjectCode)
    in the POST request.
    2. Fetch the students and add to their profiles the absent data. 
    3. Add the details of the absent students to the the absence database.
    4. Increment the numClasses in the Classes database for that specific teacher's period.
    */
};