var express = require('express');
var router = express.Router();
var formidableMiddleware = require('express-formidable');
var {login,logout} = require('../controllers/login_out');
var {assign_homework} = require('../controllers/homeworks');
var {uploadDir} = require('../config/secrets');
/* GET users listing. */
//router.get('/:type', controller.show_type);
router.post("/",login);
router.get("/logout", logout);

router.post('/homework',formidableMiddleware({uploadDir: uploadDir }),assign_homework);
module.exports = router;
