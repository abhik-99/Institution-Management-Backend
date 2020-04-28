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
            docs = docs.filter( doc => doc.data.author.toLowerCase() === author);
        }
        if(subject){
            docs = docs.filter( doc => doc.data.sub.toLowerCase() === subject);
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
    sub = (body.sub)? body.sub.toLowerCase() : "Null";
    author = (body.author)? body.author : "Null";
    try {
        chapters = JSON.parse(body.chapters)
        tdate = Date.parse(date)
        f = parseFloat(fm)
    } catch (error) {
        res.send({'status':'failure', 'message': "Please send proper data format!", 'error': error.message})
        return;
    }
    if(!section || typeof title !== 'string' || !icode || !cl || (!exam_type || ( exam_type !== '1' && exam_type !== '2'))) {
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
    .where('section', '==', section)
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
                if(section === info.section) { studentList.push({'docId': doc.id, 'scode':info.code, 'sname': info.name}); }
            });
        }
        if(studentList.length === 0) res.send({'status': 'failure','error': 'No students Found for given school/class/section!'});

        //adding exam to the collection
        db.collection('exam')
        .add({
            'author': author,
            'chapters':chapters, 
            'full_marks': fm, 
            'title': title,
            'sub': sub,
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
    try {
        var docId = body.id ; //document Id of the exam in firestore
        var marksList = JSON.parse(body.marksList); // marks of each student
        var avg = 0;
        var max = 0
        //getting the average and maximum.
        marksList.forEach( student => {
            avg += student.marks
            if(student.marks > max) max = student.marks;
        });
        avg = avg/marksList.length;

        if(!docId) throw 'Please send the doc ID!'
    } catch (error) {
        res.send({'status': 'failure', 'error': error.message})
        return;
    }


    db.collection('exam').doc(docId)
    .get()
    .then(doc => { 
        if(!doc.exists) { 
            res.send({'status': 'failure', 'error': 'No such exam entry found in the system!'}); 
            return
        }

        info = doc.data();
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
                else if(info.section === dInfo.section) {studentList.push({'id': doc.id, 'data': dInfo.examScores}); docList.push(doc.id); console.log('True')}
                console.log(info.section, dInfo.section)
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
                fStudent[0].examScores.push({'tcode': info.author, 'type': info.exam_type, 'score': marks[0].marks, 'avgMarks': avg, 'maxMarks': max})
                batch.update(docRef,{ 'examScores': fStudent[0].examScores});
            })//completed making changes to received data.
            
            db.collection('exam').doc(docId).update({student_list: info.student_list, 'avgMarks': avg, 'maxMarks': max})
            .then(()=>{
                batch.commit()
                .then(()=> res.send({'status': 'success', 'message': 'Successfully Updated the Exam Status!'}))
            })
            .catch( err => res.send({'status': 'failure', 'error': err.message}));

        })
        .catch( err => res.send({'status': 'failure', 'error': err.message}));   
    })
    .catch( err => res.send({'status': 'failure', 'error': err.message}));
};

exports.get_exams_summary = function(req,res){
    params = req.params;
    query = req.query;

    icode = params.icode;
    cl = params.class;
    sec = params.sec;

    tcode = query.tcode;
    sub = query.sub;

    if( !tcode){
        res.send({'status':'failure', 'message': 'Please send the teacher code in the query'})
        return;
    }

    db.collection('exam')
    .where('icode','==',icode)
    .where('class','==',cl)
    .where('section','==',sec)
    .where('author', '==', tcode)
    .get()
    .then( snap=>{
        if(snap.empty){
            res.send({'status':'failure', 'message': 'Teacher has not given any'})
            return;
        }
        data = [];
        snap.docs.forEach( doc =>{
            doc = _.pick(doc, ['author','class','section', 'subject', 'title', 'chapters','full_marks','avgMarks', 'maxMarks', 'exam_type'])
            if(subject && doc.subject === subject)  data.push(doc)
            else data.push(doc)
        })
        res.send({'status':'success', 'data': data})
    })
    .catch(err => res.send({'status': 'failure','error': err.message}));

}