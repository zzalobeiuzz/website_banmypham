const session = require("express-session");
const MSSQLStore = require("connect-mssql")(session);
const { config } = require("./connect"); // Lấy config từ file connect.js

const sessionMiddleware = session({
  secret: "my_secret_key",    // 🔑 Khoá ký session ID (bắt buộc nên dài, phức tạp hơn khi deploy thật)
  resave: false,              // Không lưu lại session nếu không thay đổi
  saveUninitialized: false,   // Không lưu session mới chưa có gì
  cookie: {
    maxAge: 1000 * 60 * 60,   // ⏰ 1 giờ
    secure: false,            // Dùng true nếu deploy HTTPS
    httpOnly: true,           // Không cho JS truy cập cookie
  },
  store: new MSSQLStore({
    user: config.user,
    password: config.password,
    server: config.server,
    database: config.database,
    options: {
      encrypt: config.options.encrypt,
      trustServerCertificate: config.options.trustServerCertificate,
    },
    ttl: 3600, // ⏰ thời gian hết hạn (giây) = 1 giờ
  }),
});

module.exports = sessionMiddleware;
