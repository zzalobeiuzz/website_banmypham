exports.User = async () => {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT 
        *
      FROM PRODUCT_SALE PS
      JOIN PRODUCT P ON PS.product_id = P.ProductID;
    `);
    return result.recordset;
  };