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
  try {
    const pool = await connectDB();

    const {
      ProductID,
      ProductName,
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
      Image,
      DetailID,
      SubCategoryName,
      CreatedAt,   // ✅ thêm
      UpdatedAt,   // ✅ thêm
    } = product;
    

    await pool.request()
  .input("ProductID", sql.VarChar(50), ProductID)
  .input("ProductName", sql.NVarChar(sql.MAX), ProductName)
  .input("DetailID", sql.NVarChar(50), DetailID)
  .input("IsHot", sql.TinyInt, IsHot ?? 0)
  .input("Type", sql.NVarChar(100), Type ?? null)
  .input("Price", sql.Int, Price ?? 0)
  .input("CategoryID", sql.NVarChar(100), CategoryID ?? null)
  .input("StockQuantity", sql.Int, StockQuantity ?? 0)
  .input("SupplierID", sql.NVarChar(100), SupplierID ?? null)
  .input("Image", sql.NVarChar(sql.MAX), Image ?? null)
  .input("CreatedAt", sql.DateTime, CreatedAt ?? new Date()) // ✅ thêm
  .input("UpdatedAt", sql.DateTime, UpdatedAt ?? new Date()) // ✅ thêm
  .query(`
    INSERT INTO PRODUCT
    (ProductID, ProductName, Price, Type, CategoryID, StockQuantity, SupplierID, IsHot, Image, DetailID, CreatedAt, UpdatedAt)
    VALUES
    (@ProductID, @ProductName, @Price, @Type, @CategoryID, @StockQuantity, @SupplierID, @IsHot, @Image, @DetailID, @CreatedAt, @UpdatedAt)
  `);


    // ✅ Insert PRODUCT_DETAIL
    await pool.request()
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

    // ✅ Insert SUBCATEGORY nếu chưa tồn tại
    await pool.request()
      .input("SubCategoryID", sql.NVarChar(50), SubCategoryID)
      .input("CategoryID", sql.NVarChar(50), CategoryID)
      .input("SubCategoryName", sql.NVarChar(100), SubCategoryName ?? null)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM SUBCATEGORY WHERE SubCategoryID = @SubCategoryID)
        BEGIN
          INSERT INTO SUBCATEGORY (SubCategoryID, CategoryID, SubCategoryName)
          VALUES (@SubCategoryID, @CategoryID, @SubCategoryName)
        END
      `);

    return { success: true, message: `Thêm sản phẩm ${ProductName} và detail thành công` };
  } catch (err) {
    console.error("❌ Lỗi addProductDB:", err);
    return { success: false, message: "Lỗi khi thêm sản phẩm vào database", error: err };
  }
};

