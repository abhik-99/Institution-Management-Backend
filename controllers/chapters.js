/*
Controller for handling of doubts needs to be made.
*/

const {db} = require('./db');

//POST request
exports.add_chapter = function(req, res){
    body = req.body;
    icode = body.icode;
    cl = body.cl;
    sec = body.sec;
    sub = body.sub;
    chapter = body.chapter;
    tcode = body.tcode;
    ongoing = body.ongoing;
    if( !icode || !cl || !sec || !(typeof chapter === 'string') || (ongoing !== 'true' && ongoing !== 'false')) { res.send({'status':'failure','message':'Please give proper paramters!'}); }
    else{
        db.collection('chapters')
        .where('school_code', '==', icode)
        .where('class', '==', cl)
        .where('section', '==', sec)
        .get()
        .then(snap =>{
            if(!snap){
                //no such subject exists. needs to be added
                doc = {
                    'chapters': [
                        {
                            'name': chapter,
                            'teacher': tcode,
                            'ongoing': ongoing !== 'true'
                        }
                    ],
                    'class': cl,
                    'school_code': icode,
                    'section': sec,
                    'subject_code': sub
                };
                if(doc.chapters[0].ongoing){
                    doc.chapters[0].started_on = Date.now();
                }
                db.collection('chapters').add(doc)
                .then( id => res.send({'status':'success', 'message': `docID:${id}`}))
                .catch( err => res.send({'status':'failure', 'error': err}));
            }else{
                //such a subject document exists. chapter needs to be searched and added.
                chapters = [];
                snap.forEach(doc => chapters.push({'id': doc.id, 'data': doc.data()}));
                if(chapters.length != 1){
                    res.send({'status': 'failure', 'message': 'Duplicate mapping found!'});
                }
                else{
                    chapters = chapters[0];

                    duplicates = chapters.data.chapters.filter( each => each.name === chapter);
                    if(duplicates.length !== 0) res.send({'status': 'failure', 'message':'Chapter already Exists!'});
                    else{
                        //adding new chapter.
                        doc = {
                            'name': chapter,
                            'teacher': tcode,
                            'ongoing': ongoing !== 'true'
                        };
                        if(doc.ongoing) doc.started_on = Date.now();
                        chapters.data.chapters.push(doc);
                        db.collection('chapters').doc(chapters.id).update({
                            chapters: chapters.data.chapters
                        }).then(()=>{
                            res.send({'status': 'success', 'message': 'Chapter Added!'});
                        }).catch(err => res.send({'status': 'failure', 'error':err}));
                    }
                }
            }
        })
        .catch( err => res.send({'status': 'failure', 'error': err}) );
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
    sub = query.sub;
    if( !icode || !cl || !sec) { res.send({'status':'failure','message':'Please give proper paramters!'}); }
    else{
        db.collection('chapters')
        .where('school_code', '==', icode)
        .where('class', '==', cl)
        .where('section', '==', sec)
        .get()
        .then( snap =>{
            chapters = [];
            snap.forEach(doc =>{
                info = doc.data();
                chapters.push({'id': doc.id, 'data': doc.data()});
            });
            if(sub) { chapters= chapters.filter(eachDoc => eachDoc.data.subject_code === sub); }
            res.send({'status': 'success', 'data': chapters});
        })
        .catch( err => res.send({'status':'failure', 'error': err}));
    }
};
exports.remove_chapter = function(req, res){
    params = req.params;
    query = req.query; 
    //following are obtained from the URL parameter
    icode = params.icode;
    cl = params.class;
    sec = params.sec;

    //following parameters are to be obtained from URL query
    id = query.id;
    chapterName = query.chapterName
    if(!id) { res.send({'status': 'failure', 'message': 'Please send proper data!'}); }
    db.collection('chapters').doc(id)
    .get()
    .then(doc => {
        //needs to be implemented!
    })
    .catch( err => res.send({ 'status': 'failure', 'error': err}));
};

//POST request
exports.raise_doubt = function(req,res){
    body = req.body; 
    //following are obtained from the URL parameter
    icode = params.icode;
    cl = params.class;
    sec = params.sec;
    //following are obtained from the URL Body
    docId = body.docId;
    chapterName = body.chapterName;
    doubtText = body.dText; //main text of the Doubt
    scode = body.scode; //student code
    sname = body.sname; //student name
    if( !docId || !chapterName || !doubtText || !scode) { res.send({'status': 'failure', 'message': 'Please send proper data!'}); }
    db.collection('chapters').doc(docID)
    .get()
    .then( doc =>{
        if(!doc) res.send({'status': 'failure', 'message': 'No Match Found!'})
        info = doc.data();
        index = -1;
        chapters = info.chapters
        for( i=0; i<chapters.length ; i++){
            if( chapterName === chapters[i].name){
                index = i;
                break;
            }
        }
        if( index === -1) res.send({'status': 'failure', 'message': 'Duplicate or No Chapters Found!'})
        
        if(!chapters[index].doubts) chapters[index].doubts = [];
        chapters[index].doubts.push({ 'scode': scode, 'sname': sname, 'doubtText': doubtText, 'asked': Date.now()});
        db.collection('chapters').doc(docId).update({
            chapters: chapters
        })
        .then(()=> res.send({'status': 'success', 'message': 'Doubt Added!'}))
        .catch( err => res.send({ 'status': 'failure', 'error': err}));
    })
    .catch( err => res.send({ 'status': 'failure', 'error': err}));
};

//POST request
exports.resolve_doubt = function(req,res){
    icode = params.icode;
    cl = params.class;
    sec = params.sec;
    //following are obtained from the URL Body
    docId = body.docId;
    chapterName = body.chapterName;
    answer = body.answer; //main text of the Doubt
    scode = body.scode; //student code
    asked = body.asked; //student name
    if( !docId || !chapterName || !answer || !scode || !asked) { res.send({'status': 'failure', 'message': 'Please send proper data!'}); }

    db.collection('chapters').doc(docId)
    .get()
    .then( doc =>{
        if(!doc) res.send({'status': 'failure', 'message': 'No Match Found!'})
        info = doc.data();
        index = -1;
        chapters = info.chapters
        for( i=0; i<chapters.length ; i++){
            if( chapterName === chapters[i].name){
                index = i;
                break;
            }
        }
        if( index === -1) res.send({'status': 'failure', 'message': 'Duplicate or No Chapters Found!'})

        doubts = chapter[index].doubts;
        if(!doubts || doubts.length === 0) res.send({'status':'failure', 'message': 'No doubts in this Chapter!'})
        dI = -1;
        for( i=0; i<doubts.length; i++){
            if( doubts[i].scode === scode && doubts[i].asked === asked){
                dI = i;
                break;
            }
        }
        if( dI === -1) res.send({'status': 'failure', 'message': 'No such Doubts asked by the Student in this Chapter!'})
        chapters[index].doubts[dI].answer = answer;
        db.collection('chapters').doc(docId).update({
            chapters: chapters
        })
        .then(()=> res.send({'status': 'success', 'message': 'Answer Added!'}))
        .catch( err => res.send({ 'status': 'failure', 'error': err}));

    })
    .catch( err => res.send({ 'status': 'failure', 'error': err}));
};