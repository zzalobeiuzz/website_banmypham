const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Tách access token từ header Authorization.
 * Header hợp lệ có dạng: "Bearer <token>".
 * Trả về null nếu thiếu header hoặc sai định dạng.
 */
const getBearerToken = (req) => {
  const authHeader = req.headers.authorization;

  // Không có Authorization hoặc không theo chuẩn Bearer thì xem như chưa đăng nhập.
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  // Cú pháp: "Bearer xxxxx.yyyyy.zzzzz" -> lấy phần token phía sau.
  return authHeader.split(" ")[1];
};

/**
 * Verify JWT bằng secret của hệ thống.
 * Trả về object thống nhất để middleware gọi phía dưới không cần try/catch lặp lại.
 */
const verifyJwt = (token) => {
  try {
    // jwt.verify sẽ kiểm tra chữ ký và cả hạn token (exp) nếu có.
    return { decoded: jwt.verify(token, JWT_SECRET), error: null };
  } catch (error) {
    // Gom lỗi vào một chỗ để middleware xử lý response thống nhất.
    return { decoded: null, error };
  }
};

/**
 * Middleware xác thực người dùng đã đăng nhập.
 * Luồng xử lý:
 * 1) Lấy token từ header Authorization.
 * 2) Verify token.
 * 3) Gắn payload decode vào req.user để controller/middleware sau dùng lại.
 */
exports.verifyToken = (req, res, next) => {
  const token = getBearerToken(req);

  // Thiếu token: client chưa gửi thông tin đăng nhập.
  if (!token) {
    return res.status(401).json({ message: "Unauthorized - Thiếu token" });
  }

  const { decoded, error } = verifyJwt(token);

  // Token sai chữ ký, hết hạn hoặc không đúng định dạng.
  if (error || !decoded) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }

  // Lưu thông tin user từ token để tầng sau không cần verify lại.
  req.user = decoded;
  return next();
};

/**
 * Middleware xác thực quyền admin.
 * Luồng xử lý:
 * 1) Kiểm tra token hợp lệ như verifyToken.
 * 2) Kiểm tra role trong payload phải là admin (role === 1).
 */
exports.verifyAdmin = (req, res, next) => {
  const token = getBearerToken(req);

  // Thiếu token: từ chối truy cập ngay.
  if (!token) {
    return res.status(401).json({ message: "Unauthorized - Thiếu token" });
  }

  const { decoded, error } = verifyJwt(token);

  // Token không hợp lệ: từ chối truy cập.
  if (error || !decoded) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }

  // Có đăng nhập nhưng không đủ quyền admin.
  if (decoded.role !== 1) {
    return res.status(403).json({ message: "Forbidden - Bạn không phải admin" });
  }

  // Gắn thông tin admin vào request để controller có thể dùng.
  req.user = decoded;
  return next();
};
