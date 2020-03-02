var express = require('express');
var router = express.Router();
var {login,logout} = require('../controllers/login_out');
var {get_students, give_attendance} = require('../controllers/attendance');
var {get_quiz, set_quiz} = require('../controllers/quiz');

router.get('/',(req,res) => res.redirect('http://www.thestudieapp.com/'));
router.post('/login',login);
router.get('/logout',logout);
router.get('/students', get_students);
router.get('/attendance', give_attendance);
router.get('/quiz',get_quiz);
router.post('/quiz',set_quiz);
module.exports = router;
