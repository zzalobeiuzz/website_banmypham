const productService = require("../services/product.service");
const path = require("path");
const fs = require("fs");
//=========================UPDATE THÔNG TIN SẢN PHẨM====================
exports.update = async (req, res) => {
  try {
    const products = req.body;

    // Kiểm tra luôn: phải là mảng
    if (!Array.isArray(products)) {
      return res
        .status(400)
        .json({ message: "Dữ liệu phải là một mảng sản phẩm" });
    }

    for (const product of products) {
      console.log("👉 Updating product:", product.ProductID);

      await productService.updateProduct(product);
    }

    res
      .status(200)
      .json({ success: true, message: "Cập nhật tất cả sản phẩm thành công!" });
  } catch (error) {
    console.error("❌ Lỗi update:", error.message);
    res.status(500).json({ message: "Có lỗi xảy ra khi cập nhật sản phẩm" });
  }
};
//=========================CHECK SẢN PHẨM TỒN TẠI====================
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

// ==========================upload ảnh preview từ editor=================
// 💥 Controller upload ảnh preview (cho ReactQuill)





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

    // Nếu có file ảnh
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`; // Đường dẫn ảnh
    }

    const productData = {
      productCode: ProductCode,
      name: Name,
      price: Price,
      type: Type,
      categoryId: CategoryID,
      subCategoryId: SubCategoryID,
      stockQuantity: StockQuantity,
      supplierID: SupplierID,
      isHot: IsHot,
      intro: Intro,
      usage: Usage,
      ingredients: Ingredients,
      instructions: Instructions,
      image: imageUrl,
    };

    await productService.createProduct(productData);

    res.status(201).json({ message: "Thêm sản phẩm thành công!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Thêm sản phẩm thất bại!", error: err.message });
  }
};