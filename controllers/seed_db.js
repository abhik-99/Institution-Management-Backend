let {Attendance} = require('../models');

exports.seed_SQL_db = function(req,res){
     //URL body
     body = req.body;
     ob = {
        schoolCode: body.icode,
        teacherCode : body.tcode,
        class : body.class,
        section : body.sec,
        subjectCode : body.subCode,
     }
     
     Attendance.build(ob)
     .save()
     .then((ref)=>{
         console.log(ref);
         res.send(`${ref.dataValues} inserted!`);
     });
 }