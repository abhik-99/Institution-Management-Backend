var express = require('express');
var router = express.Router();
var formidableMiddleware = require('express-formidable');
var {check_valid, only_teacher} = require('../middlewares/auth');
var {get_students, give_attendance} = require('../controllers/attendance');
var {assign_homework,check_homeworks,check_submissions,get_homework} = require('../controllers/homeworks');
var {get_quiz, set_quiz, get_submissions} = require('../controllers/quiz');
var {uploadDir} = require('../config/secrets');

/* GET users listing. */
//router.get('/:type', controller.show_type);
router.use(check_valid, only_teacher);
router.post('/homework',formidableMiddleware({uploadDir: uploadDir, multiples: true }),assign_homework);
router.get('/homework',formidableMiddleware(),check_homeworks);
router.get('/homework/submissions',formidableMiddleware(),check_submissions);
router.get('/homework/submissions/download',get_homework);
router.get('/attendace',get_students);
router.get('/quiz',get_quiz);
router.post('/quiz',set_quiz);
router.get('/quiz/submissions', get_submissions);

module.exports = router;
