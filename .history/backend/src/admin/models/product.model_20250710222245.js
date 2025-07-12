const { connectDB } = require("../../config/");
const sql = require("mssql");

// ✅ Hàm kiểm tra sản phẩm tồn tại
exports.checkProductExists = async (productId) => {
  const pool = await connectDB();
  const result = await pool.request()
    .input("ProductID", sql.Int, productId)
    .query(`SELECT 1 FROM PRODUCT WHERE ProductID = @ProductID`);
  return result.recordset.length > 0;
};

// ✅ Hàm update sản phẩm
exports.updateProduct = async (product) => {
  const pool = await connectDB();

  const {
    ProductID,
    ProductName,
    Price,
    StockQuantity,
    CategoryID,
    Image,
    SupplierID,
  } = product;

  const updateFields = [];
  if (ProductName !== undefined) updateFields.push(`ProductName = @ProductName`);
  if (Price !== undefined) updateFields.push(`Price = @Price`);
  if (StockQuantity !== undefined) updateFields.push(`StockQuantity = @StockQuantity`);
  if (CategoryID !== undefined) updateFields.push(`CategoryID = @CategoryID`);
  if (Image !== undefined) updateFields.push(`Image = @Image`);
  if (SupplierID !== undefined) updateFields.push(`SupplierID = @SupplierID`);

  if (updateFields.length === 0) {
    return { success: false, message: "Không có trường nào được cập nhật" };
  }

  await pool.request()
    .input("ProductID", sql.Int, ProductID)
    .input("ProductName", sql.NVarChar, ProductName ?? null)
    .input("Price", sql.Float, Price ?? null)
    .input("StockQuantity", sql.Int, StockQuantity ?? null)
    .input("CategoryID", sql.Int, CategoryID ?? null)
    .input("Image", sql.NVarChar, Image ?? null)
    .input("SupplierID", sql.Int, SupplierID ?? null)
    .query(`
      UPDATE PRODUCT
      SET ${updateFields.join(", ")}
      WHERE ProductID = @ProductID
    `);

  return { success: true, message: `Cập nhật sản phẩm ID ${ProductID} thành công` };
};
