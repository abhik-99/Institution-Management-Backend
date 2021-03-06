const _ = require('lodash');
const {upload_file,download_link, get_file_ref} = require('../gcp_buckets/file_handling');
const {bucketName} = require('../config/secrets');
const {db} = require('./db');
const {Classes} = require('../models')

//POST requests to assign homework. Uses FormidablemMiddleware
exports.assign_homework = function(req,res){
    file = req.file;
    body = req.body;
    //URL Body
    icode = body.icode;
    author = body.tcode;
    author_name = (body.tname)? body.tname: "Unnamed!";
    cl = body.class;
    sec = body.sec;
    period = body.period;
    sub = body.subject;
    chapter = body.chapter;

    try {
        homework = JSON.parse(body.homework)
        title = homework.title;
        desc = homework.desc;
        if( typeof period !== 'string') return res.send({'status': 'success', 'message': 'Invalid period'})
        date = Date.parse(body.sub_date);
        sub_date = body.sub_date;
    } catch (error) {
        res.send({'status':'failure', 'error': error.message})
        return;
    }
     
    if( !icode || !cl || !sec || !sub || !chapter || !title || !sub_date ) return res.send({'status': 'failure', 'message': 'Please enter all the paramters properly!'})
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
                    author_name,
                    school_code: icode, 
                    class: cl, 
                    section: sec,
                    period: period,
                    subject: sub,
                    chapter: chapter,
                    num_submissions: 0,
                    due_date: sub_date,
                    hasFile: 'true',
                    file_path: filename,
                    file_type: file.mimetype,
                    title: title,
                    desc: desc,
                    submissions:[]
                }).then(ref=>{
                    Classes.findOne({
                        where:{
                            schoolCode: icode, 
                            teacherCode: author, 
                            class: cl, 
                            section: sec, 
                            subjectCode: sub
                        }
                    })
                    .then( row =>{
                        if(row){
                            row.increment('numHomeworks')
                            .then(()=> res.send({'status': 'success', 'message': `Homework uploaded Successfully!`}))
                        }else{
                            res.send({'status': 'success', 'message': `Homework uploaded but Structure not Found!`});
                        }
                    })
                     
                })
                .catch(err => res.send({'status': 'failure', 'error': err.message}));
            });
            blobStream.end(file.buffer);
        } else{
            db.collection('homeworks')
            .add({
                author: author,
                author_name,
                school_code: icode, 
                class: cl, 
                section: sec,
                period: period,
                subject: sub,
                chapter: chapter,
                due_date: sub_date,
                hasFile: 'false',
                title: title,
                desc: desc,
                num_submissions: 0,
                submissions:[]
            }).then(ref=>{
                res.send({'status': 'success', 'message': `Homework ${ref} uploaded!`}); 
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

    //following are obtianed via URL Query (Optional)
    author = query.tcode;
    sub = query.sub;

    if( !icode || !cl || !sec) { res.send({'status': 'failure', 'message': 'Please enter all the parameters properly!'}); }
    else {
        db.collection('homeworks')
        .where('school_code','==',icode)
        .where('class','==',cl)
        .where('section','==',sec)
        .get()
        .then(snap=>{
            if(snap.empty) {
                res.send({'status': 'failure', 'message': 'No Match Found!'})
                return;
            }
            list = [];
            snap.forEach(doc => {
                info = _.pick(doc.data(),['author', 'author_name','title','subject','class','section','chapter','due_date','school_code', 'desc'])
                if( typeof author === 'string'){
                    if( typeof sub === 'string'){
                        if(author === info.author && sub === info.subject) list.push({'id': doc.id,'data':info});
                    }else if(author === info.author) list.push({'id': doc.id,'data':info});
                    
                }else if(typeof sub === 'string'){
                    if(sub === info.subject) list.push({'id': doc.id,'data':info});
                }else list.push({'id': doc.id,'data':info});
                
            });
            //console.log(list);
            res.json({'status': 'success','homeworks':list});
        })
        .catch(err => res.send({'status': 'failure', 'error': err.message}));
    }
};

//POST Request for giving homework submissions from teacher.
exports.submit_homework_teacher = function(req,res){
    params = req.params;
    body = req.body;

    //URL Parameters
    icode = params.icode;
    cl = params.class;
    sec = params.sec;

    //URL Body;
    try {

        var id = body.id;
        var studentList = JSON.parse(body.submissions);
        for( var each of studentList){
            if( typeof each.scode !== 'string' || typeof each.id !== 'string' || typeof each.sname !== 'string') return res.send({'status': 'failure', 'message': 'Please send proper student data!'})
        }
        if(typeof id !== 'string' || id.length !== 20) return res.send({'status': 'failure', 'message': 'Please send proper document id!'})
    } catch (error) {
        res.send({'status': 'failure', 'error': error.message})
        return;
    }
    db.collection('homeworks')
    .doc(id)
    .get()
    .then(doc =>{
        if(!doc.exists){
            res.send({'status': 'failure', 'message': 'No Matching Homeworks Found!'})
            return;
        }
        var submissions = doc.data().submissions;
        if(!submissions || submissions.length === 0) submissions = [];
        var batch = db.batch();
        var sIds = []//for containing the student Doc Ids of those who submitted.

        //modifying submisions array with students
        studentList.forEach( student =>{
            duplicates = submissions.filter( sub => sub.id === student.id);
            if(duplicates.length === 0){
                submissions.push({'id': student.id, 'name': student.sname,'code': student.scode})
                sIds.push(student.scode)
            }
        })
        //fetching student profiles for batch write
        db.collection(`profiles/students/${icode}`)
        .where('code', 'in', sIds)
        .get()
        .then( snap =>{
            if(snap.empty) return res.send({'status': 'failure', 'message': 'No Student Found!'})
            //insert into the array(batch update)
            snap.forEach( doc=>{
                homeworkSubmissions = doc.data().homeworkSubmissions;
                try {
                    homeworkSubmissions.total += 1;
                    homeworkSubmissions.submissions.push({'id': id, 'date': Date.now()})
                } catch (error) {
                    homeworkSubmissions = {total: 1, submissions:[{'id': id, 'date': Date.now()}]}
                }
                batch.update(db.collection(`profiles/students/${icode}`).doc(doc.id), { homeworkSubmissions:  homeworkSubmissions})
            })
            //batch commit to student profiles
            batch.commit()
            .catch(err => console.log("Error While Batch Update for Homework",id,"\nError:", err ));

            //committing to homeworks collection
            db.collection('homeworks')
            .doc(id)
            .update({submissions: submissions})
            .then( () => res.send({'status':'status', 'message': 'Homeworks Submitted!'}))
            .catch(err => console.log("Error While Update for Homework",id,"\nError:", err ));
        }).catch(err => res.send({'status': 'failure', 'error': err.message}))
    })
    .catch(err => res.send({'status': 'failure', 'error': err.message}));
}

//Not exposed.
//POST Request from Students
exports.submit_homework = function(req,res){
    body = req.body;
    file = req.file;

    //URL body
    icode = body.icode;
    author = body.tcode;
    student = body.scode;
    sub_date = body.due_date;
    cl = body.class;
    sec = body.sec;
    sub = body.subject;
    chapter = body.chapter;
    title = body.title;

    if( !icode || !cl || !sec || !sub || !chapter || !title || !student || !file.name ) { res.send({'status': 'failure', 'message': 'Please enter all the paramters properly!'}); }
    else{
        filename = `homeworks/${icode}/${cl}/${sec}/${sub}/${chapter}-${title}-${sub_date}-submissions/${student}-`+file.originalname;
        let now = new Date();
        // console.log(file);
        // console.log(body); 
        var blob = get_file_ref(bucketName, filename);
                
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: file.mimetype
            }
            });
        blobStream.on("error", err => res.send({'status': 'failure', 'error': err.message}));

        blobStream.on("finish", () => {
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
                    res.send({'status': 'failure', 'message': 'No Matching Homework Found!'})
                    return;
                }
                ob = {student_code: student, file_path: filename,sub_time: now.getTime() };
                homeInfo = [];
                snap.forEach(doc =>{
                    homeInfo.push({'id': doc.id, 'data': doc.data()})
                });
                if(homeInfo.length !== 1){
                    res.send({'status': 'failure','message': 'Duplicate Homework Found!'})
                    return;
                }
                homeInfo = homeInfo[0];
                subs = homeInfo.submissions;
                num_submissions = homeInfo.num_submissions+1;
                subs.push(ob);

                //updaint submissions record in homework document
                db.collection('homeworks').doc(id)
                .update({submissions: subs, num_submissions: num_submissions})
                .then(()=>{
                    //checking student profile and updating it.
                    db.collection(`profiles/students/${icode}`)
                    .where('code', '==', scode)
                    .get()
                    .then(snap =>{
                        if(snap.empty){
                            res.send({'status': 'failure', 'message': 'No Student Found!'})
                            return;
                        }
                        studentInfo = [];
                        snap.forEach(doc =>{
                            studentInfo.push({'id': doc.id, 'data': doc.data()})
                        });
                        if(studentInfo.length !== 1){
                            res.send({'status': 'failure','message': 'Duplicate Student Found!'})
                            return;
                        }
                        studentInfo = studentInfo[0];
                        subs = [];
                        if(studentInfo.submissions) subs = studentInfo.submissions;
                        subs.push({'author':author, 'id': homeInfo.id, 'subject': sub})

                        //Updating homework record in student profile.
                        db.collection(`profiles/students/${icode}`).doc(studentInfo.id)
                        .update({submissions: subs})
                        .then(()=> res.send({'status':'success', 'message': 'Homework Submitted!'}))
                        .catch(err => res.send({'status':'failure','error in students profile':err.message}));
        
                    })
                    .catch(err => res.send({'status':'failure','error in students profile':err.message}));
                })
                .catch(err => res.send({'status':'failure','error in homeworks':err.message}));
            })
            .catch(err => res.send({'status':'failure','error':err.message})); 
        });
        blobStream.end(file.buffer);
        
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
    id = query.id
    if( !id) { res.send({'status': 'failure', 'message': 'Please enter all the paramters properly!'}); }
    else {
        db.collection('homeworks')
        .doc(id)
        .get()
        .then(doc =>{ 
            if(!doc.exists) {
                res.send({'status':'success', 'message': 'No Such document found!'})
                return;
            }
            res.json({'status': 'success','data': {'id': doc.id, 'submissions': doc.data().submissions}});
        })
        .catch(err => res.send({'status': 'failure','error': err.message}));
    }      
};

// GET Request from teacher where docID needs to be present
exports.get_homework_submission = function(req,res){
    query = req.query;
    docId = query.id;
    scode = query.scode;//if any specific submission is needed otherwise the value is 'undefined'

    if( !docId) { res.send({'status': 'failure', 'message': 'Please enter all the paramters properly!'}); }
    else{
        db.collection('homeworks').doc(docId)
        .get()
        .then(doc => {
            if(!doc.exists){
                res.send({'status': 'failure', 'message': 'No such Document'})
                return;
            }
            info = doc.data();
            subs = info.submissions;
            file_path = subs.filter(eachSub => scode.includes(eachSub.student_code) || eachSub.student_code === scode )[0].file_path;
            download_link(bucketName,file_path)
            .then((data)=>{
                res.json({'status': 'success', 'download_link': data[0]});
            })
            .catch(err => res.send({'status': 'failure','error': err.message}));
        })
        .catch(err => res.send({'status': 'failure','error': err.message}));
    }    
};
exports.get_homework_file = function(req,res){
    query = req.query;
    docId = query.id;
    if(!docId) res.send({'status': 'failure', 'message': 'Please send proper data!'})
    else{
        db.collection('homeworks').doc(docId)
        .get()
        .then(doc =>{
            if(!doc.exists){
                res.send({'status':'success', 'message':'No such Document!'})
                return;
            }
            info = doc.data()
            if( info.hasFile !== 'true'){
                res.send({'status': 'failure', 'message': 'Document has no file!'})
                return;
            }
            download_link(bucketName, info.file_path)
            .then(data=> res.json({'status': 'success', 'download_link': data[0]}))
            .catch(err => res.send({'status': 'failure','error': err.message}));

        })
        .catch(err => res.send({'status': 'failure','error': err.message}));
    }
}

exports.get_homework_summary = function(req,res){
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

    db.collection('homeworks')
    .where('school_code','==',icode)
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
            doc = _.pick(doc, ['author','class','section', 'title', 'chapter','num_submissions', 'subject'])
            if(subject && doc.subject === subject)  data.push(doc)
            else data.push(doc)
        })
        res.send({'status':'success', 'data': data})
    })
    .catch(err => res.send({'status': 'failure','error': err.message}));
}