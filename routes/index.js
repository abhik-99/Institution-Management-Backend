var express = require('express');
var router = express.Router();
var {login,logout} = require('../controllers/login_out');
var {get_students, give_attendance} = require('../controllers/attendance');

router.get('/',(req,res) => res.redirect('http://www.thestudieapp.com/'));
router.post('/login',login);
router.get('/logout',logout);
router.get('/students',get_students);
router.get('/attendance', give_attendance);
module.exports = router;
