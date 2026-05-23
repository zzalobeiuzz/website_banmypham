const {
  updateProduct,
  checkProductExistence,
  addProduct: addProductService,
  getProductDetail,
  updateProductDetailWithBatches,
  hideProducts,
} = require("./product.service"); // Gọi service xử lý logic sản phẩm
const path = require("path"); // Module xử lý đường dẫn
const fs = require("fs"); // Module thao tác với file hệ thống
const url = require("url"); // Module xử lý URL
const axios = require("axios"); // Thư viện gọi HTTP request

// ===================== CẬP NHẬT THÔNG TIN SẢN PHẨM =====================
async function update(req, res) {
  try {
    const products = req.body; // Nhận danh sách sản phẩm từ body

    if (!Array.isArray(products)) {
      return res.status(400).json({ message: "Dữ liệu phải là một mảng sản phẩm" });
    }

    const validationErrors = [];
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      if (!product.ProductID || (typeof product.ProductID === 'string' && !product.ProductID.trim())) {
        validationErrors.push(`Sản phẩm thứ ${i + 1} thiếu ProductID`);
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Có sản phẩm không hợp lệ, không thể cập nhật",
        errors: validationErrors,
      });
    }

    for (const product of products) {
      await updateProduct(product);
    }

    res.status(200).json({ success: true, message: "Cập nhật tất cả sản phẩm thành công!" });
  } catch (error) {
    console.error("❌ Lỗi update:", error.message);
    res.status(500).json({ success: false, message: "Có lỗi xảy ra khi cập nhật sản phẩm" });
  }
}

// ===================== KIỂM TRA SẢN PHẨM TỒN TẠI =====================
async function checkExisProduct(req, res) {
  const barcode = (req.query.barcode || req.query.code || "").trim();
  const productId = (req.query.productId || "").trim();

  if (!barcode && !productId) {
    return res.status(400).json({ message: "Thiếu barcode hoặc mã sản phẩm" });
  }

  try {
    const result = await checkProductExistence({ barcode, productId });
    return res.json(result);
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ message: "Lỗi server khi kiểm tra sản phẩm" });
  }
}

// ===================== THÊM SẢN PHẨM MỚI =====================
async function addProduct(req, res) {
  try {
    const result = await addProductService(req);

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
}

//=======================LẤY THÔNG TIN SẢN PHẨM ĐỂ HIỂN THỊ CHI TIẾT==============================
async function handleProductDetail(req, res) {
  try {
    const { code } = req.query;
    const result = await getProductDetail(code);
    if (!result || !result.detail) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    }
    return res.status(200).json({
      success: true,
      data: result.detail,
      message: result.message
    });
  } catch (error) {
    console.error("❌ Lỗi khi xử lý handleProductDetail:", error.message);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
}

//=======================CẬP NHẬT CHI TIẾT SẢN PHẨM + LÔ HÀNG==============================
async function updateProductDetail(req, res) {
  try {
    const payload = req.body || {};
    if (!payload.ProductID) {
      return res.status(400).json({
        success: false,
        message: "Thiếu ProductID",
      });
    }

    const result = await updateProductDetailWithBatches(payload);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi updateProductDetail:", error.message);
    return res.status(500).json({ success: false, message: "Lỗi server khi cập nhật chi tiết sản phẩm" });
  }
}

// ===================== ẨN SẢN PHẨM (XÓA MỀM) =====================
async function deleteProducts(req, res) {
  try {
    const productIds = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách sản phẩm cần xóa không hợp lệ",
      });
    }

    const result = await hideProducts(productIds);

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
}

module.exports = {
  update,
  checkExisProduct,
  addProduct,
  handleProductDetail,
  updateProductDetail,
  deleteProducts,
};
