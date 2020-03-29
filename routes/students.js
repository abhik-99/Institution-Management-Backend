/*Need to Edit the endpoints to accomodate parameters*/

var express = require('express');
var router = express.Router();
var formidableMiddleware = require('express-formidable');
var {check_valid, only_student} = require('../middlewares/auth');
var {check_homeworks,submit_homework} = require('../controllers/homeworks');
var {get_quiz, get_quiz_file, submit_quiz} = require('../controllers/quiz');
var {get_announcements, get_announce_file} = require('../controllers/announcement');
var {get_exams} = require('../controllers/exam');
var {get_chapters} = require('../controllers/chapters');
var {get_merit} = require('../controllers/merits');
var {get_doc, doc_download} = require('../controllers/documents');
var {raise_doubt, get_doubts} = require('../controllers/chapters');
var {get_students, get_student_attendance} = require('../controllers/attendance');

var {uploadDir} = require('../config/secrets');

router.use(check_valid, only_student);

//for homework
router.get('/homework/:icode/:class/:sec',check_homeworks);
router.post('/homework',formidableMiddleware({uploadDir: uploadDir, multiples: true}),submit_homework);

//for attendance
router.get('/attendance/:icode/:class/:sec',get_students);
router.get('/attendance/student/:icode/:class/:sec', get_student_attendance);

//for quiz
router.get('/quiz/:icode/:class/:sec',get_quiz);
router.get('/quiz/q/:icode/:class', get_quiz_file);
router.post('/quiz', submit_quiz);

//for fetching announcements
router.get('/announce/:icode', get_announcements);
router.get('/announce/pic', get_announce_file);

//for getting exams and their scores
router.get('/exam/:icode/:class/:examType', get_exams);

//for getting chapters and chapter details. Returns doubts asked as well.
//Doubts may be filtered for each student.
router.get('/chapters/:icode/:class/:sec', get_chapters);

//for raising doubts and fetching chapter doubts in a refined manned.
router.get('/chapters/doubts/:icode/:class/:sec', get_doubts);
router.post('/chapters/doubts/:icode/:class/:sec', raise_doubt);

//for fetching the merit points and history of a student.
router.get('/merits/:icode/:class/:sec', get_merit);

//for Documents
router.get('/docs/:icode/:class/:sec', get_doc);
router.get('/docs/download/:icode/', doc_download);

module.exports = router;
