let Express = require('express');
let app = Express();

app.get("/message/:id", (req,res)=>{
    console.log("Bone working!");
    res.json({
        "params" : req.params.id,
        "header" : req.headers,
        "message" : "This project would be fininshed soon.",
        "sender" : "kuro99"
    });
});

app.listen(3000, ()=> console.log("Listening on port 3000."));
