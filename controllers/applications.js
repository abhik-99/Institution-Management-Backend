const {db} = require('./db');
const {upload_file,get_file_ref} = require('../gcp_buckets/file_handling');
const {bucketName} = require('../config/secrets');
const _ = require('lodash')

//get teachers
exports.get_teachers = function(req,res){
    params = req.params;

    icode = params.icode;
    db.collection(`profiles/teachers/${icode}`)
    .get()
    .then( snap =>{
        if(snap.empty){
            res.send({'status': 'failure', 'message': 'No matching schools found!'})
            return;
        }

        list = [];
        snap.forEach( doc =>{
            data = _.pick(doc.data(), ['name', 'email', 'code', 'ph_no']);
            data.id = doc.id;
            list.push(data)
        })
        res.send({'status': 'success', 'data': list})
    })
    .catch( err=> res.send({'status': 'failure', 'error': err.message}))
}

//Make query from parents to teachers
exports.make_query = function(req,res){
    params = req.params;
    body = req.body;
    
    icode = params.icode;

    //URL Body
    pcode = body.pcode;
    pname = body.pname;
    tname = body.tname;
    tcode = body.tcode;
    title = body.title;
    desc = body.desc;
    
    if( !tname || !pcode || !tcode || !title || !desc){
        res.send({'status':'failure', 'message': 'Please send proper data!'})
        return;
    }
    db.collection('applications').add({
        icode: icode,
        type: 'query',
        pcode: pcode,
        pname: pname,
        tcode: tcode,
        tname: tname,
        title: title,
        desc: desc
    })
    .then(ref => res.send({'status': 'success', 'message': `Query Added! ${ref.id}`}))
    .catch( err => res.send({'status':'failure', 'error': err.message}))
}

//Create a leave application from parents.
exports.leave_application = function(req,res){
    params = req.params;
    body = req.body;

    //URL parameters
    icode = params.icode;

    //URL Body
    try {
        start = Date.parse(body.startDate);
        end = Date.parse(body.end);
        reason = (typeof body.reason === 'string')? body.reason : undefined;
        tname = (typeof body.tname === 'string')? body.tname : undefined;
        tcode = (typeof body.tcode === 'string')? body.tcode : undefined;
        scode = (typeof body.scode === 'string')? body.scode : undefined;
        pcode = (typeof body.pcode === 'string')? body.pcode : undefined;
        if( !tname || !tcode || !scode || !reason || !pcode) throw 'Please send proper data!'
    } catch (error) {
        res.send({'status':'failure', 'error': error.message})
        return;        
    }
    var ob = {
        type: 'leave',
        icode: icode,
        pcode: pcode,
        scode: scode,
        tcode: tcode,
        tname: tname,
        reason: reason,
        start_date: start,
        end_date: end
    }


    //Checking for matching student profile and adding the token to it.
    db.collection(`profiles/students/${icode}`)
    .where('code', '==', scode)
    .then( snap=>{
        //checking conditions
        if(snap.empty){
            res.send({'status': 'failure', 'message': 'No matching Student profile found!'})
            return;
        }
        student = [];
        snap.forEach( doc => student.push({'id': doc.id, 'data': doc.data()}))
        if(student.length !== 0){
            res.send({'status': 'failure', 'message': 'Duplicate Student profile found!'})
            return;
        }

        student = student[0];
        try {
            if(!student.data.leave_applications || student.data.leave_applications.length === 0) student.data.leave_applications = [];
        } catch (error) {
            student.data.leave_applications = [];
        }
        student.data.leave_applications.push(ob)
        //Adding document to applications collection
        db.collection('applications')
        .add(ob)
        .then( ref =>{})
        .catch( err => res.send({'status':'failure', 'error': err.message}))

        //Adding leave_applications to student profile
        db.collection(`profiles/students/${icode}`).doc(student.id)
        .update( { leave_applications : student.data.leave_applications})
        .then(()=> res.send({'status': 'success', 'message': 'Leave application added!'}))
        .catch( err => res.send({'status':'failure', 'error': err.message}))
    })
    .catch( err => res.send({'status':'failure', 'error': err.message}))
}