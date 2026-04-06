const express = require("express");
const router = express.Router();

const AdminRouter = require("./routes/account.routes");
const ProductRouter = require("./routes/product.routes");
const CategoryRouter = require("./routes/category.routes");
const BrandRouter = require("./routes/brand.routes");
const BatchRouter = require("./routes/batch.routes");
const CustomerRouter = require("./routes/customer.routes");

// Route gốc /api/admin: kiểm tra phiên admin + refresh token
router.use("", AdminRouter);
// /api/admin/products: quản lý sản phẩm (thêm/sửa/xóa/chi tiết)
router.use("/products", ProductRouter );
// /api/admin/categories: quản lý danh mục và danh mục con
router.use("/categories", CategoryRouter);
// /api/admin/brand: quản lý thương hiệu
router.use("/brand", BrandRouter);
// /api/admin/batches: quản lý lô hàng và sản phẩm trong lô
router.use("/batches", BatchRouter);
// /api/admin/customers: quản lý danh sách và chi tiết khách hàng
router.use("/customers", CustomerRouter);
module.exports = router;
