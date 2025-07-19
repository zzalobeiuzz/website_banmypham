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

// ===================== ADD PRODUCT =====================
exports.addProduct = async (req, res) => {
  try {
    const result = await productService.addProduct(req);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message || "Thêm sản phẩm thành công",
        data: result,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || "Thêm sản phẩm thất bại",
      });
    }
  } catch (err) {
    console.log("❌ Error addProduct:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi thêm sản phẩm" });
  }
};


// ===================== SAVE EXTERNAL IMAGE =====================
const path = require("path");
const axios = require("axios");

exports.saveExternalImage = async (req, res) => {
  try {
    let imageUrls = req.body.imageUrls;
    console.log("imageUrls", imageUrls);

    if (typeof imageUrls === "string") {
      imageUrls = [imageUrls];
    }

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ message: "Thiếu danh sách URL ảnh" });
    }

    const newUrls = [];
    const uploadDir = path.join(__dirname, "../../../../backend/uploads/assets/pictures");
    fs.mkdirSync(uploadDir, { recursive: true });

    for (const imageUrl of imageUrls) {
      let fileName = "";
      let filePath = "";

      if (imageUrl.startsWith("data:image/")) {
        // 🟢 Base64
        const matches = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
          throw new Error("Base64 không hợp lệ");
        }
        const ext = "jpg";
        fileName = `image_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
        filePath = path.join(uploadDir, fileName);

        if (fs.existsSync(filePath)) {
          console.log("⚠️ Ảnh base64 đã tồn tại:", fileName);
          const newUrl = `http://localhost:5000/uploads/assets/pictures/${fileName}`;
          newUrls.push(newUrl);
          continue;
        }

        fs.writeFileSync(filePath, Buffer.from(matches[2], "base64"));
        console.log("✅ Lưu base64:", fileName);

      } else if (imageUrl.startsWith("http")) {
        // 🟢 URL
        const pathname = new URL(imageUrl).pathname;
        fileName = path.basename(pathname);
        filePath = path.join(uploadDir, fileName);

        if (fs.existsSync(filePath)) {
          console.log("⚠️ Ảnh URL đã tồn tại:", fileName);
          const newUrl = `http://localhost:5000/uploads/assets/pictures/${fileName}`;
          newUrls.push(newUrl);
          continue;
        }

        const response = await axios({
          method: "GET",
          url: imageUrl,
          responseType: "stream",
        });

        await new Promise((resolve, reject) => {
          const writer = fs.createWriteStream(filePath);
          response.data.pipe(writer);
          writer.on("finish", resolve);
          writer.on("error", (err) => {
            console.log("❌ Lỗi khi ghi file:", err);
            reject(err);
          });
        });
        console.log("✅ Lưu URL:", fileName);

      } else {
        console.warn("❌ Không hỗ trợ định dạng:", imageUrl);
        continue;
      }

      const newUrl = `http://localhost:5000/uploads/assets/pictures/${fileName}`;
      newUrls.push(newUrl);
    }

    console.log("👉 newUrls", newUrls);
    res.json({ success: true, newUrls });
    console.log("✅ Đã gửi response list ảnh về client");
  } catch (error) {
    console.error("❌ Lỗi saveExternalImage:", error);
    res.status(500).json({ success: false, message: "Lỗi tải ảnh external hoặc base64" });
  }
};



