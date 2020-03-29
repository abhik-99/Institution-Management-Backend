var express = require('express');
var router = express.Router();
var {check_valid, only_parent} = require('../middlewares/auth');
var {get_announcements, get_announce_file} = require('../controllers/announcement');
var {get_students, get_student_attendance} = require('../controllers/attendance');
var {get_exams} = require('../controllers/exam');
var {get_students, get_student_attendance} = require('../controllers/attendance');
var {get_student_profile} = require('../controllers/performance');

/* GET users listing. */
router.use(check_valid, only_parent);

//for announcements
router.get('/announce/:icode', get_announcements);
router.get('/announce/pic', get_announce_file);

//for attendance
router.get('/attendance/:icode/:class/:sec',get_students);
router.get('/attendance/student/:icode/:class/:sec', get_student_attendance);

//for getting exams and their scores
router.get('/exam/:icode/:class/:examType', get_exams);

//for getting student
router.get('/attendance/:icode/:class/:sec',get_students); //would help a parent see who else is in his/her child's class.
router.get('/attendance/student/:icode/:class/:sec', get_student_attendance);//send the student's docID

//for Performance
router.get('/performance/student/:icode/:class/:sec', get_student_profile);
module.exports = router;
