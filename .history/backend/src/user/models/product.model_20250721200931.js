const { connectDB } = require("../../config/connect");

//===============TRUY VẤN SẢN PHẨM SALE===============
exports.findSaleProducts = async () => {
  const pool = await connectDB();
  const result = await pool.request().query(`
    SELECT 
      P.ProductName,
      P.SupplierID,
      P.Price,
      P.Image,
      PS.sale_price,
      PS.start_date,
      PS.end_date
    FROM PRODUCT_SALE PS
    JOIN PRODUCT P ON PS.product_id = P.ProductID;
  `);
  return result.recordset;
};

//===============TRUY VẤN SẢN PHẨM HOT===============
exports.findHotProducts = async () => {
  const pool = await connectDB();
  const result = await pool.request().query(`
    SELECT 
    P.ProductID,         -- Lấy mã sản phẩm từ bảng PRODUCT
    P.ProductName,       -- Lấy tên sản phẩm
    P.SupplierID,        -- Lấy mã nhà cung cấp
    P.Price,             -- Lấy giá gốc sản phẩm
    P.Image,             -- Lấy ảnh sản phẩm
    P.isHot,             -- Lấy trạng thái "hot" (1 = sản phẩm hot)
    PS.sale_price        -- Lấy giá khuyến mãi từ bảng PRODUCT_SALE nếu 
    FROM PRODUCT P
    LEFT JOIN PRODUCT_SALE PS ON P.ProductID = PS.product_id
    WHERE P.isHot = 1;
  `);
  return result.recordset;
};
// ===============TRUY VẤN DANH MỤC SẢN PHẨM===============
exports.findCategories = async () => {
  try {
    const pool = await connectDB();

    // Lấy tất cả category
    const categoryResult = await pool.request().query("SELECT * FROM Category");

    // Lấy tất cả sub-category
    const subCategoryResult = await pool
      .request()
      .query("SELECT * FROM SUB_CATEGORY");

    const categories = categoryResult.recordset.map((category) => {
      const subCategories = subCategoryResult.recordset.filter(
        (sub) => sub.CategoryID === category.CategoryID
      );
      return {
        ...category,
        SubCategories: subCategories,
      };
    });

    return categories;
  } catch (err) {
    console.error("❌ Lỗi truy vấn Category và Sub_Category:", err);
    throw err;
  }
};
// ===============TRUY VẤN TẤT CẢ SẢN PHẨM (CÓ HOẶC KHÔNG CÓ SALE)===============
exports.findAllProducts = async () => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
    SELECT 
    P.ProductID,
    P.ProductName,
    P.SupplierID,
    P.Price,
    P.Image,
    P.isHot,
    P.StockQuantity,
    P.CategoryID,
    P.IsHidden,
    C.CategoryName,      
    PS.sale_price,
    PS.start_date,
    PS.end_date
FROM PRODUCT P
LEFT JOIN PRODUCT_SALE PS ON P.ProductID = PS.product_id
LEFT JOIN CATEGORY C ON P.CategoryID = C.CategoryID

    `);

    return result.recordset;
  } catch (err) {
    console.error("❌ Lỗi khi lấy tất cả sản phẩm:", err);
    throw err;
  }
};
