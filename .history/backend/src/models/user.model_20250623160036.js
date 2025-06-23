exports.findSaleProducts = async () => {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT 
        P.ProductName,
        P.SupplierID,
        P.Price,
        P.Image,
        PS.sale_price,
        PS.start_date,
        PS.end_date
      FROM PRODUCT_SALE PS
      JOIN PRODUCT P ON PS.product_id = P.ProductID;
    `);
    return result.recordset;
  };