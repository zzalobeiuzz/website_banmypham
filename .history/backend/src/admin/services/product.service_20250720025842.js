const productModel = require("../models/product.model");
const path = require("path");
const fs = require("fs");
const {processHtmlWithPrefix} = require("../utils/processHtmlWithPrefix");
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
        detailid: product.DetailID,
        isHot: product.IsHot,
        type: product.Type,
        price: product.Price,
        categoryId: product.CategoryID,
        subcate
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
    // ===== Chuẩn hoá dữ liệu =====
    req.body.DetailID = req.body.DetailID || `DTL_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    req.body.Price = parseInt(req.body.Price) || 0;
    req.body.StockQuantity = parseInt(req.body.StockQuantity) || 0;
    req.body.IsHot = parseInt(req.body.IsHot) || 0;

    const now = new Date();
    req.body.CreatedAt = now;
    req.body.UpdatedAt = now;

    // ===== Xử lý ảnh trong các trường HTML =====
    const htmlFields = [
      { key: "Intro", prefix: "intro" },
      { key: "Usage", prefix: "usage" },
      { key: "Ingredients", prefix: "ingredients" },
      { key: "Instructions", prefix: "instructions" },
    ];

    const totalImageMap = [];
    for (const { key, prefix } of htmlFields) {
      if (req.body[key]) {
        const { html, imageMap } = processHtmlWithPrefix(req.body[key], prefix , key);
        req.body[key] = html;
        totalImageMap.push(...imageMap);
      }
    }

    // ===== Xử lý ảnh chính (nếu có) nhưng chưa lưu =====
    let imageToSave = null;
    
    if (req.file) {
      const rawName = path.basename(req.file.originalname, path.extname(req.file.originalname));
      const filename = `${rawName.replace(/\s+/g, "_")}.jpg`;
      req.body.Image = filename;

      const savePath = path.join(__dirname, "../../../uploads/assets/pictures", filename);
      imageToSave = {
        buffer: req.file.buffer,
        path: savePath,
        filename,
      };
    }

    // ===== Gọi DB thêm sản phẩm =====
    const result = await productModel.addProductDB(req.body);
    // ===== Nếu thêm thành công mới lưu ảnh =====
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

      // ✅ Tải ảnh HTML nếu có
      if (totalImageMap.length > 0) {
        for (const { oldSrc, newSrc } of totalImageMap) {
          const fullPath = path.join(__dirname, "../../../public", newSrc);
          if (fs.existsSync(fullPath)) {
            console.log(`⚠️ Ảnh đã tồn tại: ${newSrc}`);
            continue;
          }

          try {
            await downloadImage(oldSrc, newSrc);
            console.log(`✅ Đã tải ảnh: ${oldSrc} → ${newSrc}`);
          } catch (err) {
            console.error(`❌ Không tải được ảnh ${oldSrc}:`, err.message);
          }
        }
      } else {
        console.log("ℹ️ Không có ảnh HTML nào cần tải.");
      }
    }

    return result;

  } catch (error) {
    console.error("❌ Lỗi trong addProduct service:", error);
    return {
      success: false,
      message: "Lỗi khi thêm sản phẩm vào database",
      error,
    };
  }
};

//=========================LẤY CHI TIẾT SẢN PHẨM THEO ID====================
exports.getProductDetail = async (detailID) => {
  try {
    if(!detailID){
      console.log(`Không thấy mã mô tả sản phẩm`)
      return{
        success: false,
        message: `Không thấy mã mô tả sản phẩm`,
      }
    }
    const detail = await productModel.getProductDetailById(detailID);

    if (!detail) {
      console.log(`Không tìm thấy chi tiết sản phẩm với ID: ${productId}`)
      return {
        success: false,
        message: `Không tìm thấy chi tiết sản phẩm với ID: ${productId}`,
      };
    }
    
    return {
      success: true,
      detail: {
        detailId: detail.DetailID,
        usage: detail.Usage,
        ingredients: detail.Ingredients,
        instructions: detail.Instructions,
        otherInfo: detail.OtherInfo, // nếu có
      },
    };
  } catch (error) {
    console.error("❌ Lỗi khi lấy chi tiết sản phẩm:", error);
    return {
      success: false,
      message: "Lỗi server khi lấy chi tiết sản phẩm",
      error,
    };
  }
};
