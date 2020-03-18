var express = require('express');
var router = express.Router();
var {login,logout} = require('../controllers/login_out');
var {give_attendance} = require('../controllers/attendance');
var {get_announcements} = require('../controllers/announcement');
const { get_chapters} = require('../controllers/chapters');

router.get('/',(req,res) => res.redirect('http://www.thestudieapp.com/'));
router.post('/login',login);
router.get('/logout',logout);
router.get('/attendance', give_attendance);//still to be complete
router.get('/announce', get_announcements);
router.get('/chapters', get_chapters);

module.exports = router;