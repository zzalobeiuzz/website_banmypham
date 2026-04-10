const jwt = require("jsonwebtoken");
const { getAllAccounts, resetAccountPassword } = require("../models/account.model");
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

exports.handleGetAccounts = async (req, res) => {
  try {
    const accounts = await getAllAccounts();
    return res.json({ success: true, data: accounts });
  } catch (error) {
    console.error("❌ Lỗi handleGetAccounts:", error);
    return res.status(500).json({ success: false, message: error.message || "Không thể tải dữ liệu tài khoản." });
  }
};

exports.handleResetAccountPassword = async (req, res) => {
  try {
    const email = String(req.params.email || "").trim();
    const newPassword = String(req.body?.newPassword || "").trim();

    if (!email) {
      return res.status(400).json({ success: false, message: "Thiếu email tài khoản." });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải có ít nhất 6 ký tự.",
      });
    }

    const updated = await resetAccountPassword({ email, newPassword });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản để reset mật khẩu." });
    }

    return res.json({ success: true, message: "Đã reset mật khẩu thành công." });
  } catch (error) {
    console.error("❌ Lỗi handleResetAccountPassword:", error);
    return res.status(500).json({ success: false, message: error.message || "Reset mật khẩu thất bại." });
  }
};

exports.refreshToken = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Thiếu refresh token" });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    // Tạo access token mới
    const payload = { id: decoded.id, email: decoded.email, role: decoded.role };
    const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(403).json({ message: "Refresh token không hợp lệ hoặc hết hạn" });
  }
};
