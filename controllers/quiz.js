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
exports.set_quiz = function(req,res){
    body = req.body;
    title = body.title || 'none';
    subject = body.subject || 'none';
    cl = body.class || '0';
    author = body.author || 'ad hoc';
    due = new Date(body.due_date.toString());
    console.log("Body:", body);
    console.log("Date",due);
};