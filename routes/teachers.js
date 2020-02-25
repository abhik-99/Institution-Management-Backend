var express = require('express');
var router = express.Router();
var formidableMiddleware = require('express-formidable');
var {check_valid, only_teacher} = require('../middlewares/auth');
var {assign_homework,check_homeworks,check_submissions,get_homework} = require('../controllers/homeworks');
var {uploadDir} = require('../config/secrets');

/* GET users listing. */
//router.get('/:type', controller.show_type);
router.use(check_valid, only_teacher);
router.post('/homework',formidableMiddleware({uploadDir: uploadDir, multiples: true }),assign_homework);
router.get('/homework',formidableMiddleware(),check_homeworks);
router.get('/homework/submissions/check',formidableMiddleware(),check_submissions);
router.get('/homework/submissions/download',get_homework);

module.exports = router;
