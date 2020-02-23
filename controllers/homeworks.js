var {upload_file} = require('../gcp_buckets/file_handling');
var {bucketName} = require('../config/secrets');
let {db} = require('./db');
exports.assign_homework = function(req,res,next){
    file = req.files.assignment;
    body = req.fields;
    icode = body.icode;
    cl = body.class;
    sec = body.sec;
    sub = body.subject;
    chapter = body.chapter;
    sub_date = Date.parse(body.sub_date);
    filename =`homeworks/${icode}/${cl}/${sec}/${sub}/${chapter}-${sub_date}-`+file.name;
    // console.log(cl,sec,sub,chapter,sub_date);
    // console.log("Files-\n",file);
    // console.log(file.name,filename);
    upload_file(bucketName,file.path,filename).then(()=>{
        db.collection('homeworks')
        .add({
            school_code: icode, 
            class: cl, 
            section: sec,
            subject: sub,
            chapter: chapter,
            due_date: sub_date,
            file_path: filename,
            submissions:[]
        }).then(ref=>{
            res.send({"body":body,"filename":filename}); 
        });        
    }).catch(err => res.send({'message':err}));  
};

exports.check_homeworks = function(req,res){
    
};

exports.submit_homework = function(req,res){
    body = req.fields;
    icode = body.icode;
    cl = body.class;
    sec = body.sec;
    sub = body.subject;
    chapter = body.chapter;
    sub_date = Date.parse(body.sub_date);
    filename =`homeworks/${icode}/${cl}/${sec}/${sub}/${chapter}-${sub_date}-`+file.name;
};
exports.check_submissions = function(req,res){

};