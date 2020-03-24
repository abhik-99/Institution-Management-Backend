let {db} = require('./db');
let {Classes, Attendance} = require('../models');

//GET request to get the details of the students of a class
exports.get_students = function(req,res){
    params = req.params;
    icode = params.icode;
    cl = params.class;
    sec = params.sec;

    if( !icode || !cl || !sec) { res.send({'status':'failure', 'error': "Please provide proper parameters"});}
    else{
        db.collection(`profiles/students/${icode}`)
        .where('class', '==', cl)
        .where('sec', '==', sec)
        .get()
        .then(snap => {

            if( !snap) { res.send({'status':'failure', 'error': 'No such School/Class/Section found!'}); }
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
   subject = body.subject;
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
                           Attendance.build({
                               schoolCode: icode,
                               teacherCode: tcode,
                               class: cl,
                               section: sec,
                               subjectCode: subject,
                               numAbsent: absentList.length,
                           })
                           .save()
                           .then(()=>res.send({'status': 'success','message': `Attendance/Absence added ${absentList.length}.`}))
                           .catch( err => res.send({'status': 'failure', 'error in SQL': err.message}));
                       })                    
                })
                .catch( err => res.send({'status': 'failure', 'error': err.message}));
            }
        })
        .catch( err => res.send({'status': 'failure', 'error': err.message}));
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
    subject = query.subject;

    if( !docId ) { res.send({'status': 'failure', 'error': 'Please send proper information!'}); }

    db.collection(`profiles/students/${icode}`).doc(docId)
    .get()
    .then(async (doc) =>{
        if(!doc) { res.send({'status':'failure', 'error': 'No such student found!'}); }
        
        student = doc.data();
        absentRecord = student.absentRecord;

        //start implementation from here
        //If tcode present then give attendance for that teacher.
        //if subCode is present then give attendance for that specific subject.
        //otherwise give overall attendance.
        studentAttendance = [];
        if(tcode) { 
            absentRecord = absentRecord.filter( record => record.teacherCode === tcode); 
            const rows = await Classes.findAll({
                where: {schoolCode: icode, teacherCode: tcode, class: cl, section: sec},
                attributes: ['subjectCode','numClasses']
            });
            if(!rows) res.send({'status': 'failure', 'message': 'No such Teacher Found!'})
            else{              
                    rows.forEach(row =>{
                        data = row.dataValues;
                        absences = absentRecord.filter( each => each.subject === data.subjectCode).length;
                        //console.log(data,absences);
                        a = (data.numClasses - absences) / data.numClasses; //total number of classes present
                        studentAttendance.push({'tcode': tcode, 'subject': data.subjectCode, 'attendance': a});
                    });
                    console.log(studentAttendance);
            }
            
        }
        if(subject) { 
            if(studentAttendance.length === 0){
                const rows = await Classes.findAll({
                    where: {schoolCode: icode, subjectCode: subject, class: cl, section: sec},
                    attributes: ['teacherCode','numClasses']
                });
                if(!rows) res.send({'status': 'failure', 'message': 'No such Teacher Found!'})
                else{                              
                        rows.forEach(row =>{
                            data = row.dataValues;
                            absences = absentRecord.filter( each => each.teacherCode === data.teacherCode).length;
                            a = (data.numClasses - absences) / data.numClasses | 0; //total number of classes present
                            studentAttendance.push({'tcode': data.teacherCode, 'subject': subject, 'attendance': a});
                        });
                }
            }else{
                studentAttendance = studentAttendance.filter( each=> each.subject === subject);
            }
             
        }
        if( !subject && !tcode){
            const rows = await Classes.findAll({
                where: {schoolCode: icode, class: cl, section: sec},
                attributes: ['subjectCode','numClasses'],
                group: ['subjectCode']
            });
            rows.forEach( row =>{
                data = row.dataValues;
                absences = absentRecord.filter( each => each.subject === data.subjectCode).length;
                a = (data.numClasses - absences) / data.numClasses;
                studentAttendance.push({'subject': data.subjectCode,'attendance':a});
            });
        }
        if(studentAttendance.length === 0) res.send({'status': 'success','message': 'The Student has not been absent yet!'})  
        else res.send({'status': 'success', 'attendance': studentAttendance})     
    });
}

//GET Request
exports.get_class_attendance = function(req,res){
    params = req.params;
    query = req.query;
    //URL parameters
    icode = params.icode;
    cl = params.class;
    sec = params.sec;

    //URL Query;
    tcode = query.tcode;
    subject = query.subject;
    
    db.collection(`profiles/students/${icode}`)
    .where('class', '==', cl)
    .where('sec', '==', sec)
    .get()
    .then(async (snap)=>{
        docs = [];
        snap.forEach(doc => docs.push({'id':doc.id, 'data': doc.data()}));
        strength = docs.length;

        if(!snap || strength === 0) res.send({'status': 'failure','message': 'No Students in the class'})

        var classRows = await Classes.findAll({ where:{schoolCode: icode, class: cl, section: sec}});
        var attendanceRows = await Attendance.findAll({ where:{schoolCode: icode, class: cl, section: sec}});

        if( !classRows || !attendanceRows) res.send({'status': 'failure', 'message': 'Please send proper data!'});

        var classAttendance = [];
        if(tcode){
            classRows = classRows.filter( row => row.dataValues.teacherCode === tcode);
            classRows.forEach( row=>{
                data = row.dataValues;
                var absence = 0;
                absence = attendanceRows
                .filter( row => row.dataValues.teacherCode === tcode && row.dataValues.subjectCode === data.subjectCode)
                .forEach( row => absence += row.numAbsent);
                absence /= data.numClasses;
                avgAttendance = (strength - absence) / strength;
                classAttendance.push({'tcode': tcode, 'subjectCode': data.subjectCode, 'attendance': avgAttendance});
            })
        }
        if(subject){
            if(classAttendance.length === 0){
                classRows = classRows.filter( row => row.dataValues.subjectCode === subject);
                classRows.forEach( row=>{
                    data = row.dataValues;
                    var absence = 0;
                    absence = attendanceRows
                    .filter( row => row.dataValues.subjectCode === subject && row.dataValues.teacherCode === data.teacherCode)
                    .forEach( row => absence += row.numAbsent);
                    absence = absence/data.numClasses | 0;
                    avgAttendance = (strength - absence) / strength;
                    classAttendance.push({'tcode': tcode, 'subjectCode': data.subjectCode, 'attendance': avgAttendance});
                })
            }else{
                classAttendance = classAttendance.filter( each => each.subjectCode === subject);
            }
        }
        if( !tcode && !subject){
            classRows.forEach( row=>{
                data = row.dataValues;
                var absence = 0;
                absence = attendanceRows
                .filter( row => row.dataValues.subjectCode === subject && row.dataValues.teacherCode === data.teacherCode)
                .forEach( row => absence += row.numAbsent);
                absence = absence / data.numClasses | 0;
                avgAttendance = (strength - absence) / strength;
                classAttendance.push({'tcode': tcode, 'subjectCode': data.subjectCode, 'attendance': avgAttendance});
            })
        }
        if(classAttendance.length === 0) res.send({'status':'success', 'message':'Class hasn\'t been added!'})
        else res.send({'status': 'success', 'attendance': classAttendance});
    })
    .catch( err => res.send({'status': 'failure', 'error': err.message}));
};