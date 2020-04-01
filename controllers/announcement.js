let {db} = require('./db');
const {upload_file,get_file_ref} = require('../gcp_buckets/file_handling');
var {bucketName} = require('../config/secrets');
// /cloudsql/project-student-management:us-east1:test-studie-server
//GET request
exports.get_announcements = function(req,res){
    //following needs to be sent in url params
    params = req.params;
    icode = params.icode;


    //following needs to be sent in the query
    query = req.query;
    section = query.sec;
    cl = query.class;
    author = query.author;
    gen_announce = query.gen_announce;

    if( gen_announce){
        if( gen_announce != 'true' && gen_announce != 'false') { res.send({'status':'failure', 'error':'Please enter proper query parameters!'}); }        
    }
    gen_announce = (gen_announce === 'true');
    if( !icode ) { res.send({'status':'failure', 'error':'Please enter proper query parameters!'}); }
    db.collection('annoucement')
    .where('school', '==', icode)
    .where('gen_announce', '==', gen_announce)
    .get()
    .then(snap =>{
        docs = [];
        snap.docs.forEach(doc => {
            docs.push({'id': doc.id, 'data':doc.data()});
        });
        if( docs.length == 0) { res.send({'status':'failure', 'error':'No school found!'}); }
        if(!gen_announce){
            if(cl) { docs = docs.filter(doc => doc.data.class === cl); }
            if(section) { docs = docs.filter(doc => doc.data.section === section); }
            if(author) { docs = docs.filter(doc => doc.data.author.name === author); }
        }
        res.send({'status': 'success', 'announcements': docs});
    })
    .catch( err => res.send({'status': 'failure', 'error': err.message}));
};
exports.get_announce_file = function(req,res){
    query = req.query;
    id = query.id; //Doc Id of the Announcement;
    if(!id) res.send({'status': 'failure', 'message': 'Please send proper data!'})
    db.doc(`annoucement/${id}`)
    .get()
    .then( doc =>{
        if(!doc.data()) {
            res.send({'status': 'failure', 'message':'No such Announcement!'})
            return;
        }
        data = doc.data()
        if(data.hasFile){
            var ref = get_file_ref(bucketName,data.file.filePath);
        
            var stream = ref.createReadStream();
            res.writeHead(200, {'Content-Type': data.file.fileType });
            stream.on('data', function (data) {
                res.write(data);
                });
            
                stream.on('error', function (err) {
                console.log('error reading stream', err);
                });
            
                stream.on('end', function () {
                res.end();
                });
        }else res.send({'status': 'failure', 'message':'No such Announcement!'})
    })
    .catch( err => res.send({'status': 'failure', 'error': err.message}));
}

//POST request
exports.make_announcement = function(req,res){
    body = req.body;
    params = req.params;
    file = req.file;

    //URL params
    cl = params.class;
    sec = params.sec;
    icode = params.icode;

    //URL Body
    gen_announce = body.genAnnounce;
    announce = body.announce;
    tcode = body.tcode;
    date = Date.now();
    
    announcement = {};
    
    if(!icode || !tcode || (!announce || typeof announce !== 'string')) {
    res.send({'status':'failure', 'message': '1Please send proper data!'})
    return;
    }


    if( gen_announce != 'true' && gen_announce != 'false') { res.send({'status':'failure', 'error':'Please enter proper query parameters!'}); }
    else {
        announcement.gen_announce = (gen_announce === 'true');
    }
    
    announcement.school = icode;
    announcement.class = cl;
    announcement.section = sec;
    announcement.tcode = tcode;
    announcement.announcement = announce;
    filePath = '';

    if(file){
        fileType = file.mimetype;
        filePath = `announce/${icode}/${cl}/${sec}/${Date.now()}-${file.originalname}`
        announcement.hasFile = true;
        announcement.file = {'filePath':filePath,'fileType':fileType}
    }
    //Commiting to DB
    db.collection(`profiles/teachers/${icode}`)
    .where('code', '==', tcode)
    .get()
    .then(snap =>{
        teacher = [];
        snap.forEach( doc =>{
            info = doc.data();
            teacher.push({'name': info.name, 'tcode': info.code});
        });
        if(teacher.length != 1) res.send({'status':'failure', 'error': 'Duplicate or no profile found!'})

        announcement.author = teacher[0];
        announcement.date = date;
        db.collection('annoucement').add(announcement)
        .then(()=> {
            if(file){
                var blob = get_file_ref(bucketName, filePath);
                
                const blobStream = blob.createWriteStream({
                    metadata: {
                      contentType: file.mimetype
                    }
                  });
                blobStream.on("error", err => res.send({'status': 'failure', 'error': err.message}));
                blobStream.on("finish", () => res.send({'status': 'success','message': 'Announcement Added!'}));
                blobStream.end(file.buffer);
            } else  res.send({'status':'success', 'message': 'Announcement added successfully!'})
        })
        .catch( err => res.send({'status': 'failure', 'error': err.message}));
    })
    .catch(err => res.send({'status': 'failure', 'error':err.message}));
}

//DELETE Request. Not Given in the UI
exports.recede_announcement = function(req,res){
    
};