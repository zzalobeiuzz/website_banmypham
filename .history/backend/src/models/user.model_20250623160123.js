exports.User = async () => {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT 
      DisplayName
      FROM ACCOUNT
    `);
    return result.recordset;
  };