let {db} = require('./db');
let sequelize = require('sequelize');

exports.get_students = function(req,res){
    body = req.query;
    icode = body.icode;
    cl = body.class;
    sec = body.sec;
    if( !icode || !cl || !sec) { res.send({'message': "Please provide proper parameters"});}
    else{
        db.collection(`profiles/students/${icode}`)
        .where('class', '==', cl)
        .where('sec', '==', sec)
        .get()
        .then(snap => {

            if( !snap) { res.send({'message': 'No such School found!'}); }
            else{
                list = [];
                snap.forEach(doc => {
                    info = doc.data();
                    list.push({'name': info.name, 'code': info.code});
                });
                res.send({'students': list});
            }
        })
        .catch(err => {
            console.log("Error",err); res.send({'message': err});
        });
    }    
};
exports.give_attendance = function(req,res){

};