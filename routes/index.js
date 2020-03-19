var express = require('express');
var router = express.Router();
var {uploadDir} = require('../config/secrets');
var formidableMiddleware = require('express-formidable');

var {login,logout} = require('../controllers/login_out');
var {give_attendance} = require('../controllers/attendance');
var {get_announcements} = require('../controllers/announcement');
const { get_chapters, add_chapter, edit_chapter_status} = require('../controllers/chapters');
const {publish_doc, get_doc, del_doc} = require('../controllers/documents');

router.get('/',(req,res) => res.redirect('http://www.thestudieapp.com/'));
router.post('/login',login);
router.get('/logout',logout);
router.get('/attendance', give_attendance);//still to be complete
router.get('/announce', get_announcements);
router.get('/chapters/:icode/:class/:sec', get_chapters);
router.post('/chapters', add_chapter);
router.patch('/chapters/:icode/:class/:sec', edit_chapter_status);

router.post('/docs/:icode/:class/:sec', formidableMiddleware({ uploadDir: './files', multiples: true }),publish_doc);
module.exports = router;