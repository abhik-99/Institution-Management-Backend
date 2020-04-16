var express = require('express');
var router = express.Router();
const {multer} = require('../middlewares/file_handler');
const {class_test} = require('../controllers/test_controller')
const {seed_SQL_db} = require('../controllers/seed_db')
var {login,logout, recover_password} = require('../controllers/login_out');
var {set_quiz} = require('../controllers/quiz')
const {sql_initialize} = require('../controllers/test_controller')

router.get('/',(req,res) => res.redirect('http://www.thestudieapp.com/'));
router.post('/login',login);
router.get('/logout',logout);
//For password recovery.
router.post('/account/recover', recover_password)
module.exports = router;