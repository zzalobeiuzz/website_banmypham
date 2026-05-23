const express = require("express");
const router = express.Router();

const AdminRouter = require("./account/account.routes");
const ProductRouter = require("./product/product.routes");
const CategoryRouter = require("./category/category.routes");
const BrandRouter = require("./brand/brand.routes");
const BatchRouter = require("./batch/batch.routes");
const CustomerRouter = require("./customer/customer.routes");
const OrderRouter = require("./order/order.routes");

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
// /api/admin/orders: quản lý đơn hàng từ BILL/BILL_DETAIL
router.use("/orders", OrderRouter);
module.exports = router;
