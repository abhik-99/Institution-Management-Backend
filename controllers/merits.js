const {db} = require('./db');

//POST request
exports.edit_merit = function(req,res){
    params = req.params;
    body = req.body;
    //URL Parameters
    icode = params.icode;
    cl = params.class;
    sec = params.sec;
    //URL Query
    scode = body.scode;
    reason = body.reason;
    merit = body.merit; //incase of demerit, value is false.
    tcode = body.tcode;
    // console.log(scode, !reason, ( merit !== 'true' && merit !== 'false'), !tcode)
    if( !scode || !reason || ( merit !== 'true' && merit !== 'false') || !tcode) { res.send({'status': 'failure', 'message': 'Please provide proper data!'}); }
    else{
        db.collection(`profiles/students/${icode}`)
        .where('class', '==', cl)
        .where('section', '==', sec)
        .where('code', '==', scode)
        .get()
        .then( snap =>{
            if(snap.empty) { return res.send({'status': 'failure', 'message': 'No Students found!'}); }
            merit = merit === 'true';
            info = {};
            snap.forEach( doc => info = { 'id':doc.id, 'data':doc.data()});
            merits = info.data.merits;

            if( !merits) merits = { points:0, meritHistory: []};

            if(merit) merits.points += 1;
            else merits.points -= 1;
            merits.meritHistory.push({'date': Date.now(), 'reason': reason, 'teacherCode': tcode});

            db.collection(`profiles/students/${icode}`).doc(info.id)
            .update({
                merits: merits
            })
            .then(() => res.send({'status': 'success', 'message': `Merit of ${info.name} changed!`}))
            .catch(err => res.send({ 'status': 'failure', 'error':err.message}));
        })
        .catch(err => res.send({ 'status': 'failure', 'error':err.message}));
    }

};

//POST Request
exports.edit_class_merit = function(req,res){
    params = req.params;
    body = req.body;

    //URL Parameters
    icode = params.icode;
    cl = params.class;
    sec = params.sec;

    //URL Body    
    reason = body.reason;
    merit = body.merit; //incase of demerit, value is false.
    tcode = body.tcode;

    if( typeof reason !== 'string' || ( merit !== 'true' && merit!=='false') || typeof tcode !== 'string'){
        res.send({'status':'failure', 'message': 'Please send proper data!'})
        return;
    }
    merit = merit === 'true';
    db.collection(`profiles/students/${icode}`)
    .where('class', '==', cl)
    .where('section', '==', sec)
    .get()
    .then(snap =>{
        if(snap.empty){
            res.send({'status':'failure', 'message': 'No matching Class found!'})
            return;
        }
        var batch = db.batch();
        var collectionRef = db.collection(`profiles/students/${icode}`);
        snap.forEach( doc =>{

            info = doc.data();
            merits = info.merits;
            if(!merits) merits = { points:0, meritHistory: []};

            if(merit) merits.points += 1;
            else merits.points -= 1;
            merits.meritHistory.push({'date': Date.now(), 'reason': `Class Demit - ${reason}`, 'teacherCode': tcode})

            var docRef = collectionRef.doc(doc.id);
            batch.update(docRef, { merits: merits})
        })
        batch.commit()
        .then(() => res.send({'status': 'success', 'message': 'Class Demeritted'}))
        .catch(err => res.send({ 'status': 'failure', 'error':err.message}));
    })
    .catch(err => res.send({ 'status': 'failure', 'error':err.message}));

};

//GET Request
exports.get_merit = function(req, res){
    params = req.params;
    query = req.query;
    //URL parameters
    icode = params.icode;
    cl = params.class;
    sec = params.sec;
    //URL query
    scode = query.scode;

    if(req.headers.type === 'student' && !scode) { return req.send({'status': 'failure', 'message': 'Please send proper data!'}); }
    
    db.collection(`profiles/students/${icode}`)
    .where('class', '==', cl)
    .where('section', '==', sec)
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
    .catch( err => res.send({'status':'failure', 'error':err.message}));
};

//POST Request.
exports.reset_merit = function(req, res){
    params = req.params;
    body = req.body;
    //URL parameters
    icode = params.icode;
    //URL Request Body
    id = body.id;
    tcode = body.tcode;

    if(!id || !tcode) { return res.send({'status':'failure', 'message': 'Please send proper data!'}); }
    else{
        db.collection(`profiles/students/${icode}`).doc(id)
        .get()
        .then(snap => {
            if(snap.empty) { return res.send({'status': 'failure', 'message':'No match found!'}); }
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
            .catch( err => res.send({'status': 'failure', 'error': err.message}));
            
        })
        .catch( err => res.send({'status': 'failure', 'error': err.message}));
    }
};