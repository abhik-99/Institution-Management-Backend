/*
This controller is for getting the performance of the student.
It basically needs to fetch the student profile data from their collection.
Any deeper function/analysis needs to be provided with the student's doc ID.

Endpoints to be accessible to students, teachers, and parents.
*/

const {db} = require('./db');

exports.get_student_profile = function(req,res){
    body = req.params;
    scode = body.scode;
    icode = body.icode;
    if( !scode || !icode) { res.send({'status': 'failure', 'error': 'Please provide proper information!'}); }
    db.collection(`profiles/students/${icode}`)
    .where('code', '==', scode)
    .get()
    .then(snap =>{
        student = [];
        snap.forEach( doc => student.push({'id': doc.id, 'data': doc.data()}));
        if(student.length != 1) { res.send({'status': 'failure', 'error': 'Duplicate or No student found!'}); }
        else{
            res.send({'status': 'success', 'profile': student[0]});
        }
    });
};
