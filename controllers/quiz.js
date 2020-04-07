/*
Adding the capability of storing images for questions
*/

const {db} = require('./db');
var {get_file_ref} = require('../gcp_buckets/file_handling');
var {bucketName} = require('../config/secrets');
let {Classes} = require('../models')

//GET Request
exports.get_quiz = function(req,res){
    query = req.query;
    params = req.params;
    //URL parameter
    icode = params.icode;
    cl = (params.class)? params.class.toLowerCase() : undefined;
    section = (params.sec)? params.sec.toLowerCase() : undefined;
    //URL Query
    author = (query.author)? query.author.toLowerCase() : undefined;
    subject = (query.sub)? query.sub.toLowerCase() : undefined; 
    due = query.dueDate;
    console.log(author, subject, due);

    db.collection('quizzes')
    .where('icode', '==', icode)
    .get()
    .then(snap =>{
        if(snap.empty) {
            res.send({'status': 'failure', 'message':'No such School Found!'})
            return;
        }
        list = [];
        //filtering and pushing it to
        snap.forEach(doc=> list.push({'id': doc.id, 'data': doc.data()}));
        if(section !== 'all') list = list.filter( each => each.data.section === section)
        if(cl !== 'all') list = list.filter( each => each.data.class === cl)
        if(author) list = list.filter( each => each.data.author === author)
        if(subject) list = list.filter( each => each.data.subject === subject)
        if(due) list = list.filter( each => each.data.due_date === due)
        res.send({'status': 'success', 'quiz': list})
    })
    .catch(err => res.send({'status': 'failure','error': err.message}));
};

//POST request (Edit this handler)
exports.set_quiz = function(req,res){
    params = req.params;

    body = req.body;
    files = req.files;

    //URL parameters
    icode = params.icode;
    cl = params.class;
    section = params.sec;

    //URL body
    var {title, subject, tcode, tname, dueDate, questions, syllabus} = body;
    
    
    try {
        date = Date.parse(dueDate) || undefined
        questions = JSON.parse(questions); //an array of stringified JSON of questions being parsed
        syllabus = JSON.parse(syllabus); //String Array (Stringified) chapters
        cl = cl.toLowerCase();
        section = section.toLowerCase();
        if(typeof section !== 'string' || section === 'all' || cl === 'all' ) throw 'Please give proper data';
        if(files){
            if(files.length> questions.length)
            throw 'More Files than Questions!'
        }
    } catch (error) {
        console.log(error)
        res.send({'status':'failure', 'message':error.message})
        return;
    }

    if( !title || !tcode || !tname || !subject || !questions || !date || syllabus.length === 0 || !section) {
        res.send({'status':'failure', 'message':"Please send proper data!"})
        return;
    }else {
        //checking qhich questions contain images
        flag = false;
        var index = 0
        var promises = [];
        for( ; index<questions.length; index++){
            if(questions[index].file === "true"){
                // const i = questions.indexOf(question)
                if(!files){
                    res.send({'status':'failure','message':'Question(s) contains file but file not supplied!'})
                    return;
                }
                file = files.filter( file => file.fieldname === `fileq${index}`)[0];
                if(!file){
                    res.send({'status':'failure','message':`File for Question ${index} not found!`})
                    return;
                }
                filename = `quizzies/images/${icode}/${cl}/${tcode}/${section}/${title}-${dueDate}-q${index}-${Date.now()}-${file.originalname}`
                questions[index].filePath = filename;
                questions[index].fileType = file.mimetype;

                promises.push(new Promise((resolve, reject)=>{
                    const blob = get_file_ref(bucketName,filename)
                    blob.createWriteStream({
                      metadata: { contentType: file.mimetype }
                    }).on('finish', async response => {
                      resolve(response)
                    }).on('error', err => {
                      reject('upload error: ', err)
                    }).end(file.buffer)
                  }))
            }
        }

        //added file path in GCP bucket to the respective questions and imagemap created
        //adding quiz doc to collection.
        Promise.all(promises).then(response =>{
            db.collection(`quizzes`).add({
                'title': title,
                'author': tcode,
                'author_name': tname,
                'subject': subject,
                'questions': questions,
                'due_date': dueDate,
                'syllabus': syllabus, 
                'section': section,
                'class':cl,
                'icode': icode
            })
            .then((ref)=>{
                //uploading images to bucket.
                Classes.findOne({
                    where:{
                        schoolCode: icode,
                        teacherCode: tcode,
                        class: cl,
                        section: section,
                        subjectCode: subject
                    }
                })
                .then( row=>{
                    if(row){
                        row.increment('numQuizzes').then(()=> res.send({'status':'success', 'message': `Quiz uploaded Successfully! ${ref.id}`}))
                        
                    }else{
                        res.send({'status': 'success', 'message': `Quiz uploaded by not Recorded! ${ref.id}`})
                    }
                })
                .catch(err => res.send({'status': 'failure','error': err.message}));
                
            })
            .catch(err => res.send({'status': 'failure','error': err.message}));
        })
        
    }

};

//GET Request
exports.get_quiz_file = function(req,res){
    params = req.params;
    query = req.query;

    //URL parameters
    icode = params.icode;
    cl = params.class;

    //URL query
    docId = query.id;
    q = query.q;
    db.doc(`quizzes/${docId}`)
    .get()
    .then( doc =>{
        if(!doc) res.send({'status':'failure', 'message':'Please send proper data!'})
        data = doc.data();
        question = data.questions[q];
        if(!question.file || !question.fileType) res.send({'status':'failure','message':'Question has no image!'})
        var ref = get_file_ref(bucketName,question.filePath);
        
        var stream = ref.createReadStream();
        res.writeHead(200, {'Content-Type': question.fileType });
        stream.on('data', function (data) {
            res.write(data);
            });
        
            stream.on('error', function (err) {
            console.log('error reading stream', err);
            });
        
            stream.on('end', function () {
            res.end();
            });
        
    })
    .catch(err => res.send({'status':'failure','error': err.message}));
};

//POST request
exports.submit_quiz = function(req,res){
    // get student details, check score and put it in the student's profile.
    body = req.body;
    icode = body.icode;
    scode = body.scode;
    quizId = body.quizId;
    score = body.score;
    cl = body.class;
    submission = {"quizId": quizId,"student_code": scode, "score": score, "timestamp": Date.now()};
    if( !icode || !cl || !scode || !quizId || !score) { res.send({'status':'failure','message': "Please provide all details!"}); }
    else {
        //console.log("Body",body);
        db.collection(`profiles/students/${icode}`)
        .where("code", "==", scode)
        .get()
        .then(snap =>{
            student = [];
            snap.docs.forEach(each => student.push({"docId": each.id, "data":each.data()}));
            if(student.length != 1 ) { res.send({'status':'failure','message' : "Duplicate or no student found!"}); }
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
                .catch(err => res.send({'status':'failure','error': err.message}));
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
    quizId = query.id;
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