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
    // === Giữ nguyên các xử lý cơ bản ===
    req.body.DetailID = req.body.DetailID || `DTL_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    req.body.Price = parseInt(req.body.Price) || 0;
    req.body.StockQuantity = parseInt(req.body.StockQuantity) || 0;
    req.body.IsHot = parseInt(req.body.IsHot) || 0;
    const now = new Date();
    req.body.CreatedAt = now;
    req.body.UpdatedAt = now;

    // === Xử lý ảnh trong HTML: Intro, Usage, Ingredients, Instructions ===
    let totalImageMap = [];
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
        totalImageMap.push(...imageMap);
      }
    }

    // === Nếu có ảnh chính thì set tên để lưu vào DB, nhưng chưa lưu ảnh vội ===
    let imageToSave = null;
    if (req.file) {
      const rawName = path.basename(req.file.originalname, path.extname(req.file.originalname));
      const filename = `${rawName.replace(/\s+/g, "_")}.jpg`;
      req.body.Image = filename;

      imageToSave = {
        buffer: req.file.buffer,
        path: path.join(__dirname, "../s", filename),
        filename,
      };
    }

    // === Gọi model để thêm sản phẩm vào DB ===
    const result = await productModel.addProductDB(req.body);

    // === Nếu thêm thành công mới lưu ảnh chính + tải ảnh HTML ===
    if (result.success) {
      // ✅ Lưu ảnh chính
      if (imageToSave) {
        if (!fs.existsSync(imageToSave.path)) {
          fs.mkdirSync(path.dirname(imageToSave.path), { recursive: true });
          fs.writeFileSync(imageToSave.path, imageToSave.buffer);
          console.log("✅ Đã lưu ảnh chính:", imageToSave.filename);
        } else {
          console.log("⚠️ Ảnh chính đã tồn tại:", imageToSave.filename);
        }
      }

      // ✅ Tải ảnh từ HTML về local
      for (const { oldSrc, newSrc } of totalImageMap) {
        try {
          await downloadImage(oldSrc, newSrc);
          console.log(`✅ Đã tải ảnh: ${oldSrc} → ${newSrc}`);
        } catch (err) {
          console.error(`❌ Không tải được ảnh ${oldSrc}:`, err.message);
        }
      }
    }

    return result;

  } catch (error) {
    console.log("❌ Lỗi trong addProduct service:", error);
    return { success: false, message: "Lỗi khi thêm sản phẩm vào database", error };
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




