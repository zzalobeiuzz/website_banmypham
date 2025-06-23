exports.User = async (email) => {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT 
      DisplayName
      Email
      Password
      Role
      FROM ACCOUNT WHERE 
    `);
    return result.recordset;
  };