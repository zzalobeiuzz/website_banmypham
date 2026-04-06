const { connectDB } = require("../../config/connect");

exports.getAllBrands = async () => {
  const pool = await connectDB();

  const result = await pool.request().query(`
    SELECT
      idBrand,
      description,
      status,
      logo_url
    FROM BRAND
    ORDER BY idBrand DESC
  `);

  return result.recordset || [];
};