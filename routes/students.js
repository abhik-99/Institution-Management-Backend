/*Need to Edit the endpoints to accomodate parameters*/

var express = require('express');
var router = express.Router();
var formidableMiddleware = require('express-formidable');
var {check_valid, only_student} = require('../middlewares/auth');
var {check_homeworks,submit_homework} = require('../controllers/homeworks');
var {get_quiz, submit_quiz} = require('../controllers/quiz');
var {get_announcements} = require('../controllers/announcement');
var {get_exams} = require('../controllers/exam');
var {get_chapters} = require('../controllers/chapters');
var {get_merit} = require('../controllers/merits');
var {get_doc, doc_download} = require('../controllers/documents');

var {uploadDir} = require('../config/secrets');

router.use(check_valid, only_student);

router.get('/homework',check_homeworks);
router.post('/homework',formidableMiddleware({uploadDir: uploadDir, multiples: true}),submit_homework);

router.get('/quiz',get_quiz);
router.patch('/quiz', submit_quiz);

router.get('/announce/:icode', get_announcements);


router.get('/exam/:icode/:class/:examType', get_exams);

router.get('/chapters/:icode/:class/:sec', get_chapters);

router.get('/merits/:icode/:class/:sec', get_merit);

//for Documents
router.get('/docs/:icode/:class/:sec', get_doc);
router.get('/docs/download/:icode/', doc_download);

module.exports = router;
