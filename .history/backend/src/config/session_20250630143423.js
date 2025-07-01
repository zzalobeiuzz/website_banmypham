const session = require("express-session");
const MSSQLStore = require("connect-mssql")(session);
const { config } = require("./connect"); // ⚡ Lấy thông tin cấu hình DB từ file connect.js
require("dotenv").config({ path: "../../private.env" });

// 🌟 Tạo middleware session
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET, // 🔑 Khoá bí mật dùng để ký session ID (bắt buộc, nên đặt phức tạp khi production)
  resave: false, // 🔄 Không lưu lại session nếu không thay đổi (giúp giảm ghi DB)
  saveUninitialized: false, // 💤 Không lưu session mới nếu chưa có dữ liệu (giảm session rác)
  cookie: {
    maxAge: 1000 * 60 * 60, // ⏰ Thời gian sống cookie: 1 giờ
    secure: false, // 🔒 true = chỉ gửi qua HTTPS (bật khi deploy thật)
    httpOnly: true, // 🚫 Không cho JS phía client truy cập cookie (tăng bảo mật)
  },
  store: new MSSQLStore({
    // 💾 Nơi lưu session (ở đây: SQL Server)
    user: config.user, // 👤 User SQL
    password: config.password, // 🔑 Password SQL
    server: config.server, // 🌐 Địa chỉ server SQL
    database: config.database, // 🗄️ Tên database
    options: {
      encrypt: config.options.encrypt, // 🔐 Có mã hoá không (tuỳ config SQL)
      trustServerCertificate: config.options.trustServerCertificate, // ✅ Tin chứng chỉ tự ký
    },
    ttl: 3600, // ⏰ Session hết hạn (giây), ở đây = 1 giờ
    createTable: true,   // ⚡ Tự động tạo bảng sessions nếu chưa có
    table: 'sessions', // 👈 Đảm bảo đúng tên bảng
  }),
});

// ✅ Xuất middleware để dùng trong app (app.use(sessionMiddleware))
module.exports = sessionMiddleware;
