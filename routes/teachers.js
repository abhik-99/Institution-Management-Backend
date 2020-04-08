/*Need to Edit the endpoints to accomodate parameters*/


const express = require('express');
var router = express.Router();

var {multer} = require('../middlewares/file_handler');
const {check_valid, only_teacher} = require('../middlewares/auth');
const {get_students, give_attendance, get_student_attendance, get_class_attendance} = require('../controllers/attendance');
const {assign_homework,check_homeworks,check_submissions,get_homework_submission} = require('../controllers/homeworks');
const {get_quiz, get_quiz_file,set_quiz, get_submissions} = require('../controllers/quiz');
const {set_exam,get_exams, grade_exam} = require('../controllers/exam');
const {get_announcements, make_announcement} = require('../controllers/announcement');
const {get_chapters, edit_chapter_status, add_chapter, get_doubt_file, get_doubts, resolve_doubt} = require('../controllers/chapters');
const {get_merit, edit_merit, edit_class_merit, reset_merit} = require('../controllers/merits')
const {publish_doc, get_doc, doc_download} = require('../controllers/documents');
const {get_student_profile, get_teacher_profile} = require('../controllers/performance');

router.use(check_valid, only_teacher);
//replace formidable with multer
//for homework
router.post('/homework',multer.single('assignment'),assign_homework);
router.get('/homework/:icode/:class/:sec',check_homeworks);
router.get('/homework/submissions/:icode/:class/:sec',check_submissions);
router.get('/homework/submissions/download',get_homework_submission);

//for attendance
router.get('/attendance/:icode/:class/:sec',get_students);
router.post('/attendance/:icode/:class/:sec', give_attendance);
router.get('/attendance/student/:icode/:class/:sec', get_student_attendance);
router.get('/attendance/class/:icode/:class/:sec', get_class_attendance);


//for quiz
router.get('/quiz/:icode/:class/:sec',get_quiz);
router.get('/quiz/q/:icode/:class', get_quiz_file);
router.post('/quiz/:icode/:class/:sec',multer.any(),set_quiz);
router.get('/quiz/submissions/:icode/:class/:sec', get_submissions);

//for exam
router.get('/exam/:icode/:class/:examType', get_exams);
router.post('/exam', set_exam);
router.patch('/exam', grade_exam);

//for announcements
// router.get('/announce/:icode', get_announcements);
router.post('/announce/:icode/:class/:sec',multer.single('doc'), make_announcement)

//for chapters
router.get('/chapters/:icode/:class/:sec', get_chapters);
router.post('/chapters', add_chapter);
router.patch('/chapters/:icode/:class/:sec', edit_chapter_status);
//router.delete('/chapters/:icode/:class/:sec', remove_chapter);

//for chapter doubts and resolution
router.get('/chapters/doubts/:icode/:class/:sec', get_doubts)
router.get('/chapters/doubts/:icode/:class/:sec/:id', get_doubt_file)
router.post('/chapters/doubts/resolve/:icode/:class/:sec', multer.single('file'), resolve_doubt)

//for Reports/Merits
router.get('/merits/:icode/:class/:sec', get_merit);
router.post('/merits/:icode/:class/:sec', edit_merit);
router.post('/merits/class/:icode/:class/:sec', edit_class_merit);
router.post('/merits/reset/:icode', reset_merit);

//for Documents
// router.get('/docs/:icode/:class/:sec', get_doc);
// router.get('/docs/download/:icode', doc_download);
router.post('/docs/:icode/:class/:sec', multer.single('doc'),publish_doc);

//for Performance
router.get('/performance/student/:icode/:class/:sec', get_student_profile);


//for Profile
router.get('/profile/:icode', get_teacher_profile)
module.exports = router;
