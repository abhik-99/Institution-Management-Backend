let {db} = require('./db');
let {SQL_USER, SQL_PASSWORD, SQL_DATABASE, INSTANCE_CONNECTION_NAME} = require("../config/db");
let {Sequelize} = require('sequelize');

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
    console.log(SQL_DATABASE,INSTANCE_CONNECTION_NAME);
    var config = {
        user: process.env.SQL_USER || SQL_USER,
        database: process.env.SQL_DATABASE || SQL_DATABASE,
        password: process.env.SQL_PASSWORD || SQL_PASSWORD,
        socketPath: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME || INSTANCE_CONNECTION_NAME}`
        //socketPath: "34.93.249.229"
    }
    console.log("Config-",config);
    const sequelize = new Sequelize(config.database, config.user, config.password,{
        host: config.socketPath,
        dialect: 'mysql'
    });
    sequelize.authenticate()
    .then((obj)=> {console.log("connection successful!",obj); res.send("ALL OK!");})
    .catch((err)=> {console.log("Error Occured!",err); res.send("SNAFU!");});
    
};