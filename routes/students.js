var express = require('express');
var router = express.Router();

var {login,logout} = require('../controllers/login_out');

/* GET users listing. */
//router.get('/:type', controller.show_type);
router.post("/",login);
router.get("/logout", logout);
module.exports = router;
