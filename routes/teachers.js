/*Need to Edit the endpoints to accomodate parameters*/


const express = require('express');
var router = express.Router();

var {multer} = require('../middlewares/file_handler');
const {check_valid, only_teacher} = require('../middlewares/auth');

const {get_students, give_attendance, get_student_attendance, get_class_attendance} = require('../controllers/attendance');
const {assign_homework,check_homeworks, submit_homework_teacher,check_submissions,get_homework_submission, get_homework_file, get_homework_summary} = require('../controllers/homeworks');
const {get_quiz, get_quiz_file,set_quiz, get_submissions, get_quiz_summary} = require('../controllers/quiz');
const {set_exam,get_exams, grade_exam, get_exams_summary} = require('../controllers/exam');
const {get_announcements, make_announcement} = require('../controllers/announcement');
const {get_subjects, get_chapters, edit_chapter_status, add_chapter, get_doubt_file, get_doubts, resolve_doubt} = require('../controllers/chapters');
const {get_merit, edit_merit, edit_class_merit, reset_merit} = require('../controllers/merits')
const {publish_doc, get_doc, doc_download} = require('../controllers/documents');
const {get_teachers, get_parents} = require('../controllers/applications');
const {get_school_profile,get_routine,get_student_profile, get_teacher_profile, get_class_stats, get_class_quiz_stats, get_class_homework_stats, get_class_exam_stats} = require('../controllers/performance');

router.use(check_valid);
//replace formidable with multer
//for homework
router.post('/homework',multer.single('assignment'),only_teacher, assign_homework);
router.get('/homework/:icode/:class/:sec',only_teacher, check_homeworks);
router.get('/homework/download', only_teacher, get_homework_file);
router.post('/homework/submit/:icode/:class/:sec', only_teacher, submit_homework_teacher);
router.get('/homework/submissions/:icode/:class/:sec',only_teacher, check_submissions);
router.get('/homework/submissions/download',only_teacher, get_homework_submission);
router.get('/homework/:icode/:class/:sec/summary', only_teacher, get_homework_summary);

//for attendance
router.get('/attendance/:icode/:class/:sec',only_teacher, get_students);
router.post('/attendance/:icode/:class/:sec', only_teacher, give_attendance);
router.get('/attendance/student/:icode/:class/:sec', only_teacher, get_student_attendance);
router.get('/attendance/class/:icode/:class/:sec', only_teacher, get_class_attendance);

//for quiz
router.get('/quiz/:icode/:class/:sec',only_teacher, get_quiz);
router.get('/quiz/q', only_teacher, get_quiz_file);
router.post('/quiz/:icode/:class/:sec',multer.any(),only_teacher, set_quiz);
router.get('/quiz/submissions/:icode/:class/:sec', only_teacher, get_submissions);
router.get('/quiz/:icode/:class/:sec/summary', only_teacher, get_quiz_summary)

//for exam
router.get('/exam/:icode/:class/:examType', only_teacher, get_exams);
router.post('/exam', only_teacher, set_exam);
router.patch('/exam', only_teacher, grade_exam);
router.get('/exam/:icode/:class/:sec/summary', only_teacher, get_exams_summary)

//for announcements
router.get('/announce/:icode', only_teacher, get_announcements);
router.post('/announce/:icode/:class/:sec',multer.single('doc'), only_teacher, make_announcement)

//for chapters
router.get('/subject/:icode/:class/:sec', only_teacher, get_subjects);
router.get('/chapters/:icode/:class/:sec', only_teacher, get_chapters);
router.post('/chapters', only_teacher, add_chapter);
router.patch('/chapters/:icode/:class/:sec', only_teacher, edit_chapter_status);
//router.delete('/chapters/:icode/:class/:sec', remove_chapter);

//for chapter doubts and resolution
router.get('/chapters/doubts/:icode/:class/:sec', only_teacher, get_doubts)
router.get('/chapters/doubts/:icode/:class/:sec/:id', only_teacher, get_doubt_file)
router.post('/chapters/doubts/resolve/:icode/:class/:sec', multer.single('file'), only_teacher, resolve_doubt)

//for Reports/Merits
router.get('/merits/:icode/:class/:sec', only_teacher, get_merit);
router.post('/merits/:icode/:class/:sec', only_teacher, edit_merit);
router.post('/merits/class/:icode/:class/:sec', only_teacher, edit_class_merit);
router.post('/merits/reset/:icode', only_teacher, reset_merit);

//for Documents
// router.get('/docs/:icode/:class/:sec', get_doc);
// router.get('/docs/download/:icode', doc_download);
router.post('/docs/:icode/:class/:sec', multer.single('doc'),only_teacher, publish_doc);

//for Performance
router.get('/performance/student/:icode/:class/:sec', only_teacher, get_student_profile);
router.get('/routine/:icode/:class/:sec', only_teacher, get_routine);
router.get('/stats/:icode/:class/:sec', only_teacher, get_class_stats);
router.get('/stats/quiz/:icode/:class/:sec', only_teacher, get_class_quiz_stats);
router.get('/stats/homework/:icode/:class/:sec', only_teacher, get_class_homework_stats);
router.get('/stats/exam/:icode/:class/:sec', only_teacher, get_class_exam_stats);

//for Profile
router.get('/teacher/:icode', only_teacher, get_teachers)
router.get('/parent/:icode', only_teacher, get_parents)
router.get('/school/:icode', only_teacher, get_school_profile)
router.get('/profile/:icode', only_teacher, get_teacher_profile)

module.exports = router;
