const jwt = require("jsonwebtoken");
const { getAllAccounts, resetAccountPassword, createAccount, deleteAccount } = require("../models/account.model");
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

exports.handleCreateAccount = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "").trim();
    const displayName = String(req.body?.displayName || "").trim();
    const avatar = String(req.body?.avatar || "").trim();
    const role = Number(req.body?.role);

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Email không hợp lệ." });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Mật khẩu phải có ít nhất 6 ký tự." });
    }

    if (role !== 0 && role !== 1) {
      return res.status(400).json({ success: false, message: "Role chỉ chấp nhận 0 hoặc 1." });
    }

    const result = await createAccount({
      email,
      password,
      displayName: displayName || email,
      avatar,
      role,
    });

    if (!result?.created && result?.reason === "exists") {
      return res.status(409).json({ success: false, message: "Email này đã tồn tại trong hệ thống." });
    }

    return res.status(201).json({ success: true, message: "Tạo tài khoản thành công." });
  } catch (error) {
    console.error("❌ Lỗi handleCreateAccount:", error);
    return res.status(500).json({ success: false, message: error.message || "Tạo tài khoản thất bại." });
  }
};

exports.handleDeleteAccount = async (req, res) => {
  try {
    const email = String(req.params.email || "").trim();
    if (!email) {
      return res.status(400).json({ success: false, message: "Thiếu email tài khoản." });
    }

    const deleted = await deleteAccount({ email });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản để xóa." });
    }

    return res.json({ success: true, message: "Xóa tài khoản thành công." });
  } catch (error) {
    console.error("❌ Lỗi handleDeleteAccount:", error);
    return res.status(500).json({ success: false, message: error.message || "Xóa tài khoản thất bại." });
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
