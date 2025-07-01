const session = require("express-session");
const MSSQLStore = require("connect-mssql")(session);
const { config } = require("./db");

const sessionMiddleware = session({
  secret: "my_secret_key",    // 🔑 Khoá ký session ID
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 giờ
    secure: false,
    httpOnly: true,
  },
  store: new MSSQLStore({
    user: config.user,
    password: config.password,
    server: config.server,
    database: config.database,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
    ttl: 3600,
  }),
});

module.exports = sessionMiddleware;
