/*
This controller is for getting the performance of the student.
It basically needs to fetch the student profile data from their collection.
Any deeper function/analysis needs to be provided with the student's doc ID.

Endpoints to be accessible to students, teachers, and parents.
*/
const {Classes} = require('../models');
const {db} = require('./db');
const _ = require('lodash')

exports.get_student_profile = function(req,res){
    params = req.params;
    query = req.query;
    //URL parameters
    icode = params.icode;
    //URL Query
    scode = query.scode;
    if( !scode ) { res.send({'status': 'failure', 'error': 'Please provide proper information!'}); return;}
    db.collection(`profiles/students/${icode}`)
    .where('code', '==', scode)
    .get()
    .then(snap =>{
        if(snap.empty) res.send({'status':'failure', 'message':'No match Found!'})

        var studentData = {};
        snap.forEach(doc => studentData = {'id': doc.id, 'data': doc.data()}) 
        var cl = studentData.data.class;
        var sec = studentData.data.section;

        Classes.findAll({
            where:{
                schoolCode: icode,
                class: cl,
                section: sec
            },
            attributes: ['numQuizzes', 'numHomeworks','numClasses', 'subjectCode', 'teacherCode'],
        })
        .then( results =>{
            studentData.data.classStats = results;
            res.send({'status':'success','data': studentData})
        })
        .catch(err => res.send({'status': 'failure','error': err.message}))
    })
    .catch(err => res.send({'status': 'failure','error': err.message}));
};

exports.get_routine = function(req,res){
    params = req.params;

    icode = params.icode;
    cl = params.class;
    sec = params.sec;
    db.collection('schools')
    .where('code', '==', icode)
    .get()
    .then(snap=>{
        if(snap.docs.length > 1){
            res.send({'status':'failure','message': 'Duplicate Schools found!'})
            return;
        }

        var routineMap;
        snap.docs.forEach( doc => routineMap = doc.data().routineMap);
        if(cl === 'all' && sec === 'all') res.send({'status': 'success', 'data': routineMap})
        else if(cl === 'all' && sec !== 'all') res.send({'status': 'success', 'data': routineMap.filter( each => each.section === sec)})
        else if(cl !== 'all' && sec === 'all') res.send({'status': 'success', 'data': routineMap.filter( each => each.class === cl)})
        else res.send({'status': 'success', 'data': routineMap.filter( each => each.section === sec && each.class === cl)})
    })
    .catch(err => res.send({'status': 'failure','error': err.message}));
};

exports.get_teacher_profile = function(req,res){
    params = req.params;
    query = req.query;

    //URL parameters
    icode = params.icode;

    //URL Query
    code = query.code;
    if( !code ){
        res.send({'status': 'failure', 'message': 'Please provide proper data!'})
        return;
    }
    db.collection(`profiles/teachers/${icode}`)
    .where('code', '==', code)
    .get()
    .then( snap =>{
        if(snap.empty){
            res.send({'status': 'failure', 'message': 'No match Found!'})
            return;
        }

        var teacherData = {};
        snap.forEach(doc => teacherData = {'id': doc.id, 'data': doc.data()})

        res.send({'status': 'success', 'data': teacherData})
        
    })
    .catch(err => res.send({'status': 'failure','error': err.message}))

}

exports.get_parent_profile = function(req,res){
    params = req.params;
    query = req.query;

    //URL parameters
    icode = params.icode;

    //URL Query
    code = query.code;
    
    if( !code ){
        res.send({'status': 'failure', 'message': 'Please provide proper data!'})
        return;
    }
    db.collection(`profiles/parents/${icode}`)
    .where('code', '==', code)
    .get()
    .then( snap =>{
        if(snap.empty){
            res.send({'status': 'failure', 'message': 'No match Found!'})
            return;
        }

        var parentData = {};
        snap.forEach(doc => parentData = {'id': doc.id, 'data': doc.data()})

        res.send({'status': 'success', 'data': parentData})
        
    })
    .catch(err => res.send({'status': 'failure','error': err.message}));
}

exports.get_school_profile = function(req,res){
    icode = req.params.icode;
    db.collection('schools')
    .where('code', '==', icode)
    .get()
    .then( snap =>{
        if(snap.empty) throw 'School not Found!'
        var data;
        snap.forEach( doc => data = doc.data())
        res.send({'status': 'success', 'data': data})
    })
    .catch( err=> { res.send({'status': 'failure', 'error': err}); console.log(err)})
}

exports.get_class_stats = function(req,res){
    params = req.params;

    icode = params.icode;
    cl = params.class;
    sec = params.sec;

    Classes.findAll({
        where:{
            schoolCode: icode,
            class: cl,
            section: sec
        },
        attributes: ['numQuizzes', 'numHomeworks','numClasses', 'subjectCode', 'teacherCode'],
    })
    .then( results =>{
        if(results) res.send({'status':'success','data': results})
        else res.send({'status': 'failure','message': 'Match not found!'})
    })
    .catch(err => res.send({'status': 'failure','error': err.message}))
};

exports.get_class_quiz_stats = function(req,res){
    params = req.params;
    query = req.query;

    icode = params.icode;
    cl = params.class;
    sec =  params.sec;

    subject = query.sub;

    db.collection('quizzes')
    .where('icode', '==', icode)
    .where('class', '==', cl)
    .where('section', '==', sec)
    .get()
    .then(snap=>{
        if(snap.empty){
            res.send({'status': 'failure', 'message': 'No Class or Section Match Found!'})
            return;
        }
        avgSubs = 0;
        var n = 0
        snap.docs.forEach( doc => {
            if(subject && doc.data().subject === subject){
                avgSubs += (doc.data().num_submissions)? doc.data().num_submissions: 0;
                n += 1;
            }else{
                avgSubs += (doc.data().num_submissions)? doc.data().num_submissions: 0;
                n += 1;
            }
            
        })
        res.send({'status': 'success', 'data': avgSubs/n})
    })
    .catch(err => res.send({'status': 'failure','error': err.message}))
}

exports.get_class_homework_stats = function(req,res){
    params = req.params;
    query = req.query;
    icode = params.icode;
    cl = params.class;
    sec =  params.sec;

    subject = query.sub;

    db.collection('homeworks')
    .where('school_code', '==', icode)
    .where('class', '==', cl)
    .where('section', '==', sec)
    .get()
    .then(snap=>{
        if(snap.empty){
            res.send({'status': 'failure', 'message': 'No Class or Section Match Found!'})
            return;
        }
        avgSubs = 0;
        var n = 0
        snap.docs.forEach( doc => {
            if(subject && doc.data().subject === subject){
                avgSubs += (doc.data().num_submissions)? doc.data().num_submissions: 0;
                n += 1;
            }else{
                avgSubs += (doc.data().num_submissions)? doc.data().num_submissions: 0;
                n += 1;
            }
        })
        res.send({'status': 'success', 'data': avgSubs/n})
    })
    .catch(err => res.send({'status': 'failure','error': err.message}))
}

exports.get_class_exam_stats = function(req,res){
    params = req.params;
    query = req.query;

    icode = params.icode;
    cl = params.class;
    sec =  params.sec;

    subject = query.sub;

    db.collection('exam')
    .where('icode', '==', icode)
    .where('class', '==', cl)
    .where('section', '==', sec)
    .get()
    .then(snap=>{
        if(snap.empty){
            res.send({'status': 'failure', 'message': 'No Class or Section Match Found!'})
            return;
        }
        avgMarks = 0;
        var n = 0
        snap.docs.forEach( doc => {
            info = doc.data();
            if(subject && info.subject === subject){
                avgMarks += (info.avgMarks && info.full_marks)? info.avgMarks/info.full_marks: 0;
                n += 1;
            }else{
                avgMarks += (info.avgMarks && info.full_marks)? info.avgMarks/info.full_marks: 0;
                n += 1;
            }
        })
        res.send({'status': 'success', 'data': avgMarks/n})
    })
    .catch(err => res.send({'status': 'failure','error': err.message}))
}