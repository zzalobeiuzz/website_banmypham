const productModel = require("../models/product.model");

exports.updateProduct = async (product) => {
    console.log("productID:")
  const exists = await productModel.checkProductExists(product.ProductID);

  if (!exists) {
    return { success: false, message: `Sản phẩm ID ${product.ProductID} không tồn tại` };
  }

  return await productModel.updateProduct(product);
};
