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
    // Gọi service để xử lý toàn bộ logic thêm sản phẩm, bao gồm ảnh
    const result = await productService.addProduct(req);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      message: "Thêm sản phẩm thành công",
    });
  } catch (err) {
    console.error("❌ Lỗi addProduct:", err);
    return res.status(500).json({ success: false, message: "Lỗi server khi thêm sản phẩm" });
  }
};
