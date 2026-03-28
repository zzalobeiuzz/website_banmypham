const { connectDB } = require("../../config/connect");
const sql = require("mssql");

const CATEGORY_TABLE = "Category";
const SUBCATEGORY_TABLE = "SUB_CATEGORY";

exports.createCategory = async (categoryName) => {
  const pool = await connectDB();
  const categoryId = `CAT_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  await pool
    .request()
    .input("CategoryID", sql.NVarChar(50), categoryId)
    .input("CategoryName", sql.NVarChar(255), categoryName)
    .query(`
      INSERT INTO ${CATEGORY_TABLE} (CategoryID, CategoryName)
      VALUES (@CategoryID, @CategoryName)
    `);

  return { CategoryID: categoryId, CategoryName: categoryName };
};

exports.createSubCategory = async (categoryId, subCategoryName) => {
  const pool = await connectDB();
  const subCategoryId = `SUB_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const categoryCheck = await pool
    .request()
    .input("CategoryID", sql.NVarChar(50), categoryId)
    .query(`SELECT TOP 1 CategoryID FROM ${CATEGORY_TABLE} WHERE CategoryID = @CategoryID`);

  if (!categoryCheck.recordset.length) {
    return { success: false, reason: "CATEGORY_NOT_FOUND" };
  }

  await pool
    .request()
    .input("SubCategoryID", sql.NVarChar(50), subCategoryId)
    .input("CategoryID", sql.NVarChar(50), categoryId)
    .input("SubCategoryName", sql.NVarChar(255), subCategoryName)
    .query(`
      INSERT INTO ${SUBCATEGORY_TABLE} (SubCategoryID, CategoryID, SubCategoryName)
      VALUES (@SubCategoryID, @CategoryID, @SubCategoryName)
    `);

  return {
    success: true,
    data: {
      SubCategoryID: subCategoryId,
      CategoryID: categoryId,
      SubCategoryName: subCategoryName,
    },
  };
};

exports.countSubCategoriesByCategoryId = async (categoryId) => {
  const pool = await connectDB();

  const result = await pool
    .request()
    .input("CategoryID", sql.NVarChar(50), categoryId)
    .query(`
      SELECT COUNT(1) AS total
      FROM ${SUBCATEGORY_TABLE}
      WHERE CategoryID = @CategoryID
    `);

  return Number(result.recordset[0]?.total || 0);
};

exports.countProductsByCategoryId = async (categoryId) => {
  const pool = await connectDB();

  const result = await pool
    .request()
    .input("CategoryID", sql.NVarChar(50), categoryId)
    .query(`
      SELECT COUNT(1) AS total
      FROM PRODUCT
      WHERE CategoryID = @CategoryID
        AND (IsHidden = 0 OR IsHidden IS NULL)
    `);

  return Number(result.recordset[0]?.total || 0);
};

exports.countProductsBySubCategoryId = async (subCategoryId) => {
  const pool = await connectDB();

  const result = await pool
    .request()
    .input("SubCategoryID", sql.NVarChar(50), subCategoryId)
    .query(`
      SELECT COUNT(1) AS total
      FROM PRODUCT
      WHERE SubCategoryID = @SubCategoryID
        AND (IsHidden = 0 OR IsHidden IS NULL)
    `);

  return Number(result.recordset[0]?.total || 0);
};

exports.softDeleteCategory = async (categoryId) => {
  const pool = await connectDB();

  const result = await pool
    .request()
    .input("CategoryID", sql.NVarChar(50), categoryId)
    .query(`
      UPDATE ${CATEGORY_TABLE}
      SET IsHidden = 1
      WHERE CategoryID = @CategoryID
        AND (IsHidden = 0 OR IsHidden IS NULL)
    `);

  return {
    success: true,
    affectedRows: result.rowsAffected?.[0] || 0,
  };
};

exports.deleteSubCategory = async (subCategoryId) => {
  const pool = await connectDB();

  const result = await pool
    .request()
    .input("SubCategoryID", sql.NVarChar(50), subCategoryId)
    .query(`
      UPDATE ${SUBCATEGORY_TABLE}
      SET IsHidden = 1
      WHERE SubCategoryID = @SubCategoryID
        AND (IsHidden = 0 OR IsHidden IS NULL)
    `);

  return {
    success: true,
    affectedRows: result.rowsAffected?.[0] || 0,
  };
};

exports.getAllCategories = async () => {
  const pool = await connectDB();

  // Lấy tất cả categories (kể cả ẩn) cho admin
  const categoryResult = await pool.request().query(`
    SELECT * FROM ${CATEGORY_TABLE}
  `);

  // Lấy tất cả sub-categories (kể cả ẩn)
  const subCategoryResult = await pool.request().query(`
    SELECT * FROM ${SUBCATEGORY_TABLE}
  `);

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
};
