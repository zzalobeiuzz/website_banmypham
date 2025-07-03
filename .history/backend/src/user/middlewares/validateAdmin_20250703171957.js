const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 1) {
      return res.status(403).json({ message: "Forbidden - Bạn không phải admin" });
    }
    req.user = decoded; // Gắn user vào request để dùng tiếp
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
}