const {db} = require('./db');

exports.get_quiz = function(req,res){
    body = req.query;
    icode = body.icode;
    cl = body.class;
    section = body.section;
    author = body.author;
    subject = body.subject; 
    due = body.due_date;

    db.collection(`quizzes/${icode}/${cl}`)
    .get()
    .then(snap =>{
        list = [];
        snap.forEach( doc => list.push(doc.data()));
        if(section){
            console.log(section);
            list = list.filter(each => each.section === section);
        }
        if(author){
            list = list.filter(each => each.author === author);
        }
        if(subject){
            list = list.filter(each => each.subject == subject);
        }
        if(due){
            list.forEach(each => each.due_date._seconds > due);
        }
        res.send({'quiz': list});
    })
    .catch(err => res.send({'message': err}));    
};

//expects a json body in the req.body which conforms to the quiz design.
// IMP: Add a mechanism for checking valid schools
exports.set_quiz = function(req,res){
    console.log("req.body", req.body);
    body = req.body.quiz;
    icode = req.body.icode;
    title = body.title || 'none';
    subject = body.subject;
    cl = body.class;
    author = body.author;
    due = Date.parse(body.due_date); // send date a string object
    console.log(body);
    if( !cl || !author || !subject || !icode) { res.send({'message':"Please fill all the details!"}); }
    else {
        db.collection(`quizzes/${icode}/${cl}`)
        .add(body)
        .then(ref => res.send({'message': `Document added. Doc Id: ${ref.id}`}))
        .catch(err => res.send({'error': err.err}));
    }
};

//submitting quiz by student
exports.submit_quiz = function(req,res){
    // get student details, check score and put it in the student's profile.
}