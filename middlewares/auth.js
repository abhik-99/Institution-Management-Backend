let {db} = require('../controllers/db');
const jwt = require('jsonwebtoken');
const {PUB} = require('../config/keys')
const {firebaseServiceAccount} = require('../config/secrets');

exports.check_valid = function(req,res,next){
    type = req.headers.type;
    token = req.headers['x-access-token'];
    //console.log("Received Token-",token);
    if(!token) { res.send({'message': 'No access token detected. Please sign in!'});}
    else if(!type) { res.send({'message': 'Incorrect Headers. Please sign in!'});}
    else{
        jwt.verify(token,PUB.trim(),{ 
            algorithms: ['RS256'],
            issuer: firebaseServiceAccount,
            subject: firebaseServiceAccount,
            audience: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
           },function(err, decoded){
            if (err) { console.log(err);res.send({"message": "invalid jwt token!"}); }
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

    paramsIcode = req.params.icode;
    bodyIcode = req.body.icode;
    queryIcode = req.query.icode;

    if( !type || !token){
        res.send({'message': 'invalid headers!'});
    }else{
        jwt.verify(token, PUB.trim(),{ 
            algorithms: ['RS256'],
            issuer: firebaseServiceAccount,
            subject: firebaseServiceAccount,
            audience: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
           }, (err,decoded)=>{
            tokenData = JSON.parse(decoded.data)
            if(err) { console.log(err); return res.send({'message':'invalid token!'});}
            else{
                if(tokenData[0] != type && type !== 'teacher') return res.send({'message':'header token mismath!'});
                if(paramsIcode && tokenData[1] !== paramsIcode) return res.send({'status': 'failure','message':'Header token mismath!'});
                if(bodyIcode && tokenData[1] !== bodyIcode) return res.send({'status': 'failure','message':'Header token mismath!'});
                if(queryIcode && tokenData[1] !== queryIcode) return res.send({'status': 'failure','message':'Header token mismath!'});

                next();
            }
        });
    }
}

exports.only_parent = function(req,res,next){
    type = req.headers.type;
    token = req.headers['x-access-token'];

    paramsIcode = req.params.icode;
    bodyIcode = req.body.icode;
    queryIcode = req.query.icode;

    if( !type || !token){
        res.send({'message': 'invalid headers!'});
    }else{
        jwt.verify(token, PUB.trim(),{ 
            algorithms: ['RS256'],
            issuer: firebaseServiceAccount,
            subject: firebaseServiceAccount,
            audience: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
           }, (err,decoded)=>{
            tokenData = JSON.parse(decoded.data)
            if(err) return res.send({'message':'invalid token!'});
            else{
                if(tokenData[0] != type && type !== 'parent') return res.send({'message':'header token mismath!'});
                if(paramsIcode && tokenData[1] !== paramsIcode) return res.send({'status': 'failure','message':'Header token mismath!'});
                if(bodyIcode && tokenData[1] !== bodyIcode) return res.send({'status': 'failure','message':'Header token mismath!'});
                if(queryIcode && tokenData[1] !== queryIcode) return res.send({'status': 'failure','message':'Header token mismath!'});

                next();
            }
        });
    }
}

exports.only_student = function(req,res,next){
    type = req.headers.type;
    token = req.headers['x-access-token'];

    paramsIcode = req.params.icode;
    bodyIcode = req.body.icode;
    queryIcode = req.query.icode;

    if( !type || !token){
        res.send({'message': 'invalid headers!'});
    }else{
        jwt.verify(token, PUB.trim(),{ 
            algorithms: ['RS256'],
            issuer: firebaseServiceAccount,
            subject: firebaseServiceAccount,
            audience: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
           }, (err,decoded)=>{
            tokenData = JSON.parse(decoded.data)
            if(err) {console.log(err); return res.send({'message1':'invalid token!'});}
            else{
                if(tokenData[0] != type && type !== 'student') return res.send({'message':'header token mismath!'});
                if(paramsIcode && tokenData[1] !== paramsIcode) return res.send({'status': 'failure','message':'Header token mismath!'});
                if(bodyIcode && tokenData[1] !== bodyIcode) return res.send({'status': 'failure','message':'Header token mismath!'});
                if(queryIcode && tokenData[1] !== queryIcode) return res.send({'status': 'failure','message':'Header token mismath!'});

                next();
            }
        });
    }
}