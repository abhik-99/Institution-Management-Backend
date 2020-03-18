const {db} = require('./db');
exports.add_chapter = function(req, res){
    
};
exports.edit_chapter_status = function(req, res){

};
exports.get_chapters = function(req, res){
    params = req.params;
    query = req.query; 

    icode = params.icode;
    cl = params.class;
    sec = params.sec;

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
exports.remove_chapters = function(req, res){

};