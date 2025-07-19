const { connectDB } = require("../../config/connect");
const sql = require("mssql");

// =========================KIỂM TRA SẢN PHẨM====================
/**
 * Hàm kiểm tra xem sản phẩm có tồn tại hay không
 * @param {string} productId - Mã sản phẩm
 * @returns {Promise<boolean>} - true nếu tồn tại, false nếu không tồn tại
 */
exports.checkProductExists = async (productId) => {

  const pool = await connectDB();
  const result = await pool.request()
    .input("ProductID", sql.VarChar(50), productId)
    .query(`SELECT * FROM PRODUCT WHERE ProductID = @ProductID`);

  if (result.recordset.length > 0) {
    return result.recordset[0]; // ✅ Trả đúng object sản phẩm
  } else {
    return null; // ✅ Không tìm thấy
  }
};

// =========================UPDATE THÔNG TIN SẢN PHẨM====================
/**
 * Hàm cập nhật thông tin sản phẩm
 * Chỉ cập nhật các trường được truyền vào (không bắt buộc phải truyền hết)
 * @param {object} product - Object chứa các trường thông tin sản phẩm
 * @returns {Promise<object>} - Kết quả cập nhật với success & message
 */
exports.updateProduct = async (product) => {
  const pool = await connectDB();

  // Destructure các trường trong object product
  const {
    ProductID,
    ProductName,
    Description,
    IsHot,
    Type,
    Price,
    CategoryID,
    StockQuantity,
    UpdatedAt,
    SupplierID,
    Image,
  } = product;

  // Tạo mảng chứa các trường cần update (chỉ thêm nếu trường đó có giá trị)
  const updateFields = [];

  if (ProductName !== undefined) updateFields.push(`ProductName = @ProductName`);
  if (Description !== undefined) updateFields.push(`Description = @Description`);
  if (IsHot !== undefined) updateFields.push(`IsHot = @IsHot`);
  if (Type !== undefined) updateFields.push(`Type = @Type`);
  if (Price !== undefined) updateFields.push(`Price = @Price`);
  if (CategoryID !== undefined) updateFields.push(`CategoryID = @CategoryID`);
  if (StockQuantity !== undefined) updateFields.push(`StockQuantity = @StockQuantity`);
  if (UpdatedAt !== undefined) updateFields.push(`UpdatedAt = @UpdatedAt`);
  if (SupplierID !== undefined) updateFields.push(`SupplierID = @SupplierID`);
  if (Image !== undefined) updateFields.push(`Image = @Image`);

  // Nếu không có trường nào để cập nhật
  if (updateFields.length === 0) {
    return { success: false, message: "Không có trường nào để cập nhật" };
  }

  // Tạo request với các input tương ứng
  await pool.request()
    .input("ProductID", sql.VarChar(50), ProductID)
    .input("ProductName", sql.NVarChar(sql.MAX), ProductName ?? null)
    .input("Description", sql.NVarChar(sql.MAX), Description ?? null)
    .input("IsHot", sql.TinyInt, IsHot ?? null)
    .input("Type", sql.NVarChar(sql.MAX), Type ?? null)
    .input("Price", sql.Int, Price ?? null)
    .input("CategoryID", sql.NVarChar(100), CategoryID ?? null)
    .input("StockQuantity", sql.Int, StockQuantity ?? null)
    .input("UpdatedAt", sql.Date, UpdatedAt ?? new Date()) // Mặc định lấy ngày hiện tại nếu không truyền vào
    .input("SupplierID", sql.NVarChar(100), SupplierID ?? null)
    .input("Image", sql.NVarChar(sql.MAX), Image ?? null)
    .query(`
      UPDATE PRODUCT
      SET ${updateFields.join(", ")}
      WHERE ProductID = @ProductID
    `);

  return { success: true, message: `Cập nhật sản phẩm ID ${ProductID} thành công` };
};



// =========================THÊM MỚI SẢN PHẨM====================
/**
 * Hàm thêm sản phẩm mới
 * @param {object} product - Thông tin sản phẩm
 * @returns {Promise<object>} - Kết quả thêm
 */

exports.addProductDB = async (product) => {
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);

  try {
    // 🧠 1. Kiểm tra trùng ProductID trước khi bắt đầu transaction
    const existingProduct = await exports.checkProductExists(product.ProductID);
    if (existingProduct) {
      return { success: false, message: `Sản phẩm với ID ${product.ProductID} đã tồn tại` };
    }

    // ✅ Bắt đầu transaction
    await transaction.begin();

    const {
      ProductID, ProductName, Price, Type, CategoryID, SubCategoryID,
      StockQuantity, SupplierID, IsHot, Intro, Usage, Ingredients,
      Instructions, Image, DetailID, SubCategoryName, CreatedAt, UpdatedAt
    } = product;

    // 🟩 2. Insert PRODUCT
    const productRequest = new sql.Request(transaction);
    await productRequest
      .input("ProductID", sql.VarChar(50), ProductID)
      .input("ProductName", sql.NVarChar(sql.MAX), ProductName)
      .input("DetailID", sql.NVarChar(50), DetailID)
      .input("IsHot", sql.TinyInt, IsHot ?? 0)
      .input("Type", sql.NVarChar(100), Type ?? null)
      .input("Price", sql.Int, Price ?? 0)
      .input("ProdCategoryID", sql.NVarChar(100), CategoryID ?? null)
      .input("StockQuantity", sql.Int, StockQuantity ?? 0)
      .input("SupplierID", sql.NVarChar(100), SupplierID ?? null)
      .input("Image", sql.NVarChar(sql.MAX), Image ?? null)
      .input("CreatedAt", sql.DateTime, CreatedAt ?? new Date())
      .input("UpdatedAt", sql.DateTime, UpdatedAt ?? new Date())
      .query(`
        INSERT INTO PRODUCT
        (ProductID, ProductName, Price, Type, CategoryID, StockQuantity, SupplierID, IsHot, Image, DetailID, CreatedAt, UpdatedAt)
        VALUES
        (@ProductID, @ProductName, @Price, @Type, @ProdCategoryID, @StockQuantity, @SupplierID, @IsHot, @Image, @DetailID, @CreatedAt, @UpdatedAt)
      `);

    // 🟩 3. Insert PRODUCT_DETAIL
    const detailRequest = new sql.Request(transaction);
    await detailRequest
      .input("IDDetail", sql.NVarChar(50), DetailID)
      .input("ProductDescription", sql.NVarChar(sql.MAX), Intro ?? null)
      .input("Ingredient", sql.NVarChar(sql.MAX), Ingredients ?? null)
      .input("Usage", sql.NVarChar(sql.MAX), Usage ?? null)
      .input("HowToUse", sql.NVarChar(sql.MAX), Instructions ?? null)
      .query(`
        INSERT INTO PRODUCT_DETAIL
        (IDDetail, ProductDescription, Ingredient, Usage, HowToUse)
        VALUES
        (@IDDetail, @ProductDescription, @Ingredient, @Usage, @HowToUse)
      `);

    // 🟩 4. Insert SUB_CATEGORY nếu chưa có
    const subCategoryRequest = new sql.Request(transaction);
    await subCategoryRequest
      .input("SubCatID", sql.NVarChar(50), SubCategoryID)
      .input("SubCatName", sql.NVarChar(100), SubCategoryName ?? null)
      .input("SubCatCategoryID", sql.NVarChar(50), CategoryID)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM SUB_CATEGORY WHERE SubCategoryID = @SubCatID)
        BEGIN
          INSERT INTO SUB_CATEGORY (SubCategoryID, CategoryID, SubCategoryName)
          VALUES (@SubCatID, @SubCatCategoryID, @SubCatName)
        END
      `);

    // ✅ Commit nếu thành công
    await transaction.commit();
    return { success: true, message: `Thêm sản phẩm ${ProductName} thành công` };
  } catch (err) {
    // ✅ Rollback an toàn
    if (transaction._aborted !== true) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error("❌ Rollback thất bại:", rollbackErr);
      }
    }

    console.error("❌ Transaction rollback do lỗi:", err);
    return {
      success: false,
      message: "Lỗi khi thêm sản phẩm, đã rollback",
      error: err.message,
    };
  }
};

// =========================LẤY CHI TIẾT SẢN PHẨM THEO ID====================
/**
 * Lấy chi tiết sản phẩm từ bảng PRODUCT_DETAIL dựa theo DetailID
 * @param {string} detailId - Mã chi tiết sản phẩm (DetailID)
 * @returns {Promise<object|null>} - Trả về object chi tiết sản phẩm hoặc null nếu không có
 */
exports.getProductDetailById = async (detailId) => {
  try {
    console.log(detailId)
    const pool = await connectDB();
    const result = await pool.request()
      .input("DetailID", sql.NVarChar(50), detailId)
      .query(`
        SELECT IDDetail, ProductDescription, Ingredient, Usage, HowToUse
        FROM PRODUCT_DETAIL
        WHERE IDDetail = @DetailID
      `);

    if (result.recordset.length > 0) {
      return result.recordset[0]; // ✅ Trả về chi tiết
    } else {
      return null; // ❌ Không tìm thấy
    }
  } catch (err) {
    console.error("❌ Lỗi truy vấn getProductDetailById:", err);
    throw err;
  }
};




