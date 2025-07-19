const productModel = require("../models/product.model");
const path = require("path");
//=========================UPDATE THÔNG TIN SẢN PHẨM====================
exports.updateProduct = async (product) => {
  console.log("productID:", product.ProductID)
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
    // Tạo DetailID nếu chưa có
    req.body.DetailID = req.body.DetailID || `DTL_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    let fileUrl = "";
    if (req.file) {
      req.body.Image = req.file.filename;
      // 👉 Dùng URL public để trả về frontend
      fileUrl = `/assets/pictures/${req.file.filename}`;
    }

    // Parse numeric field
    req.body.Price = parseInt(req.body.Price) || 0;
    req.body.StockQuantity = parseInt(req.body.StockQuantity) || 0;
    req.body.IsHot = parseInt(req.body.IsHot) || 0;

    const now = new Date();
    req.body.CreatedAt = now;
    req.body.UpdatedAt = now;

    // Gọi model
    const result = await productModel.addProductDB(req.body);

    // Trả thêm fileUrl để controller gửi lại frontend
    return {
      ...result,
      fileUrl,
    };
  } catch (error) {
    console.log("❌ Lỗi trong addProduct service:", error);
    return { success: false, message: "Lỗi khi thêm sản phẩm vào database", error: error };
  }
};



// exports.addProduct = async (req) => {
//   try {
//     // ✅ Tạo DetailID nếu chưa có
//     const detailID = req.body.DetailID || `DTL_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

//     const {
//       ProductCode,
//       Name,
//       Price,
//       Type,
//       CategoryID,
//       SubCategoryID,
//       StockQuantity,
//       SupplierID,
//       IsHot,
//       Intro,
//       Usage,
//       Ingredients,
//       Instructions,
//       SubCategoryName,
//     } = req.body;

//     let imagePath = "";
//     if (req.file) {
//       imagePath = req.file.filename;
//     }

//     const product = {
//       ProductID: ProductCode,
//       ProductName: Name,
//       Price: parseInt(Price) || 0,
//       Type,
//       CategoryID,
//       SubCategoryID,
//       StockQuantity: parseInt(StockQuantity) || 0,
//       SupplierID,
//       IsHot: parseInt(IsHot) || 0,
//       Image: imagePath,
//       DetailID: detailID,
//       ProductDescription: Intro,
//       Ingredient: Ingredients,
//       Usage,
//       HowToUse: Instructions,
//       SubCategoryName: SubCategoryName ?? null,
//     };

//     // ✅ Gọi model để lưu DB
//     const result = await productModel.addProductDB(product);

//     return result;
//   } catch (error) {
//     console.error("❌ Lỗi trong addProduct service:", error);
//     throw new Error("Lỗi khi thêm sản phẩm");
//   }
// };




