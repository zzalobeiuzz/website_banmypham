const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware kiểm tra token cho user thường
 */
exports.verifyToken = (req, res, next) => {
  // Lấy header Authorization
  const authHeader = req.headers.authorization;

  // Nếu không có hoặc không bắt đầu bằng Bearer
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized - Thiếu token" });
  }

  // Cắt lấy token
  const token = authHeader.split(" ")[1];
  try {
    // Verify token (tự động kiểm tra chữ ký và hạn sử dụng exp)
    const decoded = jwt.verify(token, JWT_SECRET);

    // Gắn user decode vào request để các middleware khác dùng
    req.user = decoded;

    // Cho phép đi tiếp
    next();
  } catch (err) {
    // Nếu lỗi do hết hạn token
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    // Các lỗi khác (ví dụ chữ ký sai, token giả mạo, ...)
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};

/**
 * Middleware kiểm tra token và quyền admin
 */
exports.verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized - Thiếu token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Kiểm tra role
    if (decoded.role !== 1) {
      return res.status(403).json({ message: "Forbidden - Bạn không phải admin" });
    }

    // Gắn user decode vào request
    req.user = decoded;

    // Cho phép đi tiếp
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};
