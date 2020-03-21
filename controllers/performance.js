/*
This controller is for getting the performance of the student.
It basically needs to fetch the student profile data from their collection.
Any deeper function/analysis needs to be provided with the student's doc ID.

Endpoints to be accessible to students, teachers, and parents.
*/

const {db} = require('./db');

exports.get_student_profile = function(req,res){
    params = req.params;
    query = req.query;
    //URL parameters
    icode = params.icode;
    cl = params.class;
    sec = params.sec;
    //URL Query
    scode = query.scode;
    if( !scode ) { res.send({'status': 'failure', 'error': 'Please provide proper information!'}); }
    db.collection(`profiles/students/${icode}`)
    .where('class', '==', cl)
    .where('code', '==', scode)
    .get()
    .then(snap =>{
        if(!snap) res.send({'status':'failure', 'message':'No match Found!'})

        // Assess performance based on the  
    });
};
