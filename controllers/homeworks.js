const _ = require('lodash');
var {upload_file,download_link, get_file_ref} = require('../gcp_buckets/file_handling');
var {bucketName} = require('../config/secrets');
let {db} = require('./db');

//POST requests to assign homework. Uses FormidablemMiddleware
exports.assign_homework = function(req,res){
    file = req.file;
    body = req.body;
    //URL Body
    icode = body.icode;
    author = body.tcode;
    cl = body.class;
    sec = body.sec;
    sub = body.subject;
    chapter = body.chapter;
    try {
        homework = JSON.parse(body.homework)
        title = homework.title;
        desc = homework.desc;
    } catch (error) {
        res.send({'status':'failure', 'error': "Please send the homework in proper format!"})
        return;
    }
     
    try {
        date = Date.parse(body.sub_date);
        sub_date = body.sub_date;
    } catch (error) {
        res.send({'status': 'failure', 'message':'Please enter a proper Date!'})
        return;
    }
    if( !icode || !cl || !sec || !sub || !chapter || !title || !sub_date ) res.send({'status': 'failure', 'message': 'Please enter all the paramters properly!'})
    else{
        if(file){
            filename =`homeworks/${icode}/${cl}/${sec}/${sub}/${chapter}-${title}-${Date.now()}-`+file.originalname;
            var blob = get_file_ref(bucketName, filename);
                
            const blobStream = blob.createWriteStream({
                metadata: {
                    contentType: file.mimetype
                }
                });
            blobStream.on("error", err => res.send({'status': 'failure', 'error': err.message}));

            blobStream.on("finish", () => {
                db.collection('homeworks')
                .add({
                    author: author,
                    school_code: icode, 
                    class: cl, 
                    section: sec,
                    subject: sub,
                    chapter: chapter,
                    due_date: sub_date,
                    file_path: filename,
                    file_type: file.mimetype,
                    title: title,
                    desc: desc,
                    submissions:[]
                }).then(ref=>{
                    res.send({'status': 'success', 'message': `Homewwork ${ref.id} uploaded!`}); 
                })
                .catch(err => res.send({'status': 'failure', 'error': err.message}));
            });
            blobStream.end(file.buffer);
        } else{
            db.collection('homeworks')
            .add({
                author: author,
                school_code: icode, 
                class: cl, 
                section: sec,
                subject: sub,
                chapter: chapter,
                due_date: sub_date,
                title: title,
                desc: desc,
                submissions:[]
            }).then(ref=>{
                res.send({'status': 'success', 'message': `Homewwork ${ref.id} uploaded!`}); 
            })
            .catch(err => res.send({'status': 'failure', 'error': err.message}));
        }
    }                        
};

//GET Request from students and students
exports.check_homeworks = function(req,res){
    query = req.query;
    params = req.params;

    //following are obtained via URL parameter
    icode = params.icode;
    cl = params.class;
    sec = params.sec;

    //following are obtianed via URL Query
    author = query.tcode;

    if( !icode || !cl || !sec || !author ) { res.send({'status': 'failure', 'message': 'Please enter all the paramters properly!'}); }
    else {
        db.collection('homeworks')
        .where('school_code','==',icode)
        .where('class','==',cl)
        .where('section','==',sec)
        .where('author','==',author)
        .get()
        .then(snap=>{
            if(snap.empty) {
                res.send({'status': 'failure', 'message': 'No Match Found!'})
                return;
            }
            list = [];
            snap.forEach(doc => {
                info = _.pick(doc.data(),['author','title','subject','class','section','chapter','due_date','school_code'])
                list.push(info);
            });
            //console.log(list);
            res.json({'status': 'success','homeworks':list});
        })
        .catch(err => res.send({'status': 'failure', 'error': err}));
    }
};

//POST Request from Students
exports.submit_homework = function(req,res){
    body = req.fields;
    file = req.files.assignment;
    icode = body.icode;
    author = body.author;
    student = body.scode;
    sub_date = body.due_date;
    cl = body.class;
    sec = body.sec;
    sub = body.subject;
    chapter = body.chapter;
    title = body.title;
    if( !icode || !cl || !sec || !sub || !chapter || !title || !student || !file.name ) { res.send({'status': 'failure', 'message': 'Please enter all the paramters properly!'}); }
    else{
        filename = `homeworks/${icode}/${cl}/${sec}/${sub}/${chapter}-${title}-${sub_date}-submissions/${student}-`+file.name;
        let now = new Date();
        // console.log(file);
        // console.log(body); 
        upload_file(bucketName,file.path,filename);
        db.collection('homeworks')
        .where('school_code','==',icode)
        .where('author','==',author)
        .where('class','==',cl)
        .where('section','==',sec)
        .where('chapter','==',chapter)
        .where('title','==',title)
        .get()
        .then(snap =>{ 
            //console.log("snapshot received!",snap);
            if(snap.empty) {
                res.send({'status': 'failure', 'message': 'No Match Found!'})
                return;
            }
            ob = {student_code: student, file_path: filename,sub_time: now.getTime() };
            snap.forEach(doc =>{
                id = doc.id;
                subs = doc.data().submissions;
                subs.push(ob);
                console.log("Doc Data-",doc.data());
                console.log("Submissions Now-",subs);
                db.collection('homeworks').doc(id).update({submissions: subs});
            });
            res.send({'status': 'success','message': 'Submission Successful!'}); 
        })
        .catch(err => res.send({'status':'failure','error':err}));  
    }
};

//GET request from teacher
exports.check_submissions = function(req,res){
    query = req.query;
    params = req.params;

    //following are to be obtained via URL parameter
    icode = params.icode;
    cl = params.class;
    sec = params.sec;

    //following are to be obtained via URL query
    author = query.tcode;
    sub = query.sub;
    chapter = query.chapter;
    title = query.title;
    console.log(icode, author, sub, chapter, title, cl, sec)
    if( !icode || !author || !cl || !sec || !sub || !chapter || !title) { res.send({'status': 'failure', 'message': 'Please enter all the paramters properly!'}); }
    else {
        db.collection('homeworks')
        .where('school_code','==',icode)
        .where('class','==',cl)
        .where('section','==',sec)
        .where('author','==',author)
        .where('subject','==',sub)
        .where('chapter','==',chapter)
        .where('title','==',title)
        .get()
        .then(snap =>{ 
            subs=[];
            if(snap.empty) {
                res.send({'status':'success', 'message': 'No Such document found!'})
                return;
            }
            snap.forEach(doc =>{
                info = doc.data();
                console.log("TEst");
                subs = {id: doc.id, submissions: info.submissions};                
            });

            res.json({'status': 'success','submissions': subs});
        }).catch(err => res.send({'status': 'failure','error': err}));
    }      
};

// GET Request from teacher where docID needs to be present
exports.get_homework = function(req,res){
    query = req.query;
    docId = query.id;
    scode = query.scode;//if any specific submission is needed otherwise the value is 'undefined'

    if( !docID) { res.send({'status': 'failure', 'message': 'Please enter all the paramters properly!'}); }
    else{
        db.collection('homeworks').doc(docId)
        .get()
        .then(doc => {
            info = doc.data();
            subs = info.submissions;
            file_path = subs.filter(eachSub => scode.includes(eachSub.student_code) || eachSub.student_code === scode )[0].file_path;
            download_link(bucketName,file_path).then((data)=>{
                res.json({'status': 'success', 'download_link': data[0]});
            });
        });
    }    
};