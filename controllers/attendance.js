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
   body = req.body;
   absentStudents = body.absentStudents;
   icode = body.icode;
   tcode = body.tcode;
   subject = body.subCode;
   cl = body.class;
   sec = body.section;
   if(!scode || !icode || !tcode || !subject || !cl || !sec) { res.send({'status': 'failure','message': 'Please send proper arguments!'}); }
   attendanceArray = [];
   db.collection(`profiles/students/${icode}`)
   .where('class', '==', cl)
   .where('sec', '==', sec)
   .get()
   .then(snap =>{
       var collectionRef = db.collection(`profiles/students/${icode}`);
       if( !snap) { res.send({'status':'failure', 'error': 'No such School found!'}); }
       absentList = [];
       snap.forEach(doc=>{
           if( doc.id in absentStudents) { absentList.push({'id': doc.id, 'data': doc.data()}); }
       });
       
       if(absentList.length === 0) { res.send({'status': 'success', 'message': 'full attendance detected!'}); }
       else {
           absentList.forEach((student) =>{
               // get absentRecord and append the new absent data
               absentRecord = student.data.absentRecord;

               if( !absentRecord || absentRecord.length === 0 ) absentRecord = [];

               absentRecord.push({'teacher': tcode, 'subject': subject, 'date': Date.now()});
               student.data.absentRecord = absentRecord;
           });
           var count = 0;
           var commitCount = 0;
           var batches = [];
           batches[commitCount] = db.batch();
           absentList.forEach( student =>{
               if(count <= 498){
                   var docRef = collectionRef.doc(student.id);
                   batches[commitCount].update(docRef, student.data.absentRecord);
                   count += 1;
                   var attendance = {
                       schoolCode: icode,
                       teacherCode: tcode,
                       studentCode: student.data.code,
                       class: cl,
                       section: section,
                       subjectCode: subject,
                       date: Date.now()
                   };
                   attendanceArray.push(attendance);
               } else{
                   count = 0;
                   commitCount += 1;
                   batches[commitCount] = db.batch();
               }
           }); //batch created for bulk create in SQL and Commit in firestore.
           
       }
   });
};