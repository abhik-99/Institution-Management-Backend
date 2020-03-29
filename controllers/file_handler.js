const path = require('path');
const Multer = require('multer');
exports.multer = Multer({
    storage: Multer.memoryStorage(),
    limits: {
      fileSize: 2 * 1024 * 1024, // no larger than 2mb.
    },
    fileFilter: (req,file,cb)=>{
        const filetypes = /jpeg|jpg|png|pdf|rtf|docx/;
        // Check ext
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        // Check mime
        const mimetype = filetypes.test(file.mimetype);
      
        if(mimetype && extname){
            cb(null, true)
        } else {
            cb(null, false);
        }
    }
  });

