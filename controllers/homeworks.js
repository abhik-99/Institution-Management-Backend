const _ = require('lodash');
var {upload_file} = require('../gcp_buckets/file_handling');
var {bucketName} = require('../config/secrets');
let {db} = require('./db');
exports.assign_homework = function(req,res,next){
    file = req.files.assignment;
    body = req.fields;
    icode = body.icode;
    author = body.tcode;
    cl = body.class;
    sec = body.sec;
    sub = body.subject;
    chapter = body.chapter;
    title = body.title;
    sub_date = Date.parse(body.sub_date);
    filename =`homeworks/${icode}/${cl}/${sec}/${sub}/${chapter}-${title}-${sub_date}-`+file.name;
    // console.log(cl,sec,sub,chapter,sub_date);
    // console.log("Files-\n",file);
    // console.log(file.name,filename);
    upload_file(bucketName,file.path,filename).then(()=>{
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
            title: title,
            submissions:[]
        }).then(ref=>{
            res.send({"body":body,"filename":filename}); 
        });        
    }).catch(err => res.send({'message':err}));  
};

exports.check_homeworks = function(req,res){
    body = req.fields;
    icode = body.icode;
    cl = body.class;
    sec = body.sec;
    sub = body.subject;
    //console.log(cl,sec,sub,sub);
    db.collection('homeworks')
    .where('school_code','==',icode)
    .where('class','==',cl)
    .where('section','==',sec)
    .where('subject','==',sub)
    .get()
    .then(snap=>{
        list = [];
        snap.forEach(doc => {
            info = _.pick(doc.data(),['author','title','subject','class','section','chapter','due_date','school_code'])
            list.push(info);
        });
        //console.log(list);
        res.json({'homeworks':list});
    })
    .catch(err => res.send({'message': err}));

};

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
    filename = `homeworks/${icode}/${cl}/${sec}/${sub}/${chapter}-${title}-${sub_date}-submissions/${student}`+file.name;
    let now = new Date();
    // console.log(file);
    // console.log(body); 
    upload_file(bucketName,file.path,filename);
    db.collection('homeworks')
    .where('school_code','==',icode)
    //.where('author','==',author)
    .where('class','==',cl)
    .where('section','==',sec)
    .where('chapter','==',chapter)
    //.where('title','==',title)
    .get()
    .then(snap =>{ 
        console.log("snapshot received!",snap);
        ob = {student_code: student, file_path: filename,sub_time: now.getDate() };
        snap.forEach(doc =>{
            id = doc.id;
            subs = doc.data().submissions;
            subs.push(ob);
            console.log("Doc Data-",doc.data());
            console.log("Submissions Now-",subs);
            db.collection('homeworks').doc(id).update({submissions: subs});
        });
        res.send(body); 
    })
    .catch(err => res.send(err));  
};
exports.check_submissions = function(req,res){

};