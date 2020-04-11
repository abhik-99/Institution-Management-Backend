const express = require('express');
var router = express.Router();

const {check_valid, only_parent} = require('../middlewares/auth');

const {recover_password} = require('../controllers/login_out')
const {get_announcements, get_announce_file} = require('../controllers/announcement');
const {get_exams} = require('../controllers/exam');
const {get_students, get_student_attendance} = require('../controllers/attendance');
const {get_routine,get_student_profile, get_parent_profile} = require('../controllers/performance');
const {get_teachers, make_query, leave_application} = require('../controllers/applications');

/* GET users listing. */
router.use(check_valid, only_parent);

//for announcements
router.get('/announce/:icode', get_announcements);
router.get('/announce/file', get_announce_file);

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
router.get('/routine/:icode/:class/:sec', get_routine);

//For getting profile
router.get('/profile/:icode', get_parent_profile)

//For raising query.
router.get('/teacher/:icode', get_teachers)
router.post('/query/:icode', make_query)

//For leave applications
router.post('/leave/:icode', leave_application)

//For password recovery.
router.post('/account/recover', recover_password)
module.exports = router;