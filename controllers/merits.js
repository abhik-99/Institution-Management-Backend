const {db} = require('./db');

//multipart formdata
exports.edit_merit = function(req,res){

};

exports.get_merit = function(req, res){
    params = req.params;
    query = req.query;

    icode = params.icode;
    cl = params.class;
    sec = params.sec;

    scode = query.scode;

    if(req.headers.type === 'student' && !scode) { req.send({'status': 'failure', 'message': 'Please send proper data!'}); }
    
    db.collection(`profiles/students/${icode}`)
    .where('class', '==', cl)
    .where('sec', '==', sec)
    .get()
    .then(snap =>{
        merits = [];
        snap.forEach( doc =>{
            info = doc.data();
            merits.push({'docId': doc.id, 'name': info.name, 'scode': info.code, 'merit': info.merit})
        });
        if(scode){
            merits = merits.filter( each => each.scode === scode);
        }
        res.send({'status':'success', 'data':merits});
    })
    .catch( err => res.send({'status':'failure', 'error':err}));
};
//POST Request.
exports.reset_merit = function(req, res){
    params = req.params;
    body = req.body;

    icode = params.icode;

    id = body.id;
    tcode = body.tcode;

    if(!id) { res.send({'status':'failure', 'message': 'Please send proper data!'}); }
    else{
        db.collection(`profiles/students/${icode}`).doc(id)
        .get()
        .then(snap => {
            if(!snap) { res.send({'status': 'failure', 'message':'No match found!'}); }
            data = [];
            snap.forEach( doc => data = doc.data());
            merits = data.merits;
            merits.points = 0;
            merits.meritHistory.push({'date': Date.now(), 'reason': 'MERIT RESET', 'teacherCode': tcode});
            db.collection(`profiles/students/${icode}`).doc(id)
            .update({
                merits: merits
            })
            .then( () => res.send({'status':'success', 'message': 'Merits Reset.'}) )
            .catch( err => res.send({'status': 'failure', 'error': err}));
            
        })
        .catch( err => res.send({'status': 'failure', 'error': err}));
    }
};