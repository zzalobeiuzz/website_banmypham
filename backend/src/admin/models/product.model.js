const { connectDB } = require("../../config/connect");
const sql = require("mssql");

// =========================KIỂM TRA SẢN PHẨM====================
/**
 * Hàm kiểm tra xem sản phẩm có tồn tại hay không
 * @param {string} productId - Mã sản phẩm
 * @returns {Promise<boolean>} - true nếu tồn tại, false nếu không tồn tại
 */
exports.checkProductExists = async (productId) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("ProductID", sql.VarChar(50), productId)
      .query(`
            SELECT 
            P.*,                          -- 🟢 Lấy toàn bộ cột của bảng PRODUCT (sản phẩm)
          
            -- 🟣 Thông tin tên danh mục (Category)
            C.CategoryName,              -- 🔸 Tên danh mục chính

            -- 🟣 Thông tin danh mục phụ (SubCategory)
            SC.SubCategoryName,           -- 🔸 Tên danh mục phụ
          
            -- 🟡 Thông tin chi tiết sản phẩm (Detail)
            D.Usage,                      -- 🔹 Công dụng
            D.Ingredient,                -- 🔹 Thành phần
            D.ProductDescription,         -- 🔹 Hướng dẫn sử dụng
            D.HowToUse                    -- 🔹 Thông tin khác (nếu có)
          
          FROM PRODUCT P

          -- 🔗 Lấy tên Catagory
          LEFT JOIN Category C ON P.CategoryID = C.CategoryID

          -- 🔗 Lấy tên SubCategory
          LEFT JOIN Sub_Category SC ON P.SubCategoryID = SC.SubCategoryID
          
          -- 🔗 Lấy chi tiết sản phẩm
          LEFT JOIN Product_Detail D ON P.DetailID = D.IDDetail
          
          -- 🔍 Điều kiện lọc: sản phẩm có ProductID cụ thể
          WHERE P.ProductID = @ProductID
      `);

    if (result.recordset.length === 0) return null;
    // console.log(result)
    // ✅ Trích xuất và cấu trúc lại dữ liệu
    const {
      CategoryName,
      SubCategoryName,
      IDDetail,
      Usage,
      Ingredient,
      ProductDescription,
      HowToUse,
      ...productInfo
    } = result.recordset[0];

    return {
      ...productInfo,
      CategoryName:CategoryName,
      SubCategoryName:SubCategoryName,
      Usage:Usage,
      Ingredient:Ingredient,
      ProductDescription:ProductDescription,
      HowToUse:HowToUse,
    };

  } catch (error) {
    console.error("❌ Lỗi khi truy vấn sản phẩm:", error.message);
    throw new Error("Đã xảy ra lỗi khi kiểm tra sản phẩm");
  }
};

// =========================KIỂM TRA SẢN PHẨM THEO BARCODE====================
/**
 * Hàm kiểm tra sản phẩm theo barcode
 * @param {string} barcode - Mã vạch sản phẩm
 * @returns {Promise<object|null>} - Thông tin sản phẩm nếu tồn tại
 */
exports.checkProductExistsByBarcode = async (barcode) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("Barcode", sql.VarChar(100), barcode)
      .query(`
            SELECT 
            P.*,                          -- Lấy toàn bộ cột của bảng PRODUCT
            C.CategoryName,               -- Tên danh mục chính
            SC.SubCategoryName,           -- Tên danh mục phụ
            D.Usage,                      -- Công dụng
            D.Ingredient,                 -- Thành phần
            D.ProductDescription,         -- Mô tả sản phẩm
            D.HowToUse                    -- Hướng dẫn sử dụng
          FROM PRODUCT P
          LEFT JOIN Category C ON P.CategoryID = C.CategoryID
          LEFT JOIN Sub_Category SC ON P.SubCategoryID = SC.SubCategoryID
          LEFT JOIN Product_Detail D ON P.DetailID = D.IDDetail
          WHERE P.Barcode = @Barcode
      `);

    if (result.recordset.length === 0) return null;

    const {
      CategoryName,
      SubCategoryName,
      Usage,
      Ingredient,
      ProductDescription,
      HowToUse,
      ...productInfo
    } = result.recordset[0];

    return {
      ...productInfo,
      CategoryName,
      SubCategoryName,
      Usage,
      Ingredient,
      ProductDescription,
      HowToUse,
    };
  } catch (error) {
    console.error("❌ Lỗi khi truy vấn sản phẩm theo barcode:", error.message);
    throw new Error("Đã xảy ra lỗi khi kiểm tra sản phẩm theo barcode");
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
    Barcode,
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
  if (Barcode !== undefined) updateFields.push(`Barcode = @Barcode`);
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
    .input("Barcode", sql.VarChar(100), Barcode ?? null)
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
      StockQuantity, SupplierID, IsHot, IsHidden, ProductDescription, Usage, Ingredients,
      Instructions, Image, DetailID, SubCategoryName, CreatedAt, UpdatedAt, Barcode
    } = product;

    // 🟩 2. Insert PRODUCT
    const productRequest = new sql.Request(transaction);
    await productRequest
      .input("ProductID", sql.VarChar(50), ProductID)
      .input("ProductName", sql.NVarChar(sql.MAX), ProductName)
      .input("Barcode", sql.VarChar(100), Barcode ?? null)
      .input("DetailID", sql.NVarChar(50), DetailID)
      .input("IsHot", sql.TinyInt, IsHot ?? 0)
      .input("Type", sql.NVarChar(100), Type ?? null)
      .input("Price", sql.Int, Price ?? 0)
      .input("CategoryID", sql.NVarChar(100), CategoryID ?? null)
      .input("StockQuantity", sql.Int, StockQuantity ?? 0)
      .input("SupplierID", sql.NVarChar(100), SupplierID ?? null)
      .input("SubCategoryID", sql.NVarChar(50), SubCategoryID)
      .input("Image", sql.NVarChar(sql.MAX), Image ?? null)
      .input("IsHidden", sql.TinyInt, IsHidden ?? 0)
      .input("CreatedAt", sql.DateTime, CreatedAt ?? new Date())
      .input("UpdatedAt", sql.DateTime, UpdatedAt ?? new Date())
      .query(`
        INSERT INTO PRODUCT
        (ProductID, ProductName, Barcode, Price, Type, CategoryID, StockQuantity, SupplierID, SubCategoryID, IsHot, IsHidden, Image, DetailID, CreatedAt, UpdatedAt)
        VALUES
        (@ProductID, @ProductName, @Barcode, @Price, @Type, @CategoryID, @StockQuantity, @SupplierID, @SubCategoryID, @IsHot, @IsHidden, @Image, @DetailID, @CreatedAt, @UpdatedAt)
      `);

    // 🟩 3. Insert PRODUCT_DETAIL
    const detailRequest = new sql.Request(transaction);
    await detailRequest
      .input("IDDetail", sql.NVarChar(50), DetailID)
      .input("ProductDescription", sql.NVarChar(sql.MAX), ProductDescription ?? null)
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
