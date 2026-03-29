const productModel = require("../models/product.model");
const path = require("path");
const fs = require("fs");
const {processHtmlWithPrefix} = require("../utils/processHtmlWithPrefix");
const { downloadImage } = require("../utils/imageDownloader");
//=========================UPDATE THÔNG TIN SẢN PHẨM====================
exports.updateProduct = async (product) => {
  console.log("productID:", product.ProductID);
  const exists = await productModel.checkProductExists(product.ProductID);

  if (!exists) {
    throw new Error(`Sản phẩm ID ${product.ProductID} không tồn tại`);
  }

  return await productModel.updateProduct(product);
};
//=========================CHECK SẢN PHẨM TỒN TẠI====================
exports.checkProductExistence = async (payload) => {
  try {
    await productModel.syncExpiredBatchDetailsStatus();

    const barcode = typeof payload === "string" ? payload.trim() : (payload?.barcode || "").trim();
    const productId = typeof payload === "object" ? (payload?.productId || "").trim() : "";

    const productById = productId ? await productModel.checkProductExists(productId) : null;
    const productByBarcode = barcode ? await productModel.checkProductExistsByBarcode(barcode) : null;

    const barcodeExists = !!productByBarcode;
    const isBarcodeConflictWithOtherProduct = !!(
      barcodeExists
      && productById
      && productById.ProductID
      && productByBarcode.ProductID
      && String(productById.ProductID) !== String(productByBarcode.ProductID)
    );

    // Khi đã nhập ProductID hợp lệ thì luôn ưu tiên hiển thị đúng sản phẩm đó.
    const product = productById || productByBarcode;

    if (!product) {
      return {
        exists: false,
        barcodeExists,
        barcodeConflict: isBarcodeConflictWithOtherProduct,
      };
    }

    const isVisible = !(product.IsHidden === true || product.IsHidden === 1);
    const batchDetailsRaw = await productModel.getBatchDetailsByProductId(product.ProductID);
    const batchDetails = Array.isArray(batchDetailsRaw)
      ? batchDetailsRaw.map((batch) => ({
        batchId: batch.batchId,
        barcode: String(batch.barcode || "").trim(),
        quantity: Number(batch.quantity || 0),
        createdAt: batch.createdAt || null,
        expiryDate: batch.expiryDate || null,
      }))
      : [];
    const firstBatchBarcode =
      batchDetails.find((batch) => String(batch.barcode || "").trim())?.barcode || "";
    const resolvedBarcode = String(
      productByBarcode?.MatchedBatchBarcode
      || product.Barcode
      || product.BarCode
      || product.Code
      || firstBatchBarcode
      || "",
    ).trim();
    const totalBatchQuantity = batchDetails.reduce(
      (sum, batch) => sum + Number(batch.quantity || 0),
      0,
    );

    return {
      exists: true,
      reactivated: false,
      isVisible,
      barcodeExists,
      barcodeConflict: isBarcodeConflictWithOtherProduct,
      barcodeOwnerProductId: productByBarcode?.ProductID || null,
      product: {
        id: product.ProductID,
        barcode: resolvedBarcode,
        name: product.ProductName,
        detailid: product.DetailID,
        isHot: product.IsHot,
        type: product.Type,
        price: product.Price,
        categoryId: product.CategoryID,
        subcategoryId: product.SubCategoryID,
        stockQuantity: totalBatchQuantity,
        totalBatchQuantity,
        createdAt: product.CreatedAt,
        updatedAt: product.UpdatedAt,
        supplierId: product.SupplierID,
        image: product.Image,
        batchDetails,

        // ✅ Thông tin chi tiết nếu có
        detail: product.DetailID ? {
          detailId: product.DetailID,
          intro: product.ProductDescription || "",
          usage: product.Usage || "",
          ingredients: product.Ingredient || "",
          instructions: product.HowToUse || "",
        } : null,

        // ✅ Thông tin danh mục phụ nếu có
        subCategory: product.SubCategoryID ? {
          id: product.SubCategoryID,
          name: product.SubCategoryName || "",
          categoryId: product.SubCategory_CategoryID || null,
        } : null
      }
    };
  } catch (error) {
    console.error("❌ Lỗi checkProductExistence:", error.message);
    throw error; // hoặc return { exists: false, error: error.message }
  }
};

//========================= THÊM SẢN PHẨM ====================
exports.addProduct = async (req) => {
  try {
    const isUpdateAfterScan = req.body.IsUpdateAfterScan === "1" || req.body.IsUpdateAfterScan === 1;
    let batchDetails = [];

    if (req.body.BatchDetails) {
      try {
        const parsed = JSON.parse(req.body.BatchDetails);
        batchDetails = Array.isArray(parsed) ? parsed : [];
      } catch (parseError) {
        console.warn("⚠️ BatchDetails không đúng định dạng JSON:", parseError.message);
      }
    }

    // ===== Chuẩn hoá dữ liệu =====
    req.body.DetailID = req.body.DetailID || `DTL_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    req.body.Price = parseInt(req.body.Price) || 0;
    req.body.IsHot = parseInt(req.body.IsHot) || 0;
    req.body.IsHidden =  0;
    req.body.BatchID = String(req.body.BatchID || "").trim();

    const now = new Date();
    req.body.CreatedAt = now;
    req.body.UpdatedAt = now;
    req.body.BatchDetails = batchDetails;

    const normalizedProductId = String(req.body.ProductID || "").trim();
    const normalizedBarcode = String(req.body.Barcode || "").trim();

    if (normalizedBarcode) {
      const barcodeOwner = await productModel.checkProductExistsByBarcode(normalizedBarcode);
      const ownerProductId = String(barcodeOwner?.ProductID || "").trim();

      if (ownerProductId && ownerProductId !== normalizedProductId) {
        return {
          success: false,
          message: "Barcode đã tồn tại ở sản phẩm khác. Barcode phải là duy nhất.",
        };
      }
    }

    // ===== Xử lý ảnh trong các trường HTML =====
    const htmlFields = [
      { key: "ProductDescription", prefix: "productdescription" },
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
    } else if (
      req.body.Image === "null" ||
      req.body.Image === "undefined" ||
      req.body.Image === ""
    ) {
      delete req.body.Image;
    }

    // ===== Gọi DB: nếu quét trúng sản phẩm cũ thì update, ngược lại thêm mới =====
    const result = isUpdateAfterScan
      ? await productModel.updateProductFromAddFormDB(req.body)
      : await productModel.addProductDB(req.body);
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
          const relativePath = newSrc.replace("http://localhost:5000", "");
          const fullPath = path.join(__dirname, "../../../public", relativePath);
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
    await productModel.syncExpiredBatchDetailsStatus();

    console.log("🔍 Tìm chi tiết sản phẩm với DetailID:", detailID);
    if(!detailID){
      console.log(`Không thấy mã mô tả sản phẩm`)
      return{
        success: false,
        message: `Không thấy mã mô tả sản phẩm`,
      }
    }
    const product = await productModel.checkProductExists(detailID);
    if (!product) {
      console.log(`Không tìm thấy chi tiết sản phẩm với ID: ${detailID}`)
      return {
        success: false,
        message: `Không tìm thấy chi tiết sản phẩm với ID: ${detailID}`,
      };
    }

    const batchDetails = await productModel.getBatchDetailsByProductId(product.ProductID);

    return {
      success: true,
      detail: {
        ...product,
        batchDetails,
      },
      message: `Tải sản phẩm thành công`,
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

exports.updateProductDetailWithBatches = async (payload) => {
  try {
    if (payload && payload.Price !== undefined) {
      payload.Price = Number(payload.Price);
    }

    const result = await productModel.updateProductDetailAndBatches(payload);
    await productModel.syncExpiredBatchDetailsStatus();
    return result;
  } catch (error) {
    console.error("❌ Lỗi updateProductDetailWithBatches:", error.message);
    return {
      success: false,
      message: "Không thể cập nhật chi tiết sản phẩm",
      error: error.message,
    };
  }
};

//========================= ẨN SẢN PHẨM (XÓA MỀM) ====================
exports.hideProducts = async (productIds) => {
  const validIds = (Array.isArray(productIds) ? productIds : [])
    .map((id) => String(id || "").trim())
    .filter(Boolean);

  if (validIds.length === 0) {
    return { success: false, message: "Không có sản phẩm hợp lệ để ẩn" };
  }

  return await productModel.hideProductsByIds(validIds);
};
