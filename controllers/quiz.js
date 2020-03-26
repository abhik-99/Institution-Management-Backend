/*
Adding the capability of storing images for questions
*/

const {db} = require('./db');
const {uploadDir} = require('../config/secrets');
var formidable = require('formidable');
const form = formidable({uploadDir: uploadDir})

//GET Request
exports.get_quiz = function(req,res){
    query = req.query;
    params = req.params;
    //URL parameter
    icode = params.icode;
    cl = params.class;
    section = params.sec;
    //URL Query
    author = query.author;
    subject = query.subject; 
    due = query.dueDate;

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

//POST request (Edit this handler)
exports.set_quiz = function(req,res){
    params = req.params;

    form.parse(req, (err, fields, files)=>{
        if(err) {
            res.send({'status':'failure','message':err.Message})
            return;
        }
        body = fields;
        images = files;
        keys = Object.keys(images);
        keys.forEach( key => {
            if(images[key].type !== 'application/pdf' && images[key].type !== 'img/png')
            {
                flag = true;
            }
        })
        if(flag){
            res.send({'status':'failure','message':'Only Images(<20kB) and PDFs(<50kB) allowed'})
            return;
        }
        //URL parameters
        icode = params.icode;
        cl = params.class;

        //URL body
        var {title, subject, tcode, dueDate, questions, section, syllabus} = body;
        //console.log("Images",images)
        try {
            date = Date.parse(dueDate) || undefined
            questions = JSON.parse(questions);
            syllabus = JSON.parse(syllabus);

        } catch (error) {
            console.log(err)
            res.send({'status':'failure', 'message':'Please send proper data!'})
        }
        if( !title || !tcode || !subject || !questions || !date || keys>questions.length) res.send({'status':'failure', 'message':"1.Please send proper data!"})
        else {
            questions.forEach( question =>{
                if(question.image === "true"){
                    const i = questions.indexOf(question)
                    img = images[`imgq${i}`];
                    if(!img){
                        res.send({'status':'failure','message':`Image for Question ${i} not found!`})
                        return;
                    }
                    
                }
            })
        }
    })
};

//POST request
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

//GET request
//checking submissions by teacher
exports.get_submissions = function(req,res){
    query = req.query;
    params = req.params;
    //URL parameters
    icode = params.icode;
    cl = params.class;
    sec = params.sec;

    //URL query
    quizId = query.quizId;
    db.doc(`quizzes/${icode}/${cl}/${quizId}`)
    .get()
    .then( doc =>{
        if(!doc) res.send({'status':'failure','message':'Please send proper details!'})
        info = doc.data();
        submissions = info.submissions;
        res.send({'status': 'success', 'submissions': submissions});
    })
    .catch( err => res.send({'status': 'failure', 'error': err.message}));
}