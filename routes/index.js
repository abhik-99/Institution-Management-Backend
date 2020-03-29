var express = require('express');
var router = express.Router();
const {multer} = require('../middlewares/file_handler');

var {login,logout} = require('../controllers/login_out');
var {make_announcement} = require('../controllers/announcement')

router.get('/',(req,res) => res.redirect('http://www.thestudieapp.com/'));
router.post('/login',login);
router.get('/logout',logout);
module.exports = router;