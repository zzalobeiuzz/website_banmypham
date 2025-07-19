// Import các module cần thiết
const productService = require("../services/product.service"); // Gọi service xử lý logic sản phẩm
const path = require("path"); // Module xử lý đường dẫn
const fs = require("fs"); // Module thao tác với file hệ thống
const url = require("url"); // Module xử lý URL
const axios = require("axios"); // Thư viện gọi HTTP request

// ===================== CẬP NHẬT THÔNG TIN SẢN PHẨM =====================
exports.update = async (req, res) => {
  try {
    const products = req.body; // Nhận danh sách sản phẩm từ body

    // Kiểm tra dữ liệu phải là mảng
    if (!Array.isArray(products)) {
      return res.status(400).json({ message: "Dữ liệu phải là một mảng sản phẩm" });
    }

    // Cập nhật từng sản phẩm bằng service
    for (const product of products) {
      console.log("👉 Updating product:", product.ProductID);
      await productService.updateProduct(product);
    }

    // Trả kết quả thành công
    res.status(200).json({ success: true, message: "Cập nhật tất cả sản phẩm thành công!" });
  } catch (error) {
    console.error("❌ Lỗi update:", error.message);
    res.status(500).json({ message: "Có lỗi xảy ra khi cập nhật sản phẩm" });
  }
};

// ===================== KIỂM TRA SẢN PHẨM TỒN TẠI =====================
exports.checkExisProduct = async (req, res) => {
  const { code } = req.query;

  // Kiểm tra thiếu mã
  if (!code) {
    return res.status(400).json({ message: "Thiếu ID sản phẩm" });
  }

  try {
    // Gọi service kiểm tra sản phẩm
    const result = await productService.checkProductExistence(code);
    return res.json(result); // Trả kết quả
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ message: "Lỗi server khi kiểm tra sản phẩm" });
  }
};

// ===================== THÊM SẢN PHẨM MỚI =====================
exports.addProduct = async (req, res) => {
  try {
    if (req.file) {
      // Tạo tên file mới dựa theo originalname
      const ext = path.extname(req.file.originalname);
      const rawName = path.basename(req.file.originalname, ext);
      const filename = `${rawName.replace(/\s+/g, "_")}_${Date.now()}${ext}`;
      
      req.body.Image = filename; // Gửi tên này vào DB
    }

    // Gọi service thêm sản phẩm
    const result = await productService.addProduct(req);

    // Nếu thất bại thì không cần lưu file
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    // ✅ Nếu thành công, mới tiến hành lưu ảnh ra thư mục
    if (req.file) {
      const savePath = path.join(__dirname, "../uploads/assets/pictures", req.body.Image);

      // Đảm bảo thư mục tồn tại
      fs.mkdirSync(path.dirname(savePath), { recursive: true });

      fs.writeFileSync(savePath, req.file.buffer);
    }

    return res.status(200).json({
      success: true,
      message: "Thêm sản phẩm thành công",
    });

  } catch (err) {
    console.log("❌ Lỗi addProduct:", err);
    return res.status(500).json({ success: false, message: "Lỗi server khi thêm sản phẩm" });
  }
};

// ===================== LƯU ẢNH NGOÀI (BASE64 hoặc URL) =====================
exports.saveExternalImage = async (req, res) => {
  try {
    let imageUrls = req.body.imageUrls;
    console.log("imageUrls", imageUrls);

    // Nếu là string thì convert thành array
    if (typeof imageUrls === "string") {
      imageUrls = [imageUrls];
    }

    // Kiểm tra input hợp lệ
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ message: "Thiếu danh sách URL ảnh" });
    }

    const newUrls = []; // Danh sách URL sau khi lưu thành công
    const uploadDir = path.join(__dirname, "../../../../backend/uploads/assets/pictures"); // Đường dẫn thư mục upload
    fs.mkdirSync(uploadDir, { recursive: true }); // Tạo thư mục nếu chưa tồn tại

    // Duyệt từng ảnh để lưu
    for (const imageUrl of imageUrls) {
      let fileName = "";
      let filePath = "";

      if (imageUrl.startsWith("data:image/")) {
        // 🟢 Ảnh dạng base64
        const matches = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
          throw new Error("Base64 không hợp lệ");
        }

        const ext = "jpg"; // Mặc định jpg (có thể cải tiến để lấy đúng định dạng từ matches[1])
        fileName = `image_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
        filePath = path.join(uploadDir, fileName);

        // Nếu ảnh đã tồn tại thì bỏ qua và dùng lại URL
        if (fs.existsSync(filePath)) {
          console.log("⚠️ Ảnh base64 đã tồn tại:", fileName);
          const newUrl = `http://localhost:5000/uploads/assets/pictures/${fileName}`;
          newUrls.push(newUrl);
          continue;
        }

        // Ghi file từ base64
        fs.writeFileSync(filePath, Buffer.from(matches[2], "base64"));
        console.log("✅ Lưu base64:", fileName);

      } else if (imageUrl.startsWith("http")) {
        // 🟢 Ảnh từ URL
        const pathname = new URL(imageUrl).pathname;
        fileName = path.basename(pathname);
        filePath = path.join(uploadDir, fileName);

        // Nếu ảnh đã có sẵn thì bỏ qua
        if (fs.existsSync(filePath)) {
          console.log("⚠️ Ảnh URL đã tồn tại:", fileName);
          const newUrl = `http://localhost:5000/uploads/assets/pictures/${fileName}`;
          newUrls.push(newUrl);
          continue;
        }

        // Gọi request để tải ảnh
        const response = await axios({
          method: "GET",
          url: imageUrl,
          responseType: "stream", // Nhận dạng stream
        });

        // Lưu stream vào file
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

      // Thêm URL vào danh sách phản hồi
      const newUrl = `http://localhost:5000/uploads/assets/pictures/${fileName}`;
      newUrls.push(newUrl);
    }

    // Gửi danh sách URL mới về client
    res.json({ success: true, newUrls });
    console.log("✅ Đã gửi response list ảnh về client");

  } catch (error) {
    console.error("❌ Lỗi saveExternalImage:", error);
    res.status(500).json({ success: false, message: "Lỗi tải ảnh external hoặc base64" });
  }
};
