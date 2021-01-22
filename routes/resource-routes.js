const express = require('express');
const { check } = require('express-validator');

const resourceController = require('../controllers/resource-controller');
const fileUpload = require('../middleware/file-upload');


const router = express.Router();


router.get('/images/:pid', resourceController.getImages)


router.post('/:pid',
    fileUpload.single('image'),
    [
        check('name').not().isEmpty().escape().trim()
    ],
    resourceController.imageUpload
)




module.exports = router;