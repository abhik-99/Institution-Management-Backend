const {db} = require('./db');
const {get_file_ref} = require('../gcp_buckets/file_handling');
const {bucketName} = require('../config/secrets');
const _ = require('lodash')

//POST request
exports.add_chapter = function(req, res){
    body = req.body;
    icode = body.icode;
    cl = body.class;
    sec = body.sec;
    sub = body.subject;
    chapter = body.chapter;
    try {
        date = body.date;
        let t = Date.parse(date);
    } catch (error) {
        date = Date.now()
    }
    
    tcode = body.tcode;

    if( !icode || !cl || !sec || !sub || typeof chapter !== 'string' || !tcode) { res.send({'status':'failure','message':'Please give proper paramters!'}); }
    else{
        db.collection('chapters')
        .where('school_code', '==', icode)
        .where('class', '==', cl)
        .where('section', '==', sec)
        .where('subject_code', '==', sub)
        .get()
        .then(snap =>{
            if(snap.empty){
                res.send({'status': 'failure', 'message': 'No Such Subject exists!'})
                return;
            }else{
                var subject = {};
                snap.forEach(doc => subject = {'id': doc.id,'data':doc.data()})

                chapters = subject.data.chapters;
                if(chapters.filter( eachChapter => eachChapter.name === chapter).length !== 1){
                    res.send({'status': 'failure', 'message': 'Duplicate or no Chapters found!'})
                    return;
                } else {
                    var i = 0;
                    for(; i< chapters.length ; i++){
                        if( chapters[i].name === chapter){
                            chapters[i].ongoing = true;
                            chapters[i].started_on = date;
                        }else{
                            chapters[i].ongoing = false;
                        }
                    }
                    db.collection('chapters').doc(subject.id).update({
                        chapters: chapters
                    }).then(()=>{
                        res.send({'status': 'success', 'message': 'Chapter Added!'});
                    }).catch(err => res.send({'status': 'failure', 'error':err.message}));
                }
            }
        })
        .catch( err => res.send({'status': 'failure', 'error': err.message}) );
    }
};

//PATCH request.
exports.edit_chapter_status = function(req, res){
    params = req.params;
    body = req.body; 
    //following obtained from URL parameter
    icode = params.icode;
    cl = params.class;
    sec = params.sec;
    //following obtained form URL request body.
    id = body.id;
    ongoing = body.ongoing;
    chapterName = body.chapterName;

    if( (ongoing !== 'true' && ongoing !== 'false') || !id) { res.send({'status': 'failure', 'message': 'Please send proper data!'})}
    else{
        db.collection('chapters').doc(id)
        .get()
        .then( doc =>{
            if(!doc) { res.send({'status':'failure','message':'No match Found!'}); }
            else{
                ongoing = ongoing === 'true';
                info = doc.data();
                chapters = info.chapters;
                flag = false;
                for(i = 0; i < chapters.length ; i++){
                    if(chapters[i].name === chapterName){
                        if( chapters[i].ongoing !== ongoing && ongoing === false){
                            chapters[i].ongoing = false;
                            chapters[i].ended_on = Date.now();
                            flag = true;
                        } else {
                            res.send({'status':'success', 'message': 'No change detected!'});
                            return;
                        }
                    }
                }
                if(flag){
                    db.collection('chapters').doc(id).update({
                        chapters: chapters
                    })
                    .then(() => res.send({'status': 'success', 'message': 'Status Updated'}))
                    .catch(err => res.send({'status': 'failure', 'error': err}));
                }
            }
        });
    }
};

//GET Request
exports.get_chapters = function(req, res){
    params = req.params;
    query = req.query; 
    //following are obtained from the URL parameter
    icode = params.icode;
    cl = params.class;
    sec = params.sec;
    //following are obtained from the URL query
    sub = query.subject;

    if( !icode || !cl || !sec) { res.send({'status':'failure','message':'Please give proper paramters!'}); }
    else{
        db.collection('chapters')
        .where('school_code', '==', icode)
        .where('class', '==', cl)
        .where('section', '==', sec)
        .get()
        .then( snap =>{
            if(snap.empty){
                res.send({'status':'failure','message': 'No Chapters Found!'})
                return;
            }
            chapters = [];
            snap.forEach(doc =>{
                info = doc.data();
                chapters.push({'id': doc.id, 'data': doc.data()});
            });
            if(sub) { chapters= chapters.filter(eachDoc => eachDoc.data.subject_code.toLowerCase() === sub.toLowerCase()); }
            res.send({'status': 'success', 'data': chapters});
        })
        .catch( err => res.send({'status':'failure', 'error': err}));
    }
};

exports.get_subjects = function(req, res){
    params = req.params;
    query = req.query; 
    //following are obtained from the URL parameter
    icode = params.icode;
    cl = params.class;
    sec = params.sec;

    if( !icode || !cl || !sec) { 
        res.send({'status':'failure','message':'Please give proper paramters!'}); 
        return;
    }
    db.collection('chapters')
    .where('school_code', '==', icode)
    .where('class', '==', cl)
    .where('section', '==', sec)
    .get()
    .then(snap=>{
        if(snap.empty){
            res.send({'status': 'failure', 'message': 'No subjects found!'})
            return;
        }
        subjects = [];
        snap.docs.forEach( doc => subjects.push(doc.data().subject_code))
        res.send({'status': 'success', 'data':subjects})
    })
    .catch( err => res.send({'status':'failure', 'error': err}));
}

//Not Exposed
//Not Given in the UI
exports.remove_chapter = function(req, res){
    var params = req.params;
    var query = req.query; 
    //following are obtained from the URL parameter
    icode = params.icode;
    cl = params.class;
    sec = params.sec;

    //following parameters are to be obtained from URL query
    id = query.id;
    chapterName = query.chapterName
    if(!id) { 
        res.send({'status': 'failure', 'message': 'Please send proper data!'}); 
        return;
    }
    db.collection('chapters').doc(id)
    .get()
    .then(doc => {
        //needs to be implemented!
    })
    .catch( err => res.send({ 'status': 'failure', 'error': err}));
};

//POST request
exports.raise_doubt = function(req,res){
    var body = req.body; 
    var file = req.file;
    var params = req.params;
    //following are obtained from the URL parameter
    icode = params.icode;
    cl = params.class;
    sec = params.sec;

    //following are obtained from the URL Body
    docId = body.id;
    chapterName = body.chapterName;
    doubtText = body.doubtText; //main text of the Doubt
    scode = body.scode; //student code
    sname = body.sname; //student name

    if( !docId || !chapterName || !doubtText || !scode) { 
        res.send({'status': 'failure', 'message': 'Please send proper data!'});
        return;
    }

    db.collection('chapters').doc(docId)
    .get()
    .then( doc =>{
        if(!doc.exists) {
            res.send({'status': 'failure', 'message': 'No Match Found!'});
            return;
        }

        info = doc.data();
        index = -1;
        chapters = info.chapters
        for( i=0; i<chapters.length ; i++){
            if( chapterName === chapters[i].name){
                index = i;
                break;
            }
        }
        if( index === -1) {
            res.send({'status': 'failure', 'message': 'Duplicate or No Chapters Found!'})
            return;
        }
        var doubtOb = { 
            'scode': scode, 
            'sname': sname, 
            'class': cl,
            'sec': sec,
            'doubtText': doubtText, 
            'asked': Date.now()
        }
        if( file ){
            doubtOb.hasFile = true;
            doubtOb.filePath = `chapters/${icode}/${cl}/${sec}/${chapters[index].name}/doubts/students-${scode}-${file.originalname}`
            doubtOb.fileType = file.mimetype;
        }

        if(!chapters[index].doubts) chapters[index].doubts = [];

        chapters[index].doubts.push(doubtOb);

        db.collection('chapters').doc(docId).update({
            chapters: chapters
        })
        .then(()=> {
            res.send({'status': 'success', 'message': 'Doubt Added!'})
            //Writing file to bucket.
            if(file){
                var blob = get_file_ref(bucketName, doubtOb.filePath);
                const blobStream = blob.createWriteStream({
                    metadata: {
                        contentType: file.mimetype
                    }
                    });
                    blobStream.on("error", err => res.send({'status': 'failure', 'error': err.message}));
                    blobStream.on('finish', ()=> console.log("Uploaded",doubtOb.filePath))
                    blobStream.end(file.buffer);
            }
        })
        .catch( err => res.send({ 'status': 'failure', 'error': err.message}));
    })
    .catch( err => res.send({ 'status': 'failure', 'error': err.message}));
};

//GET request
exports.get_doubts = function(req,res){
    params = req.params;
    query = req.query;
    //URL parameters
    icode = params.icode;
    cl = params.class;
    sec = params.sec;
    //URL query
    docId = query.id;
    chapterName = query.chapterName;
    scode = query.scode; //student code
    if(!docId && !chapterName){
        res.send({'status': 'failure', 'message': 'Please send proper data!'})
        return;
    }

    db.collection('chapters').doc(docId)
    .get()
    .then(doc =>{
        if(!doc.exists){
            res.send({'status': 'failure', 'message': 'No Match Found!'})
            return;
        }
        info = doc.data();
        chapter = info.chapters.filter( each => each.name === chapterName);
        if( chapter.length !== 1) res.send({'status':'failure', 'message': 'Duplicate or No chapters found!'})
        doubts = (chapter[0].doubts)? chapter[0].doubts: [];
        if(scode) doubts = doubts.filter(doubt => doubt.scode === scode);
        res.send({'status': 'success', 'doubts': doubts});
    })
    .catch( err => res.send({ 'status': 'failure', 'error': err}));
};

//GET Request for getting the doubt file.
exports.get_doubt_file = function(req,res){
    params = req.params;
    query = req.query;
    //URL parameters
    icode = params.icode;
    cl = params.class;
    sec = params.sec;
    docId = params.id;
    //URL query
    chapterName = query.cn;
    scode = query.scode; //student code
    asked = query.a;

    if( !cn || !scode || !asked){
        res.send({'status': 'failure', 'message': 'Please send all the data! Chapter name, scode, and time the doubt was asked is needed.'})
        return;
    }

    db.collection('chapters').doc(docId)
    .get()
    .then((doc)=>{
        if(!doc.exists){
            res.send({'status': 'failure', 'message': 'No Match Found!'})
            return;
        }
        info = _.pick(doc.data(),['chapters']).chapters;
        chapter = info.filter(each => each.name === chapterName);
        if(chapter.length === 0 || chapter.doubt){
            res.send({'status': 'failure', 'message': 'No Matching Chapter Found!'})
            return;
        }else chapter = chapter[0];
        
        //filtering doubts
        doubts = chapter[0].doubts.filter(each => each.scode === scode && each.asked === asked);
        if( doubts.length !== 1 || !doubts[0].hasfile){
            res.send({'status': 'failure', 'message': 'No Matching Doubt Found!'})
            return;
        }

        //creating reference and sending the file
        var ref = get_file_ref(bucketName,doubts[0].filePath);
        
        var stream = ref.createReadStream();
        res.writeHead(200, {'Content-Type': doubts[0].fileType });
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
    .catch( err => res.send({ 'status': 'failure', 'error': err}));

}

//Add file support to the resolve doubt
//POST request
exports.resolve_doubt = function(req,res){
    params = req.params;
    body = req.body;
    file = req.file;
    //URL parameters
    icode = params.icode;
    cl = params.class;
    sec = params.sec;
    //following are obtained from the URL Body
    docId = body.id;
    chapterName = body.chapterName;
    answer = body.answer; //main text of the Doubt
    scode = body.scode; //student code
    tcode = body.tcode; //Teacher Code of the teacher who resolves the doubt.
    tname = body.tname; //Teacher Name of the Teacher who resolves the doubt.
    asked = body.asked; //Time when it was asked.

    if( !docId || !chapterName || !answer || !scode || !asked) { res.send({'status': 'failure', 'message': 'Please send proper data!'}); return;}

    db.collection('chapters').doc(docId)
    .get()
    .then( doc =>{
        if(!doc.exists) {
            res.send({'status': 'failure', 'message': 'No Match Found!'})
            return;
        }

        info = doc.data();
        index = -1;
        chapters = info.chapters
        for( i=0; i<chapters.length ; i++){
            if( chapterName === chapters[i].name){
                index = i;
                break;
            }
        }
        if( index === -1) {
            res.send({'status': 'failure', 'message': 'Duplicate or No Chapters Found!'})
            return;
        }

        doubts = chapters[index].doubts;
        if(!doubts || doubts.length === 0) res.send({'status':'failure', 'message': 'No doubts in this Chapter!'})
        dI = -1;
        for( i=0; i<doubts.length; i++){
            if( doubts[i].scode === scode && doubts[i].asked.toString() === asked){
                dI = i;
                break;
            }
        }
        if( dI === -1) {
            res.send({'status': 'failure', 'message': 'No such Doubts asked by the Student in this Chapter!'})
            return;
        }
        var ob = {
            answer: answer,
            tcode: tcode,
            tname: tname
        }
        //if the request contains a file.
        if(file){
            ob.filePath = `chapters/${icode}/${cl}/${sec}/${chapters[index].name}/doubts/${tname}/${Date.now()}-${tcode}-${scode}-${file.originalname}`;
            ob.fileType = file.mimetype;
            ob.hasFile = true;
        }

        chapters[index].doubts[dI].answer = ob;
        db.collection('chapters').doc(docId).update({
            chapters: chapters
        })
        .then(()=> {
            if(file){
                var blob = get_file_ref(bucketName, ob.filePath);
                const blobStream = blob.createWriteStream({
                    metadata: {
                        contentType: file.mimetype
                    }
                    });
                    blobStream.on("error", err => res.send({'status': 'failure', 'error': err.message}));
                    blobStream.on('finish', ()=> console.log("Uploaded",ob.filePath))
                    blobStream.end(file.buffer);
            }
            res.send({'status': 'success', 'message': 'Answer Added!'})
        })
        .catch( err => {res.send({ 'status': 'failure', 'error': err.message}); console.log(err)});

    })
    .catch( err => {res.send({ 'status': 'failure', 'error': err.message}); console.log(err)});
};

//GET Resolved Doubt file.
exports.get_answer_file = function(req,res){
    params = req.params;
    query = req.query;
    //URL parameters
    icode = params.icode;
    cl = params.class;
    sec = params.sec;
    docId = params.id;
    chapterName = params.cn;
    //URL query
    scode = query.scode; //student code
    tcode = query.tcode; //Teacher Code of the teacher who resolves the doubt.
    asked = query.asked; //When was the doubt asked.

    if( !tcode || !scode ||!asked) { 
        res.send({'status': 'failure', 'message': 'Please send proper data! tcode, scode and time the doubt was asked is missing'}); 
        return;
    }
    db.collection('chapters').doc(docId)
    .get()
    .then( doc =>{
        if(!doc.exists) {
            res.send({'status': 'failure', 'message': 'No Match Found!'})
            return;
        }

        info = doc.data();
        index = -1;
        chapters = info.chapters
        for( i=0; i<chapters.length ; i++){
            if( chapterName === chapters[i].name){
                index = i;
                break;
            }
        }
        if( index === -1) {
            res.send({'status': 'failure', 'message': 'Duplicate or No Chapters Found!'})
            return;
        }

        doubts = chapter[index].doubts;
        if(!doubts || doubts.length === 0) res.send({'status':'failure', 'message': 'No doubts in this Chapter!'})
        dI = -1;
        for( i=0; i<doubts.length; i++){
            if( doubts[i].scode === scode && doubts[i].asked === asked){
                dI = i;
                break;
            }
        }
        if( dI === -1 || !doubts[dI].answer.hasFile) {
            res.send({'status': 'failure', 'message': 'No such Doubts asked by the Student in this Chapter!'})
            return;
        }
        var ref = get_file_ref(bucketName, doubts[dI].answer.filePath)
        var stream = ref.createReadStream();
        res.writeHead(200, {'Content-Type': doubts[dI].answer.fileType});
        stream.on('data', function (data) {
            res.write(data);
            });
        
            stream.on('error', function (err) {
            console.log('error reading stream', err);
            });
        
            stream.on('end', function () {
            res.end();
            });
    });

}