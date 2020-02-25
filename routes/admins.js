var express = require('express');
var router = express.Router();
var {check_valid, only_admin} = require('../middlewares/auth');

/* GET users listing. */
router.use(check_valid, only_admin);
module.exports = router;
