let {db} = require('../controllers/db');
let {secret} = require("../config/secrets");
const jwt = require('jsonwebtoken');

exports.check_valid = function(req,res,next){
    type = req.headers.type;
    console.log("Checking nigga!");
    token = req.headers['x-access-token'];
    //console.log("Received Token-",token);
    if(!token) { res.send({'message': 'No access token detected. Please sign in!'});}
    else if(!type) { res.send({'message': 'Incorrect Headers. Please sign in!'});}
    else{
        jwt.verify(token,secret,function(err, decoded){
            if (err) { res.send({"message": "invalid jwt token!"}); }
            else{
                data = decoded.data;
                if( JSON.parse(data)[0] != type) { res.send({'message': 'Headers mismatch'}); }
                else{
                    db.doc('blacklist/tokens').get()
                    .then(doc =>{
                        if (!doc.exists) {
                            res.json({"message": "empty blacklist!"});
                        } else {
                            doc = doc.data();
                            token_flag = doc.token_arr.includes(token);
                        // console.log("Token Array contains?",token);
                            if(token_flag){
                                res.send({'message': 'blacklisted token detected!'});
                            }else{
                                next();
                            }
                        }
                    }).catch(err => {
                        console.log(err); res.send({'message': err});
                    });
                }
            }
        });
    }
};

exports.only_teacher = function(req,res,next){
    type = req.headers.type;
    token = req.headers['x-access-token'];
    if( !type || !token){
        res.send({'message': 'invalid headers!'});
    }else{
        jwt.verify(token, secret, (err,decoded)=>{
            if(err){
                res.send({'message':'invalid token!'});
            }else{
                if(JSON.parse(decoded.data)[0] != type){
                    //console.log(type, decoded.data[0]);
                    res.send({'message':'header token mismath!'});
                }else{
                    if(type === 'teacher') { next(); }
                    else { res.send({'message': 'Only Teachers allowed at this route!'}); }
                }
            }
        });
    }
}

exports.only_parent = function(req,res,next){
    type = req.headers.type;
    token = req.headers['x-access-token'];
    if( !type || !token){
        res.send({'message': 'invalid headers!'});
    }else{
        jwt.verify(token, secret, (err,decoded)=>{
            if(err){
                res.send({'message':'invalid token!'});
            }else{
                if(JSON.parse(decoded.data)[0] != type){
                    //console.log(type, decoded.data[0]);
                    res.send({'message':'header token mismath!'});
                }else{
                    if(type === 'parent') { next(); }
                    else { res.send({'message': 'Only Parents allowed at this route!'}); }
                }
            }
        });
    }
}

exports.only_student = function(req,res,next){
    type = req.headers.type;
    token = req.headers['x-access-token'];
    if( !type || !token){
        res.send({'message': 'invalid headers!'});
    }else{
        jwt.verify(token, secret, (err,decoded)=>{
            if(err){
                res.send({'message':'invalid token!'});
            }else{
                if(JSON.parse(decoded.data)[0] != type){
                    //console.log(type, decoded.data[0]);
                    res.send({'message':'header token mismath!'});
                }else{
                    if(type === 'student') { next(); }
                    else { res.send({'message': 'Only Students allowed at this route!'}); }
                }
            }
        });
    }
}

exports.only_admin = function(req,res,next){
    type = req.headers.type;
    token = req.headers['x-access-token'];
    if( !type || !token){
        res.send({'message': 'invalid headers!'});
    }else{
        jwt.verify(token, secret, (err,decoded)=>{
            if(err){
                res.send({'message':'invalid token!'});
            }else{
                if(JSON.parse(decoded.data)[0] != type){
                    //console.log(type, decoded.data[0]);
                    res.send({'message':'header token mismath!'});
                }else{
                    if(type === 'admin') { next(); }
                    else { res.send({'message': 'Only Admins allowed at this route!'}); }
                }
            }
        });
    }
}