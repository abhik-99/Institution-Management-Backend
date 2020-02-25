var express = require('express');
var router = express.Router();
var {check_valid, only_parent} = require('../middlewares/auth');

/* GET users listing. */
router.use(check_valid, only_parent);
module.exports = router;
