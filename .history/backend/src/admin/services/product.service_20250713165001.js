const productModel = require("../models/product.model");
//=========================UPDATE THÔNG TIN SẢN PHẨM====================
exports.updateProduct = async (product) => {
    console.log("productID:",product.ProductID)
  const exists = await productModel.checkProductExists(product.ProductID);

  if (!exists) {
    return { success: false, message: `Sản phẩm ID ${product.ProductID} không tồn tại` };
  }

  return await productModel.updateProduct(product);
};
//=========================CHECK SẢN PHẨM TỒN TẠI====================
const checkProductExistence = async (barcode) => {
  const product = await productModel.findProductByBarcode(barcode);
  if (product) {
    return {
      exists: true,
      product: {
        id: product.Id,
        name: product.Name,
        price: product.Price,
        description: product.Description,
      },
    };
  } else {
    return {
      exists: false,
    };
  }
};

