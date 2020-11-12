
const fs = require('fs');

const HttpError = require('../models/http-error');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

const productCodeCreator = require('../util/product-code-creator')

const Product = require('../models/product');


const getAllProducts = async (req, res, next) => {
    let products;

    try {
        products = await Product.find({});
    } catch (err) {
        return next(new HttpError('Could not fetch products, please try again.', 500))
    }

    res.json({ products: products.map(u => u.toObject({ getters: true })) })


}

const getProductByCode = async (req, res, next) => {
    const productId = req.params.pid;
    let products;

    try {
        products = await Product.find({ code: productId })
        //see if it works. otherwise look into angela's or something.

    } catch (err) {
        return next(new HttpError('Something went wrong, could not find product', 500))
    }

    res.json({ products: products.map(u => u.toObject({ getters: true })) })

}

const getProductByName = async (req, res, next) => {
    const name = req.params.pid;
    let re = `/${name}/i`;
    let products;
    console.log(re)
    try {
        products = await Product.find({ name:  { $regex: name, $options: 'i'} })
        //see if it works. otherwise look into angela's or something.

    } catch (err) {
        return next(new HttpError('Something went wrong, could not find product', 500))
    }

    res.json({ products: products.map(u => u.toObject({ getters: true })) })
}





const createProduct = async (req, res, next) => {
    const { name, unit, price } = req.body;
    console.table(req.body)
    let code;
    try {
        code = productCodeCreator();
    } catch (err) {
        return next(err)
    }

    const sameCode = await Product.find({ code: code })
    if (sameCode) {
        code = productCodeCreator();
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs passed, please check your data', 422))
    }


    const createdProduct = new Product({
        name,
        unit,
        price,
        code: productCodeCreator(),
        image: req.file.path
    })

    try {
        createdProduct.save()
    } catch (err) {
        return next(new HttpError('Creating product failed, please try again.', 500))
    }

    res.status(201).json({ product: createdProduct })

}





const updateProduct = async (req, res, next) => {
    console.table(req.body)
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs passed, please check your data', 422))
    }

    const { name, unit, price } = req.body;
    const productId = req.params.pid;

    try {

        await Product.replaceOne({ code: productId }, {
            name: name,
            unit: unit,
            price: price,
            code: productId
        })
    } catch (err) {
        return next(new HttpError('Something went wrong, could not update product', 500))
    }

    res.status(200).json({ message: `successfully updated` })
}





const deleteProduct = async (req, res, next) => {
    const productId = req.params.pid;
    try {

        await Product.deleteOne({ code: productId });
    } catch (err) {
        return next(new HttpError('Could not delete product, please try again.', 500))
    }

    res.json({ message: 'success' })
}

exports.getAllProducts = getAllProducts;
exports.getProductByCode = getProductByCode;
exports.getProductByName = getProductByName;
exports.updateProduct = updateProduct;
exports.createProduct = createProduct;
exports.deleteProduct = deleteProduct;