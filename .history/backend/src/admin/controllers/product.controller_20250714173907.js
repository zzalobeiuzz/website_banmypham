// const productService = require("../services/product.service");
// const path = require("path");
// const fs = require("fs");
// //=========================UPDATE THÔNG TIN SẢN PHẨM====================
// exports.update = async (req, res) => {
//   try {
//     const products = req.body;

//     // Kiểm tra luôn: phải là mảng
//     if (!Array.isArray(products)) {
//       return res
//         .status(400)
//         .json({ message: "Dữ liệu phải là một mảng sản phẩm" });
//     }

//     for (const product of products) {
//       console.log("👉 Updating product:", product.ProductID);

//       await productService.updateProduct(product);
//     }

//     res
//       .status(200)
//       .json({ success: true, message: "Cập nhật tất cả sản phẩm thành công!" });
//   } catch (error) {
//     console.error("❌ Lỗi update:", error.message);
//     res.status(500).json({ message: "Có lỗi xảy ra khi cập nhật sản phẩm" });
//   }
// };
// //=========================CHECK SẢN PHẨM TỒN TẠI====================
// exports.checkExisProduct = async (req, res) => {
//   const { code } = req.query;

//   if (!code) {
//     return res.status(400).json({ message: "Thiếu ID sản phẩm" });
//   }

//   try {
//     const result = await productService.checkProductExistence(code);
//     return res.json(result);
//   } catch (error) {
//     console.error("Controller Error:", error);
//     res.status(500).json({ message: "Lỗi server khi kiểm tra sản phẩm" });
//   }
// };

// // ==========================upload ảnh preview từ editor=================
// // 💥 Controller upload ảnh preview (cho ReactQuill)
// exports.uploadPreviewImage = async (req, res) => {
//   try {
//     if (!req.files || !req.files.image) {
//       return res.status(400).json({ message: "No image uploaded" });
//     }

//     const image = req.files.image;

//     // 💥 Đường dẫn thư mục
//     const uploadDir = path.join(__dirname, "../../uploads");

//     // ✅ Tạo nếu chưa tồn tại
//     fs.mkdirSync(uploadDir, { recursive: true });

//     const fileName = Date.now() + "_" + image.name;
//     const uploadPath = path.join(uploadDir, fileName);

//     // ✅ Lưu file
//     await image.mv(uploadPath);

//     // ✅ URL trả về cho FE (em sửa nếu FE chạy cổng khác)
//     const url = `http://localhost:5000/uploads/${fileName}`;

//     res.json({ url });
//   } catch (error) {
//     console.error("Upload error: ", error);
//     res.status(500).json({ message: "Upload failed", error });
//   }
// };


// exports.addProduct = async (req, res) => {
//   try {
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
//     } = req.body;

//     // Xử lý ảnh
//     let imagePath = "";
//     if (req.file) {
//       imagePath = `/assets/pictures/${req.file.filename}`;
//     }

//     // Gửi sang service
//     const product = {
//       ProductCode,
//       Name,
//       Price: parseInt(Price) || 0,
//       Type,
//       CategoryID,
//       SubCategoryID,
//       StockQuantity: parseInt(StockQuantity) || 0,
//       SupplierID,
//       IsHot: parseInt(IsHot) || 0,
//       Intro,
//       Usage,
//       Ingredients,
//       Instructions,
//       Image: imagePath,
//     };

//     await productService.addProduct(product);

//     res.status(201).json({
//       success: true,
//       message: "Thêm sản phẩm thành công!",
//     });
//   } catch (err) {
//     console.error("❌ Error addProduct:", err);
//     res.status(500).json({
//       success: false,
//       message: "Lỗi server khi thêm sản phẩm",
//     });
//   }
// };


const productService = require("../services/product.service");
const path = require("path");
const fs = require("fs");
const url = require("url");
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

    const url = `http://localhost:5000/uploads/${fileName}`;
    res.json({ url });
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
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: "Thiếu URL ảnh" });
    }

    // Lấy extension (đuôi)
    const extension = path.extname(imageUrl).split("?")[0] || ".jpg";

    // Tên file random
    const fileName = uuidv4() + extension;

    // Thư mục uploads
    const uploadDir = path.join(__dirname, "../../uploads");
    fs.mkdirSync(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);

    // Tải ảnh từ URL
    const response = await axios({
      method: "GET",
      url: imageUrl,
      responseType: "stream",
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on("finish", () => {
      const newUrl = `http://localhost:5000/uploads/${fileName}`;
      res.json({ success: true, newUrl });
    });

    writer.on("error", (err) => {
      console.error("❌ Lỗi ghi file:", err);
      res.status(500).json({ success: false, message: "Lỗi ghi file" });
    });
  } catch (error) {
    console.error("❌ Lỗi saveExternalImage:", error);
    res.status(500).json({ success: false, message: "Lỗi tải ảnh external" });
  }
};
