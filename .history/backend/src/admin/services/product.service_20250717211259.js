const productModel = require("../models/product.model");
const path = require("path");
const processHtmlWithPrefix = require("../utils/processHtmlWithPrefix");
const { downloadImage } = require("../utils/imageDownloader");
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
    let totalImageMap = [];

    // ✅ Danh sách các trường HTML cần xử lý ảnh từ web
    const htmlFields = [
      { key: "Intro", prefix: "intro" },
      { key: "Usage", prefix: "usage" },
      { key: "Ingredients", prefix: "ingredients" },
      { key: "Instructions", prefix: "instructions" },
    ];

    // ✅ Xử lý từng đoạn HTML: thay ảnh web → đường dẫn ảo, gom tất cả ảnh để tải về sau
    for (const { key, prefix } of htmlFields) {
      if (req.body[key]) {
        const { html, imageMap } = processHtmlWithPrefix(req.body[key], prefix);
        req.body[key] = html; // gán lại HTML đã chỉnh sửa
        totalImageMap = totalImageMap.concat(imageMap);
      }
    }

    // ✅ Thêm sản phẩm vào DB
    const result = await productModel.addProductDB(req.body);

    // ✅ Nếu thêm thành công → bắt đầu tải ảnh từ web về local
    if (result.success && totalImageMap.length > 0) {
      for (const { oldSrc, newSrc } of totalImageMap) {
        try {
          await downloadImage(oldSrc, newSrc);
          console.log(`✅ Tải thành công: ${oldSrc} → ${newSrc}`);
        } catch (err) {
          console.error(`❌ Tải thất bại ${oldSrc}:`, err.message);
        }
      }
    }

    return result;
  } catch (error) {
    console.error("❌ Lỗi addProduct:", error);
    return { success: false, error };
  }
};


