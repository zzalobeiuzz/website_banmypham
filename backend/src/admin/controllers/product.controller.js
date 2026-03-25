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

    // 🧠 1. Pre-validation: kiểm tra tất cả sản phẩm trước khi update
    const validationErrors = [];
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      if (!product.ProductID || (typeof product.ProductID === 'string' && !product.ProductID.trim())) {
        validationErrors.push(`Sản phẩm thứ ${i + 1} thiếu ProductID`);
      }
    }

    // Nếu có lỗi validation, dừng ngay không update cái nào
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Có sản phẩm không hợp lệ, không thể cập nhật",
        errors: validationErrors,
      });
    }

    // ✅ 2. Nếu tất cả hợp lệ, mới cập nhật từng sản phẩm
    for (const product of products) {
      await productService.updateProduct(product);
    }

    // Trả kết quả thành công
    res.status(200).json({ success: true, message: "Cập nhật tất cả sản phẩm thành công!" });
  } catch (error) {
    console.error("❌ Lỗi update:", error.message);
    res.status(500).json({ success: false, message: "Có lỗi xảy ra khi cập nhật sản phẩm" });
  }
};

// ===================== KIỂM TRA SẢN PHẨM TỒN TẠI =====================
exports.checkExisProduct = async (req, res) => {
  const barcode = (req.query.barcode || req.query.code || "").trim();
  const productId = (req.query.productId || "").trim();

  // Kiểm tra thiếu cả 2 mã
  if (!barcode && !productId) {
    return res.status(400).json({ message: "Thiếu barcode hoặc mã sản phẩm" });
  }

  try {
    // Gọi service kiểm tra sản phẩm
    const result = await productService.checkProductExistence({ barcode, productId });
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
      message: result.message || "Lưu sản phẩm thành công",
    });
  } catch (err) {
    console.error("❌ Lỗi addProduct:", err);
    return res.status(500).json({ success: false, message: "Lỗi server khi thêm sản phẩm" });
  }
};

//=======================LẤY THÔNG TIN SẢN PHẨM ĐỂ HIỂN THỊ CHI TIẾT==============================
exports.handleProductDetail = async (req, res) => {
  try {

    const { code } = req.query;
    // 🟢 Bước 1: Lấy thông tin sản phẩm chính
    const result = await productService.getProductDetail(code);
    // ⚠️ Nếu không tồn tại hoặc không có product
    if (!result || !result.detail) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    }
    // ✅ Trả về dữ liệu tổng hợp (đã có detail và subCategory nếu có)
    return res.status(200).json({
      success: true,
      data: result.detail,
      message: result.message
    });
  } catch (error) {
    console.error("❌ Lỗi khi xử lý handleProductDetail:", error.message);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ===================== ẨN SẢN PHẨM (XÓA MỀM) =====================
exports.deleteProducts = async (req, res) => {
  try {
    const productIds = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách sản phẩm cần xóa không hợp lệ",
      });
    }

    const result = await productService.hideProducts(productIds);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || "Không thể ẩn sản phẩm",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Đã ẩn ${result.affectedRows || 0} sản phẩm`,
    });
  } catch (error) {
    console.error("❌ Lỗi deleteProducts:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa mềm sản phẩm",
    });
  }
};
