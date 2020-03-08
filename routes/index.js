var express = require('express');
var router = express.Router();
var {login,logout} = require('../controllers/login_out');
var {give_attendance} = require('../controllers/attendance');
var {get_announcements} = require('../controllers/announcement');

router.get('/',(req,res) => res.redirect('http://www.thestudieapp.com/'));
router.post('/login',login);
router.get('/logout',logout);
router.get('/attendance', give_attendance);//still to be complete
router.get('/announce', get_announcements);

module.exports = router;