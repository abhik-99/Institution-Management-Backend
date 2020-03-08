let {db} = require('./db');

exports.get_announcements = function(req,res){
    body = req.query;
    
    icode = body.icode;
    section = body.section;
    cl = body.class;
    author = body.author;
    gen_announce = body.gen_announce;
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
            docs.push({'aId': doc.id, 'data':doc.data()});
        });
        if( docs.length == 0) { res.send({'status':'failure', 'error':'No school found!'}); }
        if(!gen_announce){
            if(cl) { docs = docs.filter(doc => doc.data.class === cl); }
            if(section) { docs = docs.filter(doc => doc.data.section === section); }
            if(author) { docs = docs.filter(doc => doc.data.author.name === author); }
        }
        res.send({'status': 'success', 'announcements': docs});
    })
    .catch( err => res.send({'status': 'failure', 'error': err.Error}));
};

exports.make_announcement = function(req,res){
    body = req.body;
    gen_announce = body.gen_announce;
    cl = body.class;
    sec = body.section;
    icode = body.icode;
    title = body.announcement.title;
    desc = body.announcement.desc;
    tcode = body.tcode;
    
    announcement = {};

    if(!icode || !tcode || !title || !desc) { res.send({'status':'failure', 'error': 'Please send proper data!'}); }

    if(!gen_announce){
        if(!cl || !sec) { res.send({'status':'failure', 'error': 'If not a general announcement, then include specifics!'}); }
        else{
            announcement.class = cl;
            announcement.section = sec;
        }
    }else{
        if( gen_announce != 'true' && gen_announce != 'false') { res.send({'status':'failure', 'error':'Please enter proper query parameters!'}); }
        else {
            announcement.gen_announce = (gen_announce === 'true');
        }
    }
    announcement.school = icode;
    announcement.announcement = { 'title': title, 'desc': desc};
    db.collection(`profiles/teachers/${icode}`)
    .where('code', '==', tcode)
    .get()
    .then(snap =>{
        teacher = [];
        snap.forEach( doc =>{
            info = doc.data();
            teacher.push({'name': info.name, 'tcode': info.code});
        });
        if(teacher.length != 1) { res.send({'status':'failure', 'error': 'Duplicate or no profile found!'}); }
        announcement.author = teacher[0];
        
        db.collection('annoucement').add(announcement)
        .then(()=> res.send({'status':'success', 'message': 'Announcement added successfully!'}))
        .catch( err => res.send({'status': 'failure', 'error': err}));
    })
    .catch(err => res.send({'status': 'failure', 'error':'Error in Teacher\'s Profile!'}));
}