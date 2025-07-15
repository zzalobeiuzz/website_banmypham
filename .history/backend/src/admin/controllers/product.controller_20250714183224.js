const productService = require("../services/product.service");
const path = require("path");
const fs = require("fs");
const url = require("url");
const axios = require("axios");

// ===================== UPDATE THÔNG TIN SẢN PHẨM =====================
exports.update = async (req, res) => {
  try {
    const products = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({ message: "Dữ liệu phải là một mảng sản phẩm" });
    }

    for (const product of products) {
      console.log("👉 Updating product:", product.ProductID);
      await productService.updateProduct(product);
    }

    res.status(200).json({ success: true, message: "Cập nhật tất cả sản phẩm thành công!" });
  } catch (error) {
    console.error("❌ Lỗi update:", error.message);
    res.status(500).json({ message: "Có lỗi xảy ra khi cập nhật sản phẩm" });
  }
};

// ===================== CHECK SẢN PHẨM TỒN TẠI =====================
exports.checkExisProduct = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ message: "Thiếu ID sản phẩm" });
  }

  try {
    const result = await productService.checkProductExistence(code);
    return res.json(result);
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ message: "Lỗi server khi kiểm tra sản phẩm" });
  }
};

// ===================== UPLOAD ẢNH PREVIEW (ReactQuill) =====================
exports.uploadPreviewImage = async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const image = req.files.image;
    const uploadDir = path.join(__dirname, "../../uploads");
    fs.mkdirSync(uploadDir, { recursive: true });

    const fileName = Date.now() + "_" + image.name;
    const uploadPath = path.join(uploadDir, fileName);

    await image.mv(uploadPath);

    const newUrl = `http://localhost:5000/uploads/${fileName}`;
    res.json({ url: newUrl });
  } catch (error) {
    console.error("Upload error: ", error);
    res.status(500).json({ message: "Upload failed", error });
  }
};

// ===================== ADD PRODUCT =====================
exports.addProduct = async (req, res) => {
  try {
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
    } = req.body;

    let imagePath = "";
    if (req.file) {
      imagePath = `/assets/pictures/${req.file.filename}`;
    }

    const product = {
      ProductCode,
      Name,
      Price: parseInt(Price) || 0,
      Type,
      CategoryID,
      SubCategoryID,
      StockQuantity: parseInt(StockQuantity) || 0,
      SupplierID,
      IsHot: parseInt(IsHot) || 0,
      Intro,
      Usage,
      Ingredients,
      Instructions,
      Image: imagePath,
    };

    await productService.addProduct(product);

    res.status(201).json({ success: true, message: "Thêm sản phẩm thành công!" });
  } catch (err) {
    console.error("❌ Error addProduct:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi thêm sản phẩm" });
  }
};

// ===================== SAVE EXTERNAL IMAGE =====================
exports.saveExternalImage = async (req, res) => {
  try {
    console.log("👉 req.body:", req.body);

    const imageUrls = JSON.parse(req.body.imageUrls || "[]");
    console.log("👉 imageUrls:", imageUrls);

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ message: "Thiếu danh sách URL ảnh" });
    }

    const newUrls = [];

    for (const imageUrl of imageUrls) {
      const pathname = url.parse(imageUrl).pathname;
      const fileName = path.basename(pathname);

      const uploadDir = path.join(__dirname, "../../uploads");
      fs.mkdirSync(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, fileName);

      const response = await axios({
        method: "GET",
        url: imageUrl,
        responseType: "stream",
      });

      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      const newUrl = `http://localhost:5000/uploads/${fileName}`;
      newUrls.push(newUrl);
    }

    res.json({ success: true, newUrls });
  } catch (error) {
    console.error("❌ Lỗi saveExternalImage:", error);
    res.status(500).json({ success: false, message: "Lỗi tải ảnh external" });
  }
};
