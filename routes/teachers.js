var express = require('express');
var router = express.Router();
var formidableMiddleware = require('express-formidable');
var {login,logout} = require('../controllers/login_out');
var {assign_homework,check_homeworks} = require('../controllers/homeworks');
var {uploadDir} = require('../config/secrets');

/* GET users listing. */
//router.get('/:type', controller.show_type);
router.post("/",login);
router.get("/logout", logout);
router.post('/homework',formidableMiddleware({uploadDir: uploadDir, multiples: true }),assign_homework);
router.get('/homework',formidableMiddleware(),check_homeworks);
module.exports = router;
