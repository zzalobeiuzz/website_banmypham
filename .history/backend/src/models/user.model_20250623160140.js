exports.User = async () => {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT 
      DisplayName
      Email
      Password
      Role
      FROM ACCOUNT
    `);
    return result.recordset;
  };