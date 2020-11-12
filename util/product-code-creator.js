


const productCodeCreator = () => {
    let productCode = [];
    let numb;
    for (let i = 0; i < 4; i++) {
        numb = Math.random() * 10;
        productCode.push(Math.floor(numb))
    }


    return productCode.join('');
}





module.exports = productCodeCreator