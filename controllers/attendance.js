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
                    var toBeAbsent = false;
                    if(info.leave_applications){
                        info.leave_applications.forEach( leave =>{
                            if(Date.parse(leave.start_date)< Date.now() && Date.now< leave.end_date) toBeAbsent = true;
                        })
                    }
                    list.push({'id': doc.id, 'name': info.name, 'code': info.code, 'appliedAbsence': toBeAbsent});
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
   period = body.period;  
   try {
    date = Date.parse(body.date)
    absentStudents = JSON.parse(absentStudents)
    date = body.date;
    if( typeof +period !== 'number') throw 'Incorrect period'
   } catch (error) {
       res.send({'status': 'failure', 'message': error.message})
   }
   if(!icode || !tcode || !subject || !cl || !sec || !period) { res.send({'status': 'failure','message': 'Please send proper arguments!'}); }
   else{
        db.collection(`profiles/students/${icode}`)
        .where('class', '==', cl)
        .where('sec', '==', sec)
        .get()
        .then(snap =>{
            
            if(snap.empty) { 
                res.send({'status':'failure', 'error': 'No such School found!'}); 
                return;
            }

            var collectionRef = db.collection(`profiles/students/${icode}`);

            //absentList will contain the student details.
            absentList = [];
            snap.forEach(doc=>{
                if( absentStudents.includes(doc.id)) {  absentList.push({'id': doc.id, 'data': doc.data()}); }
            });
            
            if(absentList.length === 0) { res.send({'status': 'success', 'message': 'full attendance detected!'}); }
            else {

                //updating number of clases and then committing the changes
                Classes.findOne({ where: {schoolCode: icode, teacherCode: tcode, class: cl, section: sec, subjectCode: subject} })
                .then(row =>{
                    if(!row){
                        res.send({'status':'failure', 'message': 'no rows found!'})
                        return;
                    }
                    var attendanceArray = [];
                    absentList.forEach((student) =>{
                        // get absentRecord and append the new absent data
                        absentRecord = student.data.absentRecord;
    
                        if( !absentRecord || absentRecord.length === 0 ) absentRecord = [];

                        //Pushing absent record into student profile.
                        absentRecord.push({'id': row.dataValues.id,'teacherCode': tcode, 'subject': subject, 'date': date, 'period': period});
                        student.data.absentRecord = absentRecord;
                        //Pushing attendanceArray for bulk create
                        attendanceArray.push({
                            schoolCode: icode,
                            teacherCode: tcode,
                            class: cl,
                            section: sec,
                            subjectCode: subject,
                            studentCode: student.data.code,
                            studentName: student.data.name,
                            period: period,
                            date: date
                        })
                    });                   
    
                    batch = db.batch();
                    absentList.forEach( student =>{
                        var docRef = collectionRef.doc(student.id);
                        batch.update(docRef,{ 'absentRecord': student.data.absentRecord});
                    });

                    if(row) return row.increment('numClasses')
                    else return Promise.reject(Error('No Match Found in DB!'))
                   }).then(()=>{
                       //Committing to DB.
                       batch.commit().then(() =>{
                           res.send({'status': 'success', 'message': `${attendanceArray.length} absences detected!`})

                           //Bulk create of attendance
                           Attendance.bulkCreate(attendanceArray)
                           .catch(err=> console.log("Error in Uploading Attendance!", err))
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

    //URL query
    try{
        date = Date.parse(query.date);
        subject = query.subject;
        tcode = query.tcode;
    }catch(error){
        res.send({'status': 'failure', 'error': error.message})
        return;
    }

    Attendance.findAll({ where: {
        schoolCode: icode,
        class: cl,
        section: sec
    }})
    .then( row =>{
        if(!row){
            res.send({'status':'failure','message':'No matching entries found!'})
            return;
        }
        var data = row.dataValues;
        if( tcode ) data = data.filter(each => each.teacherCode === tcode)
        if( date ) try {
            data = data.filter(each => Date.parse(each.date) === date)
        } catch (error) {
            res.send({'status':'failure','error' : `While filtering - ${error.message}`})
            return;
        } 
        if( subject ) data = data.filter(each => each.subjectCode === subject)
        res.send({'status':'success', 'data':data})
    })
    .catch( err => res.send({'status': 'failure', 'error': err.message}))
};