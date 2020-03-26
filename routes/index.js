var express = require('express');
var router = express.Router();
var {uploadDir} = require('../config/secrets');
var formidableMiddleware = require('express-formidable');

var {login,logout} = require('../controllers/login_out');
var {get_quiz_pic, set_quiz} = require('../controllers/quiz');
router.get('/',(req,res) => res.redirect('http://www.thestudieapp.com/'));
router.post('/login',login);
router.get('/logout',logout);
router.get('/quiz/:icode/:class', get_quiz_pic)

router.post('/quiz/:icode/:class', formidableMiddleware({uploadDir:uploadDir}),set_quiz)

module.exports = router;