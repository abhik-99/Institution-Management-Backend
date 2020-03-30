var express = require('express');
var router = express.Router();
const {multer} = require('../middlewares/file_handler');

var {login,logout} = require('../controllers/login_out');
var {set_quiz} = require('../controllers/quiz')

router.get('/',(req,res) => res.redirect('http://www.thestudieapp.com/'));
router.post('/login',login);
router.get('/logout',logout);
router.post('/quiz/:icode/:class/:sec', multer.any(),set_quiz)
module.exports = router;