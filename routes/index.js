var express = require('express');
var router = express.Router();

let controller = require("../controllers/test_controller");
let {check_nigga, check_valid} = require('../middlewares/auth');
/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });
router.get('/',check_nigga, check_valid,controller.show_firebase_data);

module.exports = router;
