var express = require('express');
var router = express.Router();
var formidableMiddleware = require('express-formidable');
var {login,logout} = require('../controllers/login_out');
var {check_homeworks,submit_homework} = require('../controllers/homeworks');
var {uploadDir} = require('../config/secrets');

/* GET users listing. */
//router.get('/:type', controller.show_type);
router.post("/",login);
router.get("/logout", logout);
router.get("/homework",formidableMiddleware(),check_homeworks);
router.post("/homework",formidableMiddleware({uploadDir: uploadDir, multiples: true}),submit_homework);


module.exports = router;
