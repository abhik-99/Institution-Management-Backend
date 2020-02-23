let {db} = require('../controllers/db');
let {secret} = require("../config/secrets");
const jwt = require('jsonwebtoken');
exports.check_nigga = function(req,res,next){
    console.log("Checking nigga!");
    token = req.headers['x-access-token'];
    jwt.verify(token,secret,function(err, decoded){
        if (err) console.log("Error Occured!",err);
        console.log("Decoded Token's data",JSON.parse(decoded.data));
    });
    next();
};