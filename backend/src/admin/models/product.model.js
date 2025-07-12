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
    .query(`SELECT 1 FROM PRODUCT WHERE ProductID = @ProductID`);
  return result.recordset.length > 0;
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
