const express = require('express');
const { check } = require('express-validator')

const fileUpload = require('../middleware/file-upload')
const productsControllers = require('../controllers/products-controller');

const router = express.Router();


router.get('/', productsControllers.getAllProducts)
router.get('/numbers/:pid', productsControllers.getProductByCode)
router.get('/letters/:pid', productsControllers.getProductByName)

router.post('/:pid',
    fileUpload.single('image'),
    [
        check('name').not().isEmpty().escape().trim(),
        check('unit').not().isEmpty().escape().trim(),
        check('price').not().isEmpty().escape().trim()
    ],
    productsControllers.createProduct
);

router.patch('/:pid',
    fileUpload.single('image'),
    [
        check('name').not().isEmpty().escape().trim(),
        check('unit').not().isEmpty().escape().trim(),
        check('price').not().isEmpty().escape().trim()
    ],
    productsControllers.updateProduct
);

router.delete('/:pid', [
    check('code').not().isEmpty().escape().trim()
], productsControllers.deleteProduct
);


module.exports = router;

