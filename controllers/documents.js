const {db} = require('./db');
var {upload_file,download_link, get_file_ref} = require('../gcp_buckets/file_handling');
var {bucketName} = require('../config/secrets');
var _ = require('lodash')

//POST Request. Uses formidablemiddleware
exports.publish_doc = function(req,res){
    console.log("Request Received!");
    body = req.body;
    file = req.file; //the file sent to the server must be with a key 'doc'
    params = req.params;

    //URL parameters
    icode = params.icode;
    cl = params.class;
    sec = params.sec;

    //URL Req Body
    des = body.description;
    tcode = body.tcode;
    console.log(file);
    if( !des || !tcode || !file) res.send({'status': 'failure', 'message': 'Please send proper data!'}); 
    else{
        pub_date = Date.now()
        filename = `documents/${icode}/${cl}/${sec}/${tcode}-${pub_date}-`+file.originalname;
        var blob = get_file_ref(bucketName, filename);
        console.log("Starting upload!")
        const blobStream = blob.createWriteStream({
            metadata: {
              contentType: file.mimetype
            }
          });
          blobStream.on("error", err => res.send({'status': 'failure', 'error': err.message}));
          blobStream.on("finish", () => {

            db.collection('documents').add({
                        'icode': icode,
                        'class': cl,
                        'section': sec,
                        'tcode': tcode,
                        'filePath': filename,
                        'fileType': file.mimetype
                    })
                    .then(ref => res.send({'status': 'success', 'message': `Document Published! ${ref.id}`}))
                    .catch(err => res.send({'status': 'failure', 'error': err.message}));
          });
          blobStream.end(file.buffer);

    }
};

//GET request
exports.get_doc = function(req,res){
    params = req.params;
    query = req.query;
    //URL parameters
    icode = params.icode;
    cl = params.class;
    sec = params.sec;

    //URL Query
    tcode = query.tcode;
    db.collection('documents')
    .where('icode', '==', icode)
    .where('class', '==', cl)
    .where('section', '==', sec)
    .get()
    .then(snap =>{
        if( !snap ) { res.send({'status': 'failure', 'message': 'No such match found!'}); }
        docs = [];
        snap.forEach(doc => {
            if(tcode){
                info = doc.data();
                if(info.tcode === tcode) docs.push({'docId': doc.id, 'data': info})
            } else docs.push({'docId': doc.id, 'data': info})
        })
        res.send({'status': 'success', 'data': docs});
    })
    .catch( err => res.send({'status': 'failure', 'error': err}));
};

exports.doc_download = function(req,res){
    params = req.params;
    query = req.query;
    //URL parameters
    icode = params.icode;

    //URL Query
    docId = query.id;
    if( !docId ) { res.send({'status':failure, 'message': 'Please send proper data!'}); }
    db.collection('documents').doc(docId)
    .get()
    .then( doc =>{
        filepath = _.pick(doc.data(),['filePath']);
        download_link(bucketName,file_path).then((data)=>{
            res.json({'status': 'success', 'download_link': data[0]});
        });
    })
    .catch( err => res.send({'status': 'failure', 'error': err}));
}

//needs to be implemented after UI is supplied.
exports.del_doc = function(req, res){
    params = req.params;
    query = req.query;
    //URL parameters
    icode = params.icode;
    cl = params.class;
    sec = params.sec;

    //URL Query
    tcode = query.tcode;
};