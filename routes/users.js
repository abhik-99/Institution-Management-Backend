var express = require('express');
var router = express.Router();

var controller = require('../controllers/users');

/* GET users listing. */
router.get('/:type', controller.show_type);
router.get("/",(req,res,next) => {
  console.log("Nothing special!");
  res.redirect("/");
});

module.exports = router;
