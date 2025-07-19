const productModel = require("../models/product.model");
const path = require("path");
const fs = require("fs");
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

    // ==== Xử lý ảnh chính (file image gửi kèm)
    if (req.file) {
      const rawName = path.basename(req.file.originalname, path.extname(req.file.originalname));
      const filename = `${rawName.replace(/\s+/g, "_")}.jpg`;
      req.body.Image = filename;

      const savePath = path.join(__dirname, "../../../uploads/assets/pictures", filename);

      if (!fs.existsSync(savePath)) {
        fs.mkdirSync(path.dirname(savePath), { recursive: true });
        fs.writeFileSync(savePath, req.file.buffer);
        console.log("✅ Đã lưu ảnh:", filename);
      } else {
        console.log("⚠️ Ảnh đã tồn tại, không lưu lại:", filename);
      }
    }

    // ==== Xử lý HTML có chứa ảnh (Intro, Usage...)
    const htmlFields = [
      { key: "Intro", prefix: "intro" },
      { key: "Usage", prefix: "usage" },
      { key: "Ingredients", prefix: "ingredients" },
      { key: "Instructions", prefix: "instructions" },
    ];

    for (const { key, prefix } of htmlFields) {
      if (req.body[key]) {
        const { html, imageMap } = processHtmlWithPrefix(req.body[key], prefix);
        req.body[key] = html;
        totalImageMap = totalImageMap.concat(imageMap);
      }
    }

    // ==== Lưu DB
    const result = await productModel.addProductDB(req.body);

    // Nếu thêm thành công => tải ảnh trong nội dung HTML
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
    return { success: false, message: "Lỗi khi thêm sản phẩm", error };
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




