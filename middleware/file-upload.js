const multer = require('multer');
/* this package is to manage images */
const { v4: uuidv4 } = require('uuid');





const MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
  };


  const fileUpload = multer({
    limits: 500000,
    /* this is the set max size in bytes */
    storage: multer.diskStorage({
        destination: (req, file, callBack) => {
            callBack(null, 'uploads/images');
        },
        filename: (req, file, callBack) => {
          const ext = MIME_TYPE_MAP[file.mimetype];
            //we extract the right extension with mimetype to recognize and use it
            callBack(null, uuidv4() + '.' + ext)
            /* file name generator */
        }
    }),
    fileFilter: (req, file, callBack) => {
        const isValid = !!MIME_TYPE_MAP[file.mimetype];
        /* this will check if the returned extension is valid based on our criteria
        notice the double !! which takes the object and with the file.mimetype will check
        if the file valid or not. so it return truthy or falsey. pretty neat */
        let error = isValid ? null : new Error('Invalid mime type!');
        callBack(error, isValid);
    }
})


module.exports = fileUpload;