var express = require('express');
var router = express.Router();

router.get('/',(req,res) => res.redirect('http://www.thestudieapp.com/'));

module.exports = router;
