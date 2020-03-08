var express = require('express');
var router = express.Router();
var {check_valid, only_parent} = require('../middlewares/auth');
var {get_announcements} = require('../controllers/announcement');

/* GET users listing. */
router.use(check_valid, only_parent);

router.get('/announce', get_announcements);
module.exports = router;
