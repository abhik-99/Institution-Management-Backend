/*Need to Edit the endpoints to accomodate parameters*/

const express = require('express');
var router = express.Router();
var {multer} = require('../middlewares/file_handler')
const {check_valid, only_student} = require('../middlewares/auth');

const {check_homeworks,submit_homework, get_homework_file} = require('../controllers/homeworks');
const {get_quiz, get_quiz_file, submit_quiz} = require('../controllers/quiz');
const {get_announcements, get_announce_file} = require('../controllers/announcement');
const {get_exams} = require('../controllers/exam');
const {get_chapters, get_subjects} = require('../controllers/chapters');
const {get_merit} = require('../controllers/merits');
const {get_doc, doc_download} = require('../controllers/documents');
const {raise_doubt, get_doubts, get_answer_file} = require('../controllers/chapters');
const {get_students, get_student_attendance} = require('../controllers/attendance');
const {get_student_profile, get_routine, get_school_profile} = require('../controllers/performance');
const {get_teachers} = require('../controllers/applications');

router.use(check_valid);

//for homework
router.get('/homework/:icode/:class/:sec',only_student, check_homeworks);
router.get('/homework/download', only_student, get_homework_file);
router.post('/homework',multer.single('assignment'),only_student, submit_homework);

//for attendance
router.get('/attendance/:icode/:class/:sec',only_student, get_students);
router.get('/attendance/student/:icode/:class/:sec', only_student, get_student_attendance);

//for quiz
router.get('/quiz/:icode/:class/:sec',only_student, get_quiz);
router.get('/quiz/q', only_student, get_quiz_file);
router.post('/quiz', only_student, submit_quiz);

//for fetching announcements
router.get('/announce/file', only_student, get_announce_file);
router.get('/announce/:icode', only_student, get_announcements);

//for getting exams and their scores
router.get('/exam/:icode/:class/:examType', only_student, get_exams);

//for getting chapters and chapter details. Returns doubts asked as well.
//Doubts may be filtered for each student.
router.get('/subject/:icode/:class/:sec', only_student, get_subjects);
router.get('/chapters/:icode/:class/:sec', only_student, get_chapters);

//for raising doubts and fetching chapter doubts in a refined manned.
router.get('/chapters/doubts/:icode/:class/:sec', only_student, get_doubts);
router.post('/chapters/doubts/:icode/:class/:sec', multer.single('file'),only_student, raise_doubt);
router.get('/chapters/doubts/:icode/:class/:sec/:id/:cn', only_student, get_answer_file);

//for fetching the merit points and history of a student.
router.get('/merits/:icode/:class/:sec', only_student,get_merit);

//for Documents
router.get('/docs/:icode/:class/:sec', only_student,get_doc);
router.get('/docs/download/:icode/', only_student,doc_download);

//for Performance
router.get('/performance/:icode', only_student,get_student_profile);
router.get('/teacher/:icode', only_student,get_teachers);
router.get('/school/:icode', only_student,get_school_profile);
router.get('/routine/:icode/:class/:sec', only_student,get_routine);

module.exports = router;
