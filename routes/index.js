var express = require('express');
var router = express.Router();
var formidableMiddleware = require('express-formidable');
var {uploadDir} = require('../config/secrets');

var {login,logout} = require('../controllers/login_out');
var {get_announce_pic} = require('../controllers/announcement')

router.get('/',(req,res) => res.redirect('http://www.thestudieapp.com/'));
router.post('/login',login);
router.get('/logout',logout);
router.get('/annn', get_announce_pic)
module.exports = router;