var express = require('express');
var router = express.Router();
const {multer} = require('../controllers/file_handler');

var {login,logout} = require('../controllers/login_out');
var {get_announce_file} = require('../controllers/announcement')
var {get_doc, publish_doc, doc_download} = require('../controllers/documents')

router.get('/',(req,res) => res.redirect('http://www.thestudieapp.com/'));
router.post('/login',login);
router.get('/logout',logout);
router.post('/doc/:icode/:class/:sec', multer.single('doc'),publish_doc)
module.exports = router;