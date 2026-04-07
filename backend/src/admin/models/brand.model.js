const { connectDB, sql } = require("../../config/connect");

exports.getAllBrands = async () => {
  const pool = await connectDB();

  const result = await pool.request().query(`
    SELECT
      idBrand,
      Brand,
      description,
      status,
      logo_url
    FROM BRAND
    ORDER BY idBrand DESC
  `);

  return result.recordset || [];
};

exports.createBrand = async ({ idBrand, Brand, description, status, logo_url }) => {
  const pool = await connectDB();

  const existsResult = await pool
    .request()
    .input("idBrand", sql.NVarChar(100), idBrand)
    .query(`
      SELECT TOP 1 idBrand
      FROM BRAND
      WHERE idBrand = @idBrand
    `);

  if (existsResult.recordset?.length) {
    const error = new Error("Mã thương hiệu đã tồn tại.");
    error.statusCode = 409;
    throw error;
  }

  const safeStatus =
    status === 1 ||
    status === "1" ||
    status === true ||
    String(status).toLowerCase() === "active" ||
    String(status).toLowerCase() === "true"
      ? 1
      : 0;

  await pool
    .request()
    .input("idBrand", sql.NVarChar(100), idBrand)
    .input("Brand", sql.NVarChar(255), String(Brand || "").trim())
    .input("description", sql.NVarChar(sql.MAX), description ? String(description).trim() : null)
    .input("status", sql.Int, safeStatus)
    .input("logo_url", sql.NVarChar(1000), logo_url ? String(logo_url).trim() : null)
    .query(`
      INSERT INTO BRAND (idBrand, Brand, description, status, logo_url)
      VALUES (@idBrand, @Brand, @description, @status, @logo_url)
    `);

  return {
    idBrand,
    Brand: String(Brand || "").trim(),
    description: description ? String(description).trim() : null,
    status: safeStatus,
    logo_url: logo_url ? String(logo_url).trim() : null,
  };
};