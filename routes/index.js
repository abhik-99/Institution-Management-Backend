var express = require('express');
var router = express.Router();
var {uploadDir} = require('../config/secrets');
var formidableMiddleware = require('express-formidable');

var {login,logout} = require('../controllers/login_out');
var {give_attendance, get_students, get_attendance} = require('../controllers/attendance');
var {seed_SQL_db} = require('../controllers/seed_db');

router.get('/',(req,res) => res.redirect('http://www.thestudieapp.com/'));
router.post('/login',login);
router.get('/logout',logout);
router.get('/attendance/:icode/:class/:sec', get_students);
router.post('/attendance/:icode/:class/:sec', give_attendance);//still to be complete
router.post('/seed_classes', seed_SQL_db);

module.exports = router;