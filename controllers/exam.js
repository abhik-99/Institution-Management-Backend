/* 
Exam Types:
1 - Class Test
2 - Unit Test
3 - Term Test
*/
let {exam} = require('../config/exam_map');
let {db} = require('./db');

//GET Request
exports.get_exams = function(req, res){
    query = req.query;
    params = req.params;
    //following via URL parameters
    icode = params.icode;
    cl = params.class;
    examType = params.examType;

    //following via URL query
    section = (query.sec)? query.sec.toLowerCase() : undefined;
    subject = (query.subject)? query.subject.toLowerCase() : undefined;
    author = (query.tcode)? query.tcode.toLowerCase() : undefined;

    db.collection('exam')
    .where('icode', '==', icode)
    .where('class', '==', cl)
    .get()
    .then(snap =>{
        docs= [];
        snap.docs.forEach( doc => docs.push({id: doc.id, data: doc.data()}));
        if(section && section !=='all'){
            console.log(section);
            docs = docs.filter( doc => doc.data.section === section);
        }
        if(examType && examType !== 'all'){
            t = exam[examType];
            if(t){
                docs = docs.filter( doc => doc.data.exam_type === t);
            } else {
                res.send({'status':'failure', 'message': 'Exam Type Invalid!'})
                return;
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

//POST request from teacher
exports.set_exam = function(req,res){
    body = req.body;

    //URL parameter    
    date = body.date;
    cl = body.class;
    icode = body.icode;
    section = body.sec;
    exam_type = body.examType;
    fm = body.fullMarks;
    title = body.title;

    try {
        chapters = JSON.parse(body.chapters)
        tdate = Date.parse(date)
        f = parseFloat(fm)
    } catch (error) {
        res.send({'status':'failure', 'message': "Please send proper data format!"})
        return;
    }
    if(!section || typeof title !== 'string' || !icode || !cl || (!exam_type || ( examType !== '1' && examType !== '2' && examType !== '3'))) {
        res.send({'status': 'failure', 'error': 'Please provide all the proper details!'})
        return
    }
    if(exam_type){
        t = exam[exam_type];
        if(!t){ 
            res.send({'status': 'failure', 'error': 'Please provide all the proper details!'}); 
            return;
        }
        else { exam_type = t; }
    }
    db.collection(`profiles/students/${icode}`)
    .where('class', '==',cl)
    .where('section', '==', sec)
    .get()
    .then(snap =>{
        //Pushing in eligible student for the exam
        studentList = [];
        if( snap.empty){
            res.send({'status':'failure', 'message': 'No such student found!'})
            return;
        }
        if(section === 'all'){
            snap.forEach(doc => {
                info = doc.data();
                studentList.push({'docId': doc.id, 'scode':info.code, 'sname': info.name})
            });
        }else{
            snap.forEach(doc => {
                info = doc.data();
                if(section === info.sec) { studentList.push({'docId': doc.id, 'scode':info.code, 'sname': info.name}); }
            });
        }
        if(studentList.length === 0) res.send({'status': 'failure','error': 'No students Found for given school/class/section!'});

        //adding exam to the collection
        db.collection('exam')
        .add({
            'chapters':chapters, 
            'full_marks': fm, 
            'title': title,
            'section':section, 
            'date':date,
            'class':cl, 
            'icode':icode, 
            'exam_type':exam_type, 
            'student_list': studentList
        })
        .then(()=> res.send({'status': 'success','message': 'Exam Added!'}))
        .catch(err => res.send({'status': 'failure', 'error': err.message}));
    })
    .catch( err => res.send({'status': 'failure', 'error': err.message}));
};

//PATCH request
//grades the exam. receives the exam's docID and scores from the frontend (assigned by teacher).
// the exam's docId is sent by get_exams handler
exports.grade_exam = function(req,res){
    body = req.body;
    docId = body.examId; //document Id of the exam in firestore
    marksList = body.marksList; // marks of each student
    db.collection('exam').doc(docId)
    .get()
    .then(doc => {
        if(!doc) { res.send({'status': 'failure', 'error': 'No such exam entry found in the system!'}); }
        info = doc.data();

        // //first get the details of the class and then use batch update to update
        // var collectionRef = db.collection(`profiles/students/${info.icode}`);
        // batch = db.batch();
        // info.student_list.forEach( student => {
        //     // marks = marksList.filter( m => m.scode === student.scode && m.sname === student.sname);
        //     // //there cannot be more than 1 student with the same student name and code
        //     // if(marks.length === 1){
        //     //     student.marks_obtained = marks[0].marks;

        //     //     //updating marks simultaneously in student profile
        //     //     db.collection(`profiles/students/${info.icode}`).doc(student.docId)
        //     //     .get()
        //     //     .then(doc =>{
        //     //         infoDoc = doc.data();
        //     //         examScores = infoDoc.examScores;
        //     //         if(!examScores) { examScores = []; }
        //     //         examScores.push({'examId':docId, 'exam_type':info.exam_type, 'marks': student.marks_obtained});
        //     //         db.collection(`profiles/students/${info.icode}`).doc(student.docId)
        //     //         .update({examScores: examScores})
        //     //         .then()
        //     //         .catch( err => res.send({'status': 'failure', 'error': err.message}));
        //     //     });

        //     // }else if (marks.length > 1) {
        //     //     res.send({'status': 'failure', 'error': 'Duplicate Student Entry Found in Student List!'});
        //     // }
        //     var docRef = collectionRef.doc(student.docId)
        //     batch.update(docRef, )

        // });
        var batch = db.batch();
        var collectionRef = db.collection(`profiles/students/${info.icode}`);
        db.collection(`profiles/students/${info.icode}`)
        .where('class', '==', info.class)
        .get()
        .then(snap =>{
            if(snap.empty){
                res.send({'status':'failure', 'message':' No students in this class!'})
                return;
            }

            studentList = [];
            docList =[]
            snap.forEach(doc =>{
                dInfo = doc.data();
                if( info.section ==='all') {studentList.push({'id': doc.id, 'data': dInfo.examScores}); docList.push(doc.id);}
                else if(info.section === dInfo.sec) {studentList.push({'id': doc.id, 'data': dInfo.examScores}); docList.push(doc.id);}
            });
            if( studentList.length === 0 ){
                res.send({'status': 'failure', 'message': 'No students of that section found!'})
                return;
            }

            //making changes to DB (Batch writes)
            info.student_list.forEach(student =>{
                marks = marksList.filter( m => m.scode === student.scode && m.sname === student.sname);
                fStudent = studentList.filter(s => student.docId === s.id)
                if(marks.length > 1 || fStudent.length > 1){
                    res.send({'status':'failure', 'message': 'Duplicate students found!'})
                    return;
                }

                student.marks_obtained = marks[0].marks;

                if( !docList.includes(student.docId)){
                    res.send({'status':'failure', 'message': 'Student(s) not found!'})
                    return;
                }

                var docRef = collectionRef.doc(student.docId);
                if(!fStudent[0].examScores ) fStudent[0].examScores = [];
                fStudent[0].examScores.push({'tcode': info.author, 'type': info.exam_type, 'score': marks[0].marks})
                batch.update(docRef,{ 'examScores': fStudent[0].examScores});
            })//completed making changes to received data.
            
            db.collection('exam').doc(docId).update({student_list: info.student_list})
            .then(()=>{
                batch.commit()
                .then(()=> res.send({'status': 'success', 'message': 'Successfully Updated the Exam Status!'}))
            })
            .catch( err => res.send({'status': 'failure', 'error': err.message}));

        })
        .catch( err => res.send({'status': 'failure', 'error': err.message}));
        // db.collection('exam').doc(docId).update({student_list: info.student_list})
        // .then(()=> res.send({'status': 'success', 'message': 'Successfully Updated the Exam Status!'}))
        // .catch( err => res.send({'status': 'failure', 'error': err.message}));        
    })
    .catch( err => res.send({'status': 'failure', 'error': err.message}));
};