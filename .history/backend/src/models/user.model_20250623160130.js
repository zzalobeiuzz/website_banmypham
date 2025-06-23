exports.User = async () => {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT 
      DisplayName
      Email
      FROM ACCOUNT
    `);
    return result.recordset;
  };