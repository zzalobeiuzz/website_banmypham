// controllers/product.controller.js
const {
  getAllCategories,
  getSaleProducts,
  getHotProducts,
  getNewArrivalProducts,
  getBeautyTrendProducts,
  getFeaturedBrands,
  getAllProducts,
  getProductDetailById,
  getBrandDetailPage,
} = require("../services/product.service");
const adminBrandModel = require("../../admin/brand/brand.model");

//============================ Gửi danh sách sản phẩm khuyến mãi=============================
exports.getSaleProductsHandler = async (req, res) => {
  try {
    const products = await getSaleProducts();
    res.status(200).json(products);
    console.log("Lấy thành công danh sách sản phẩm sale");
    console.log("======================================");
  } catch (err) {
    console.error("❌ Lỗi khi lấy sale products:", err.message); // <-- in thông báo lỗi
    console.error("❌ Stack trace:", err.stack); // <-- in vết lỗi đầy đủ
    res
      .status(500)
      .json({ message: "Lỗi server khi lấy sản phẩm khuyến mãi." });
  }
};

//============================= Gửi danh sách sản phẩm hot =============================
exports.getHotProductsHandler = async (req, res) => {
  try {
    const product = await getHotProducts();

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
    }

    res.status(200).json(product);
    console.log("Lấy thành công danh sách sản phẩm hot");
    console.log("======================================");
  } catch (err) {
    console.error("Lỗi khi truy vấn sản phẩm theo ID:", err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

//============================= Gui danh sach san pham cua 3 lo hang moi nhat =============================
exports.getNewArrivalProductsHandler = async (req, res) => {
  try {
    const products = await getNewArrivalProducts();
    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy sản phẩm hàng mới về:", err.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy sản phẩm hàng mới về.",
    });
  }
};

//============================= Gui san pham xu huong theo so luong ban ra =============================
exports.getBeautyTrendProductsHandler = async (req, res) => {
  try {
    const products = await getBeautyTrendProducts();
    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy sản phẩm xu hướng:", err.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy sản phẩm xu hướng.",
    });
  }
};

//============================= Gửi danh sách thương hiệu nổi bật =============================
exports.getFeaturedBrandsHandler = async (req, res) => {
  try {
    const brands = await getFeaturedBrands();
    res.status(200).json(brands);
    console.log("Lấy thành công danh sách thương hiệu nổi bật");
    console.log("======================================");
  } catch (err) {
    console.error("❌ Lỗi khi lấy thương hiệu nổi bật:", err.message);
    res.status(500).json({ message: "Lỗi server khi lấy thương hiệu nổi bật." });
  }
};
// Handler để trả về toàn bộ danh sách category
exports.getCategoryHandler = async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.status(200).json({
      data: categories,
      success: true,
    });
    console.log("Lấy thành công danh sách Categoty");
    console.log("======================================");
  } catch (error) {
    console.error("❌ Lỗi khi lấy categories:", error);
    res.status(500).json({
      success: false,
      message: "Lấy danh sách category thất bại!",
    });
  }
};
// ============================= Gửi danh sách tất cả sản phẩm =============================
exports.getProductsHandler = async (req, res) => {
  try {
    const products = await getAllProducts();
    
    res.status(200).json({
      data: products,
      success: true,
    });
    console.log("Lấy thành công danh sách tất cả sản phẩm");
    console.log("======================================");
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách sản phẩm:", err.message);
    console.error("❌ Stack trace:", err.stack);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách sản phẩm.",
    });
  }
};

// ============================= Lấy chi tiết sản phẩm theo ProductID =============================
exports.getProductDetailHandler = async (req, res) => {
  try {
    console.log(req.data)
    const { id } = req.params;
    const result = await getProductDetailById(id);

    if (!result?.success || !result?.data) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm.",
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi khi lấy chi tiết sản phẩm:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết sản phẩm.",
    });
  }
};

// ============================= Lấy dữ liệu trang chi tiết thương hiệu =============================
exports.getBrandDetailPageHandler = async (req, res) => {
  try {
    const { idBrand } = req.params;
    const result = await getBrandDetailPage(idBrand);

    if (!result?.success) {
      return res.status(404).json({
        success: false,
        message: result?.message || "Không tìm thấy thương hiệu.",
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi khi lấy trang chi tiết thương hiệu:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy trang chi tiết thương hiệu.",
    });
  }
};

//================================= Lấy thông tin sản phẩm có trong giỏ hàng =================================
exports.getCartProductsHandler = async (req, res) => {
  try {
    const { ids } = req.body;

    // ❌ Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách sản phẩm không hợp lệ.",
      });
    }

    // 👉 gọi service (bạn tự có hoặc mình gợi ý dưới)
    const result = await getProductDetailById(ids);

    if (!result?.success || !result?.data) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm.",
      });
    }

    // 🔥 Giữ đúng thứ tự theo cart (quan trọng)
    const sortedProducts = ids
      .map((id) =>
        result.data.find(
          (p) => String(p.ProductID) === String(id)
        )
      )
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      data: sortedProducts,
    });

  } catch (error) {
    console.error("❌ Lỗi khi lấy sản phẩm giỏ hàng:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy sản phẩm giỏ hàng.",
    });
  }
};

//============================= Gửi danh sách toàn bộ thương hiệu (public) =============================
exports.getAllBrandsHandler = async (req, res) => {
  try {
    const brands = await adminBrandModel.getAllBrands();
    res.status(200).json(brands);
    console.log("Lấy thành công danh sách tất cả thương hiệu (public)");
  } catch (err) {
    console.error("❌ Lỗi khi lấy toàn bộ thương hiệu:", err.message);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách thương hiệu." });
  }
};
