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
    console.log("result", result);
    res.status(201).json({ success: true, message: "Thêm sản phẩm thành công!", data: result });
  } catch (err) {
    console.log("❌ Error addProduct:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi thêm sản phẩm" });
  }
};

// ===================== SAVE EXTERNAL IMAGE =====================
exports.saveExternalImage = async (req, res) => {
  try {
    console.log("👉 req.body:", req.body);

    let imageUrls = req.body.imageUrls;

    if (typeof imageUrls === "string") {
      imageUrls = [imageUrls];
    }

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ message: "Thiếu danh sách URL ảnh" });
    }

    const newUrls = [];
    const uploadDir = path.join(__dirname, "../../../../frontend/public/assets/pictures");
    fs.mkdirSync(uploadDir, { recursive: true });

    for (const imageUrl of imageUrls) {
      if (imageUrl.startsWith("data:image/")) {
        // 🟢 Handle base64
        const matches = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
          throw new Error("Base64 không hợp lệ");
        }
        // const ext = matches[1]; // 👉 Nếu muốn giữ đuôi gốc, dùng dòng này
        const ext = "png"; // 👉 Nếu muốn ép về png
      
        const base64Data = matches[2];
        const fileName = `image_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
        const filePath = path.join(uploadDir, fileName);
      
        fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
      
        const newUrl = `http://localhost:5000/assets/pictures/${fileName}`;
        newUrls.push(newUrl);
      } else if (imageUrl.startsWith("http")) {
        // 🟢 Handle URL
        const pathname = new URL(imageUrl).pathname;
        const fileName = path.basename(pathname);
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

        const newUrl = `http://localhost:5000/assets/pictures/${fileName}`;
        newUrls.push(newUrl);
      } else {
        console.warn("❌ Không hỗ trợ định dạng:", imageUrl);
      }
    }

    res.json({ success: true, newUrls });
  } catch (error) {
    console.error("❌ Lỗi saveExternalImage:", error);
    res.status(500).json({ success: false, message: "Lỗi tải ảnh external hoặc base64" });
  }
};


