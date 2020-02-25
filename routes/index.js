var express = require('express');
var router = express.Router();
var {login,logout} = require('../controllers/login_out');

router.get('/',(req,res) => res.redirect('http://www.thestudieapp.com/'));
router.post('/login',login);
router.get('/logout',logout);

module.exports = router;
