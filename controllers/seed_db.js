let {Attendance, Classes, sequelize} = require('../models');

exports.seed_SQL_db = function(req,res){
     //URL body
     body = req.body;  
     sequelize.authenticate()
     .then(r=>{
        Attendance.build({
            schoolCode: body.icode,
            teacherCode : body.tcode,
            class : body.class,
            section : body.sec,
            subjectCode : body.subject,
            date: body.date,
            period: body.period
         })
         .save()
         .then((ref)=>{
             console.log(ref);
             res.send(`${ref.dataValues} inserted!`);
         });
     })
     .catch(err => res.send({'err': err.message}))   
     
    //  Classes.build({
    //     schoolCode: body.icode,
    //     teacherCode : body.tcode,
    //     class : body.class,
    //     section : body.sec,
    //     subjectCode : body.subject,
    //  })
    //  .save()
    //  .then((ref)=>{
    //      console.log(ref);
    //      res.send(`${ref.dataValues} inserted!`);
    //  });
 }