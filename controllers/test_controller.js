
// let db = admin.firestore();
let {db} = require('./db');
let {Classes, sequelize} = require('../models')
exports.show_firebase_data = function(req,res,next){
    let profiles_school_ref = db.doc('profiles/schools/a101/a101');
    profiles_school_ref.get()
    .then(doc =>{
        // if (!doc.exists) {
        //     console.log('No such document!');
        //   } else {
            console.log('Document data:', doc.data());
            res.send(doc.data());
         // }
    })
    .catch(err=> {
        console.log("Error Occured!",err);
        res.send(err);
    });
};

exports.sql_initialize = function(req,res){
    sequelize.authenticate()
    .then((obj)=> {console.log("connection successful!",obj); })
    .catch((err)=> {console.log("Error Occured!",err); });
    sequelize
    .sync({
        logging: console.log,
        force: true
    })
    .then(()=>{
        console.log("All done!");
        sequelize.close()
        .then(()=>console.log('Connection Closed'))
        .catch(err => console.log('Error Occured!', err));
        res.send("All ok!");
    })
    .catch(err =>{
        console.log("Error",err);
        res.send(`SNAFU!!${err}`);
    });

};
exports.class_test = function(req,res){
    Classes.findOne({ where: {schoolCode: body.icode, teacherCode: body.tcode, class: body.cl, section: body.sec, subjectCode: body.subject} })
    .then( row =>{
        if(row) 
        row.increment("numClasses").then(()=> res.send("Row Updated!"))
    })
}