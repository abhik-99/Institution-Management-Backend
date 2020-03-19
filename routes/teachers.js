/*Need to Edit the endpoints to accomodate parameters*/


var express = require('express');
var router = express.Router();
var formidableMiddleware = require('express-formidable');
var {uploadDir} = require('../config/secrets');

var {check_valid, only_teacher} = require('../middlewares/auth');
var {get_students, give_attendance} = require('../controllers/attendance');
var {assign_homework,check_homeworks,check_submissions,get_homework} = require('../controllers/homeworks');
var {get_quiz, set_quiz, get_submissions} = require('../controllers/quiz');
var {set_exam,get_exams, grade_exam} = require('../controllers/exam');
var {get_announcements, make_announcement} = require('../controllers/announcement');
var {get_chapters, edit_chapter_status, add_chapter, remove_chapter} = require('../controllers/chapters');
var {get_merit, edit_merit, reset_merit} = require('../controllers/merits');
var {publish_doc, get_doc, doc_download} = require('../controllers/documents');

router.use(check_valid, only_teacher);

//for homework
router.post('/homework',formidableMiddleware({uploadDir: uploadDir, multiples: true }),assign_homework);
router.get('/homework',check_homeworks);
router.get('/homework/submissions',check_submissions);
router.get('/homework/submissions/download',get_homework);

//for attendance
router.get('/attendance',get_students);
router.post('/attendance', give_attendance);

//for quiz
router.get('/quiz',get_quiz);
router.post('/quiz',set_quiz);
router.get('/quiz/submissions', get_submissions);

//for exam
router.get('/exam/:icode/:class/:examType', get_exams);
router.post('/exam', set_exam);
router.patch('/exam', grade_exam);

//for announcements
router.get('/announce/:icode', get_announcements);
router.post('/announce', make_announcement);

//for chapters
router.get('/chapters/:icode/:class/:sec', get_chapters);
router.post('/chapters/', add_chapter);
router.patch('/chapters/:icode/:class/:sec', edit_chapter_status);
router.delete('/chapters/:icode/:class/:sec', remove_chapter);

//for Reports/Merits
router.get('/merits/:icode/:class/:sec', get_merit);
router.post('/merits/:icode/:class/:sec', edit_merit);
router.post('/merits/reset/:icode', reset_merit);

//for Documents
router.get('/docs/:icode/:class/:sec', get_doc);
router.get('/docs/download/:icode/', doc_download);
router.post('/docs/:icode/:class/:sec', publish_doc);

module.exports = router;
