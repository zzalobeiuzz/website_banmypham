exports.User = async () => {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT 
        *
      FROM ACCOUNT
    `);
    return result.recordset;
  };