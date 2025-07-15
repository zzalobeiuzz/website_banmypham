const productModel = require("../models/product.model");
const path = require("path");
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
exports.checkProductExistence = async (barcode) => {
  const product = await productModel.checkProductExists(barcode);
  if (product) {
    return {
      exists: true,
      product: {
        id: product.ProductID,
        name: product.ProductName,
        description: product.Description,
        isHot: product.IsHot,
        type: product.Type,
        price: product.Price,
        categoryId: product.CategoryID,
        stockQuantity: product.StockQuantity,
        createdAt: product.CreatedAt,
        updatedAt: product.UpdatedAt,
        supplierId: product.SupplierID,
        image: product.Image,
      },
    };
  } else {
    return {
      exists: false,
    };
  }
};




exports.addProduct = async (req) => {
  try {
    // ✅ Nếu client gửi DetailID, dùng; nếu không thì tự tạo
    const detailID = req.body.DetailID || `DTL_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const {
      ProductCode,
      Name,
      Price,
      Type,
      CategoryID,
      SubCategoryID,
      StockQuantity,
      SupplierID,
      IsHot,
      Intro,
      Usage,
      Ingredients,
      Instructions,
      SubCategoryName, // Nếu có từ client
    } = req.body;

    console.log("👉 req.body:", req.body);

    let imagePath = "";
    if (req.file) {
      imagePath = req.file.filename;
    }

    // ✅ Build product object
    const product = {
      ProductID: ProductCode,
      ProductName: Name,
      Price: parseInt(Price) || 0,
      Type,
      CategoryID,
      SubCategoryID,
      StockQuantity: parseInt(StockQuantity) || 0,
      SupplierID,
      IsHot: parseInt(IsHot) || 0,
      Image: imagePath,
      DetailID: detailID,

      // Các trường chi tiết (insert PRODUCT_DETAIL)
      ProductDescription: Intro,
      Ingredient: Ingredients,
      Usage: Usage,
      HowToUse: Instructions,

      // Subcategory nếu cần
      SubCategoryName: SubCategoryName ?? null,
    };

    return product;
  } catch (error) {
    console.error("❌ Lỗi trong addProduct:", error);
    throw new Error("Lỗi khi xử lý dữ liệu sản phẩm");
  }
};



