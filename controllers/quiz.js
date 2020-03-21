/*
Adding the capability of storing images for questions
*/

const {db} = require('./db');

exports.get_quiz = function(req,res){
    body = req.query;
    icode = body.icode;
    cl = body.class;
    section = body.section;
    author = body.author;
    subject = body.subject; 
    due = body.due_date;

    db.collection(`quizzes/${icode}/${cl}`)
    .get()
    .then(snap =>{
        list = [];
        snap.forEach( doc => list.push(doc.data()));
        if(section){
            console.log(section);
            list = list.filter(each => each.section === section);
        }
        if(author){
            list = list.filter(each => each.author === author);
        }
        if(subject){
            list = list.filter(each => each.subject == subject);
        }
        if(due){
            list.forEach(each => each.due_date._seconds > due);
        }
        res.send({'quiz': list});
    })
    .catch(err => res.send({'message': err}));    
};

//expects a json body in the req.body which conforms to the quiz design.
// IMP: Add a mechanism for checking valid schools
exports.set_quiz = function(req,res){
    console.log("req.body", req.body);
    body = req.body.quiz;
    icode = req.body.icode;
    title = body.title || 'none';
    subject = body.subject;
    cl = body.class;
    author = body.author;
    section = body.section;
    body.quizId = icode + cl + subject + section + author + Date.now().toString();
    console.log(body.quizId);
    due = Date.parse(body.due_date); // send date a string object
    console.log(body);
    if( !cl || !author || !subject || !icode) { res.send({'message':"Please fill all the details!"}); }
    else {
        db.collection(`quizzes/${icode}/${cl}`)
        .add(body)
        .then(ref => res.send({'status': "success", 'quizId': ref.id}))
        .catch(err => res.send({'error': err.err}));
    }
};

//submitting quiz by student
exports.submit_quiz = function(req,res){
    // get student details, check score and put it in the student's profile.
    body = req.body;
    icode = body.icode;
    scode = body.scode;
    quizId = body.quizId;
    score = body.score;
    cl = body.class;
    submission = {"quizId": quizId,"student_code": scode, "score": score, "timestamp": Date.now()};
    if( !icode || !cl || !scode || !quizId || !score) { res.send({'message': "Please provide all details!"}); }
    else {
        //console.log("Body",body);
        db.collection(`profiles/students/${icode}`)
        .where("code", "==", scode)
        .get()
        .then(snap =>{
            student = [];
            snap.docs.forEach(each => student.push({"docId": each.id, "data":each.data()}));
            if(student.length != 1 ) { res.send({'error' : "Duplicate or no student found!"}); }
            else{
                student = student[0];
                quizScores = student.data.quizScores;
                if( !quizScores) quizScores = [];
                quizScores.push(submission);
                //console.log("Student:", student, "Quiz Score:",quizScores);

                db.collection(`profiles/students/${icode}`).doc(student.docId)
                .update({quizScores: quizScores})
                .then(()=>{
                    db.doc(`quizzes/${icode}/${cl}/${quizId}`)
                    .get()
                    .then(doc =>{
                        info = doc.data();
                        submissions = info.submissions;
                        if (!submissions) submissions = [];
                        submissions.push(submission);
                        db.doc(`quizzes/${icode}/${cl}/${quizId}`).update({submissions: submissions})
                        .then( () => res.send({'status': "success", 'message': "successful submission made!"}));                        
                    });
                })
                .catch(err => res.send({'error': err.message}));
            }
        })
        .catch(err => res.send({'error': err.message}));
    }
};

//checking submissions by teacher
exports.get_submissions = function(req,res){
    body = req.body;
    icode = body.icode;
    cl = body.class;
    quizId = body.quizId;
    db.doc(`quizzes/${icode}/${cl}/${quizId}`)
    .get()
    .then( doc =>{
        info = doc.data();
        submissions = info.submissions;
        res.send({'status': 'success', 'submissions': submissions});
    })
    .catch( err => res.send({'status': 'failure', 'error': err.message}));
}