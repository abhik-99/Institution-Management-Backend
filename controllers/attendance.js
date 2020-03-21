let {db} = require('./db');
// let {SQL_USER, SQL_PASSWORD, SQL_DATABASE, INSTANCE_CONNECTION_NAME} = require('../config/db');
// let {Sequelize} = require('sequelize');
// let {Attendance} = require('../models/attendance');
let {Classes, Attendance} = require('../models');

//GET request to get the details of the students of a class
exports.get_students = function(req,res){
    params = req.params;
    icode = params.icode;
    cl = params.class;
    sec = params.sec;
    console.log(params);
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
        .catch(err => res.send({'status':'failure', 'error': err.message}));
    }    
};

//POST request to give the attendace.
exports.give_attendance = function(req,res){
    /*
    1. Get the doc ids of the absent students, the teacher's code, subject (subjectCode)
    in the POST request.
    2. Fetch the students and add to their profiles the absent data. 
    3. Add the details of the absent students to the the absence database.
    4. Increment the numClasses in the Classes database for that specific teacher's period.
    */
   params = req.params;
   body = req.body;
   //URL Parameters   
   icode = params.icode;  
   cl = params.class;   
   sec = params.sec;

   //URL Body
   tcode = body.tcode;
   subject = body.subCode;
   absentStudents = body.absentStudents;

   if(!icode || !tcode || !subject || !cl || !sec ) { res.send({'status': 'failure','message': 'Please send proper arguments!'}); }
   else{
        db.collection(`profiles/students/${icode}`)
        .where('class', '==', cl)
        .where('sec', '==', sec)
        .get()
        .then(snap =>{
            
            if( !snap) { res.send({'status':'failure', 'error': 'No such School found!'}); }

            var collectionRef = db.collection(`profiles/students/${icode}`);
            absentList = [];
            snap.forEach(doc=>{
                if( absentStudents.includes(doc.id)) {  absentList.push({'id': doc.id, 'data': doc.data()}); }
            });
            
            if(absentList.length === 0) { res.send({'status': 'success', 'message': 'full attendance detected!'}); }
            else {

                //updating number of clases and then committing the changes
                Classes.findOne({ where: {schoolCode: icode, teacherCode: tcode, class: cl, section: sec, subjectCode: subject} })
                .then(row =>{
                    absentList.forEach((student) =>{
                        // get absentRecord and append the new absent data
                        absentRecord = student.data.absentRecord;
    
                        if( !absentRecord || absentRecord.length === 0 ) absentRecord = [];
    
                        absentRecord.push({'id': row.dataValues.id,'teacherCode': tcode, 'subject': subject, 'date': Date.now()});
                        student.data.absentRecord = absentRecord;
                    });                   
    
                    batch = db.batch();
                    absentList.forEach( student =>{
                        var docRef = collectionRef.doc(student.id);
                        batch.update(docRef,{ 'absentRecord': student.data.absentRecord});
                    });

                    if(row) return row.increment('numClasses')
                    else return Promise.reject(Error('No Match Found in DB!'))
                   }).then(()=>{
                       batch.commit().then(() =>{

                       }) 
                       res.send({'status': 'success','message': `Attendance/Absence added ${absentList.length}.`})                   
                    
                })
                .catch( err => res.send({'status': 'failure', 'error in SQL': err.message}));
                
            }
        })
        .catch( err => res.send({'status': 'failure', 'error in db': err.message}));
    }
};
//GET request for student attendance.
exports.get_student_attendance = function(req,res){
    params = req.params;
    query = req.query;
    //URL parameters
    icode = params.icode;
    cl = params.class;
    sec = params.sec;

    //URL Query;
    docId = query.id;
    tcode = query.tcode;
    subject = query.subCode;

    if( !id ) { res.send({'status': 'failure', 'error': 'Please send proper information!'}); }

    db.collection(`profiles/students/${icode}`).doc(docId)
    .get()
    .then(doc =>{
        if(!doc) { res.send({'status':'failure', 'error': 'No such student found!'}); }
        
        student = doc.data();
        absentRecord = student.absentRecord;

        if(tcode) { absentRecord = absentRecord.filter( record => record.teacherCode === tcode); }
        if(subject) { absentRecord = absentRecord.filter( record => record.subject === subject); }
        if(absentRecord.length === 0) { res.send({'status': 'success', 'message': 'Student has not been absent yet!'}); }
        else{
            tMap = {};
            absentRecord.forEach(record =>{
                if(!tMap[record.teacherCode]) { tMap[record.teacherCode] = [];}
                else{ 
                    if((!record.subject in tMap[record.teacherCode])){
                        tMap[record.teacherCode].push(record.subject);
                    }
                }
            });
            //implement the attendance accquiring logic from Classes.
            numClasses = [];
            
            res.send({
                'status': 'success', 
                'data':{
                    'scode': student.code,
                    'sname': student.name,
                    'absentRecord': absentRecord,
                    'numClassesRecord': numClasses
                }
            });

        }
    });
}