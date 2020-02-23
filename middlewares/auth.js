let {db} = require('../controllers/db');
let {secret} = require("../config/secrets");
const jwt = require('jsonwebtoken');
exports.check_nigga = function(req,res,next){

    console.log("Checking nigga!");
    token = req.headers['x-access-token'];
    //console.log("Received Token-",token);
    if(!token){
        res.send({'message': 'No access token detected. please sign in'});
    }else{
        jwt.verify(token,secret,function(err, decoded){
            if (err) res.json({"message": "invalid jwt token!"});
            else{
                data = decoded.data;
                blacklistRef = db.doc('blacklist/tokens');
                blacklistRef.get()
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
                }).catch(err => {console.log(err); next();});
            }
        });
    }
};

exports.check_valid = function(req,res,next){
    console.log("Fisking!");
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
                    db.collection('users')
                    .where('username','==', JSON.parse(decoded.data)[2])
                    .where('session','array-contains',token)
                    .get()
                    .then(snap =>{
                        list=[]
                        snap.forEach(doc => list.push(doc.id));
                        if(list.length == 1){
                            next();
                        }else{
                            //console.log(list.length);
                            res.send({'message': 'duplicate or no matching token found!'});
                        }
                    }).catch(err=> res.send({"message":err}));
                }
            }
        });
    }
}