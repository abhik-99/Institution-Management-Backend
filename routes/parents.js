var express = require('express');
var router = express.Router();
var {check_valid, only_parent} = require('../middlewares/auth');
var {get_announcements} = require('../controllers/announcement');
var {get_students, get_student_attendance} = require('../controllers/attendance');
var {get_exams} = require('../controllers/exam');
var {get_students, get_student_attendance} = require('../controllers/attendance');

/* GET users listing. */
router.use(check_valid, only_parent);

//for announcements
router.get('/announce', get_announcements);

//for attendance
router.get('/attendance/:icode/:class/:sec',get_students);
router.get('/attendance/student/:icode/:class/:sec', get_student_attendance);

//for getting exams and their scores
router.get('/exam/:icode/:class/:examType', get_exams);

//for getting student
router.get('/attendance/:icode/:class/:sec',get_students); //would help a parent see who else is in his/her child's class.
router.get('/attendance/student/:icode/:class/:sec', get_student_attendance);//send the student's docID

module.exports = router;
