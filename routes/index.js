var express = require('express');
var router = express.Router();
var {uploadDir} = require('../config/secrets');
var formidableMiddleware = require('express-formidable');

var {login,logout} = require('../controllers/login_out');
var {give_attendance, get_students, get_class_attendance} = require('../controllers/attendance');
var {seed_SQL_db} = require('../controllers/seed_db');
var {set_quiz} = require('../controllers/quiz');
router.get('/',(req,res) => res.redirect('http://www.thestudieapp.com/'));
router.post('/login',login);
router.get('/logout',logout);
router.post('/quiz/:icode/:class',formidableMiddleware({uploadDir: uploadDir, multiples:true}), set_quiz)

module.exports = router;