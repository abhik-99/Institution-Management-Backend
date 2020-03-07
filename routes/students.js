var express = require('express');
var router = express.Router();
var formidableMiddleware = require('express-formidable');
var {check_valid, only_student} = require('../middlewares/auth');
var {check_homeworks,submit_homework} = require('../controllers/homeworks');
var {get_quiz, submit_quiz} = require('../controllers/quiz');

var {uploadDir} = require('../config/secrets');

/* GET users listing. */
//router.get('/:type', controller.show_type);
router.use(check_valid, only_student);
router.get('/homework',formidableMiddleware(),check_homeworks);
router.post('/homework',formidableMiddleware({uploadDir: uploadDir, multiples: true}),submit_homework);

router.get('/quiz',get_quiz);
router.patch('/quiz', submit_quiz);


module.exports = router;
