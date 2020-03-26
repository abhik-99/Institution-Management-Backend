/*
Adding the capability of storing images for questions
*/

const {db} = require('./db');
var {upload_file,get_file_ref} = require('../gcp_buckets/file_handling');
var {bucketName} = require('../config/secrets');

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
        snap.forEach( doc => list.push({'id': doc.id, 'data':doc.data()}));
        if(section){
            console.log(section);
            list = list.filter(each => each.data.section === section);
        }
        if(author){
            list = list.filter(each => each.data.author === author);
        }
        if(subject){
            list = list.filter(each => each.data.subject == subject);
        }
        if(due){
            list.forEach(each => Date.parse(each.data.due_date) > Date.parse(due));
        }
        res.send({'quiz': list});
    })
    .catch(err => res.send({'message': err}));    
};

//POST request (Edit this handler)
exports.set_quiz = function(req,res){
    params = req.params;

    body = req.fields;
    files = req.files;

    //URL parameters
    icode = params.icode;
    cl = params.class;
    if(files) keys = Object.keys(files);
    flag = false;

    for( i = 0; i<keys.length; i++){
        if(files[keys[i]].type !== 'application/pdf' && files[keys[i]].type !== 'image/png')
        {  
            flag = keys[i];
            break;
        }
    }

    //URL body
    var {title, subject, tcode, dueDate, questions, section, syllabus} = body;
    //console.log("Images",images)
    try {
        date = Date.parse(dueDate) || undefined
        questions = JSON.parse(questions); //an array of stringified JSON of questions being parsed
        syllabus = JSON.parse(syllabus);
        if(!section) section = 'all';
    } catch (error) {
        console.log(err)
        res.send({'status':'failure', 'message':'Please send proper data!'})
    }

    if( !title || !tcode || !subject || !questions || !date || keys>questions.length || flag) {
        // res.setHeader('Connection','close')/
        res.send({'status':'failure', 'message':"1.Please send proper data!"})
    }
    else {
        //checking qhich questions contain images
        filePathMap = [];
        flag = false;
        var index = 0
        for( ; index<questions.length; index++){
            if(questions[index].file === "true"){
                // const i = questions.indexOf(question)
                file = files[`fileq${index}`];
                if(!file){
                    flag = true;
                    break;
                }
                filename = `quizzies/images/${icode}/${cl}/${tcode}/${section}/${title}-${dueDate}-q${index}-${Date.now()}-${file.name}`
                questions[index].filePath = filename;
                questions[index].fileType = file.type;
                filePathMap.push({'filename': file.path, 'uploadName': filename})
                console.log("True for", index,"Question", questions[index])
            }
        }
        if(flag){
            res.send({'status':'failure','message':`Image for Question ${index} not found!`})
            return;
        }
        //added file path in GCP bucket to the respective questions and imagemap created
        //adding quiz doc to collection.
        db.collection(`quizzes/${icode}/${cl}`).add({
            'title': title,
            'author': tcode,
            'subject': subject,
            'questions': questions,
            'due_date': dueDate,
        })
        .then(async (ref)=>{
            //uploading images to bucket.
            await Promise
            .all(filePathMap.map( each => {
                return upload_file(bucketName, each.filename, each.uploadName)
            }))
            .then(() => res.send({'status':'success','message':`Quiz ${ref.id} added!`}))
            .catch(err => res.send({'error': err.message}));
        })
        .catch(err => res.send({'error': err.message}));
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
    db.doc(`quizzes/${icode}/${cl}/${docId}`)
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