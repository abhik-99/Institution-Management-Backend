/* 
Exam Types:
1 - Class Test
2 - Unit Test
3 - Term Test
*/
let {exam} = require('../config/exam_map');
let {db} = require('./db');

exports.get_exams = function(req, res){
    body = req.query;
    icode = body.icode;
    cl = body.class;
    examType = body.examType;
    section = body.section;
    subject = body.subject;
    author = body.tcode;
    // console.log(body);
    db.collection('exam')
    .get()
    .then(snap =>{
        docs= [];
        snap.docs.forEach( doc => docs.push({id: doc.id, data: doc.data()}));
        if(icode){
            docs = docs.filter( doc => doc.data.icode === icode);
        }
        if(cl){
            docs = docs.filter( doc => doc.data.class === cl);
        }
        if(section){
            console.log(section);
            docs = docs.filter( doc => doc.data.section === section);
        }
        if(examType){
            t = exam[examType];
            if(t){
                docs = docs.filter( doc => doc.data.exam_type === t);
            }
        }
        if(author){
            docs = docs.filter( doc => doc.data.author === author);
        }
        if(subject){
            docs = docs.filter( doc => doc.data.subject === subject);
        }
        // console.log("Docs:",docs);
        res.send({'status': 'success', 'exams': docs});

    });
};

//expects a json body which conforms to the exam schema (somewhat) (application/json)
exports.set_exam = function(req,res){
    body = req.body;
    chapters = body.chapters;
    section = body.section;
    date = body.date;
    cl = body.class;
    icode = body.icode;
    exam_type = body.exam_type;
    if(!section || typeof date != 'string' || !icode || !cl || !exam_type) {res.send({'status': 'failure', 'error': 'Please provide all the proper details!'}); }
    if(exam_type){
        t = exam[exam_type];
        if(!t){ res.send({'status': 'failure', 'error': 'Please provide all the proper details!'});}
        else { body.exam_type = t; }
    }
    db.collection(`profiles/students/${icode}`)
    .where('class', '==',cl)
    .get()
    .then(snap =>{
        studentList = [];
        if(section === 'all'){
            snap.forEach(doc => {
                info = doc.data();
                studentList.push({'docId': doc.id, 'scode':info.code, 'sname': info.name})
            });
        }else{
            snap.forEach(doc => {
                info = doc.data();
                if(section === sec) { studentList.push({'docId': doc.id, 'scode':info.code, 'sname': info.name}); }
            });
        }
        if(studentList.length === 0) { res.send({'status': 'failure','error': 'No students Found for given school/class/section!'}); }
        body.student_list = studentList;
        db.collection('exam')
        .add(body)
        .then(()=> res.send({'status': 'success','message': 'Exam Added!'}))
        .catch(err => res.send({'status': 'failure', 'error': err.message}));
    })
    .catch( err => res.send({'status': 'failure', 'error': err.message}));
};
//aMxNQqWIsE1PDJ5TGJtY
//grades the exam. receives the exam's docID and scores from the frontend (assigned by teacher).
// the exam's docId is sent by get_exams handler
exports.grade_exam = function(req,res){
    body = req.body;
    docId = body.examId; //document Id of the exam in firestore
    marksList = body.marksList;
    db.collection('exam').doc(docId)
    .get()
    .then(doc => {
        if(!doc) { res.send({'status': 'failure', 'error': 'No such exam entry found in the system!'}); }
        info = doc.data();
        //console.log("Exam Details", info);
        info.student_list.forEach( student => {
            marks = marksList.filter( m => m.scode === student.scode && m.sname === student.sname);
            //there cannot be more than 1 student with the same student name and code
            if(marks.length === 1){
                student.marks_obtained = marks[0].marks;

                //updating marks simultaneously in student profile
                db.collection(`profiles/students/${info.icode}`).doc(student.docId)
                .get()
                .then(doc =>{
                    infoDoc = doc.data();
                    examScores = infoDoc.examScores;
                    if(!examScores) { examScores = []; }
                    examScores.push({'examId':docId, 'exam_type':info.exam_type, 'marks': student.marks_obtained});
                    db.collection(`profiles/students/${info.icode}`).doc(student.docId)
                    .update({examScores: examScores})
                    .then()
                    .catch( err => res.send({'status': 'failure', 'error': err.message}));
                });

            }else if (marks.length > 1) {
                res.send({'status': 'failure', 'error': 'Duplicate Student Entry Found in Student List!'});
            }
        });
        db.collection('exam').doc(docId).update({student_list: info.student_list})
        .then(()=> res.send({'status': 'success', 'message': 'Successfully Updated the Exam Status!'}))
        .catch( err => res.send({'status': 'failure', 'error': err.message}));        
    })
    .catch( err => res.send({'status': 'failure', 'error': err.message}));
};