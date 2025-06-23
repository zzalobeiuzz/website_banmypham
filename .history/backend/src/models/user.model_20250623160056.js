exports.User = async () => {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT 
        *
      FROM ACCOUNT
      JOIN PRODUCT P ON PS.product_id = P.ProductID;
    `);
    return result.recordset;
  };