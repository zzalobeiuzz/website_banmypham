const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { getAllAccounts, resetAccountPassword, createAccount, updateAccount, deleteAccount } = require("./account.model");
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const AVATAR_FOLDER = path.join(__dirname, "../../../uploads/assets/avatar");

const ensureAvatarFolder = () => {
  if (!fs.existsSync(AVATAR_FOLDER)) {
    fs.mkdirSync(AVATAR_FOLDER, { recursive: true });
  }
};

const normalizeExt = (inputExt, fallback = ".jpg") => {
  const ext = String(inputExt || "").toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"].includes(ext)) {
    return ext === ".jpeg" ? ".jpg" : ext;
  }
  return fallback;
};

const safeEmailName = (email) => String(email || "").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();

const saveAvatarFromFile = async ({ email, file }) => {
  if (!file?.buffer || !email) return "";

  ensureAvatarFolder();
  const rawExt = path.extname(file.originalname || "") || (file.mimetype ? `.${file.mimetype.split("/")[1]}` : ".jpg");
  const fileName = `avatar_${safeEmailName(email)}_${Date.now()}${normalizeExt(rawExt)}`;
  await fs.promises.writeFile(path.join(AVATAR_FOLDER, fileName), file.buffer);
  return `avatar/${fileName}`;
};

const saveAvatarFromUrl = async ({ email, url }) => {
  const raw = String(url || "").trim();
  if (!raw || !email) return "";
  if (/^avatar\//i.test(raw)) return raw;

  ensureAvatarFolder();

  if (raw.startsWith("data:")) {
    const [meta, encoded] = raw.split(",");
    if (!encoded) return "";
    const mime = String(meta?.match(/^data:([^;]+)/i)?.[1] || "image/jpeg").toLowerCase();
    const extByMime = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
      "image/avif": ".avif",
    };
    const fileName = `avatar_${safeEmailName(email)}_${Date.now()}${normalizeExt(extByMime[mime])}`;
    await fs.promises.writeFile(path.join(AVATAR_FOLDER, fileName), Buffer.from(encoded, "base64"));
    return `avatar/${fileName}`;
  }

  if (!/^https?:\/\//i.test(raw)) {
    return raw.replace(/^\/uploads\/assets\//i, "");
  }

  const response = await axios.get(raw, { responseType: "arraybuffer", timeout: 15000 });
  const contentType = String(response.headers?.["content-type"] || "").toLowerCase();
  let ext = ".jpg";
  if (contentType.includes("png")) ext = ".png";
  else if (contentType.includes("webp")) ext = ".webp";
  else if (contentType.includes("gif")) ext = ".gif";
  else if (contentType.includes("avif")) ext = ".avif";

  const fileName = `avatar_${safeEmailName(email)}_${Date.now()}${ext}`;
  await fs.promises.writeFile(path.join(AVATAR_FOLDER, fileName), response.data);
  return `avatar/${fileName}`;
};

const resolveAccountAvatar = async ({ email, file, avatar, avatarUrl }) => {
  if (file) return saveAvatarFromFile({ email, file });
  if (String(avatarUrl || "").trim()) return saveAvatarFromUrl({ email, url: avatarUrl });
  return String(avatar || "").trim();
};

async function handleGetAccounts(req, res) {
  try {
    const accounts = await getAllAccounts();
    return res.json({ success: true, data: accounts });
  } catch (error) {
    console.error("❌ Lỗi handleGetAccounts:", error);
    return res.status(500).json({ success: false, message: error.message || "Không thể tải dữ liệu tài khoản." });
  }
}

async function handleResetAccountPassword(req, res) {
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
}

async function handleCreateAccount(req, res) {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "").trim();
    const displayName = String(req.body?.displayName || "").trim();
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

    const avatar = await resolveAccountAvatar({
      email,
      file: req.file,
      avatar: req.body?.avatar,
      avatarUrl: req.body?.avatarUrl,
    });
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

    return res.status(201).json({ success: true, avatar, message: "Tạo tài khoản thành công." });
  } catch (error) {
    console.error("❌ Lỗi handleCreateAccount:", error);
    return res.status(500).json({ success: false, message: error.message || "Tạo tài khoản thất bại." });
  }
}

async function handleUpdateAccount(req, res) {
  try {
    const email = String(req.params.email || "").trim().toLowerCase();
    const displayName = String(req.body?.displayName || "").trim();
    const role = Number(req.body?.role);
    const isActive = Number(req.body?.isActive);

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Email tai khoan khong hop le." });
    }

    if (!displayName) {
      return res.status(400).json({ success: false, message: "Ten hien thi khong duoc de trong." });
    }

    if (role !== 0 && role !== 1) {
      return res.status(400).json({ success: false, message: "Role chi chap nhan 0 hoac 1." });
    }

    if (isActive !== 0 && isActive !== 1) {
      return res.status(400).json({ success: false, message: "Trang thai chi chap nhan 0 hoac 1." });
    }

    const avatar = await resolveAccountAvatar({
      email,
      file: req.file,
      avatar: req.body?.avatar,
      avatarUrl: req.body?.avatarUrl,
    });
    const updated = await updateAccount({
      email,
      displayName,
      avatar,
      role,
      isActive,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Khong tim thay tai khoan de cap nhat." });
    }

    return res.json({ success: true, avatar, message: "Cap nhat tai khoan thanh cong." });
  } catch (error) {
    console.error("❌ Lỗi handleUpdateAccount:", error);
    return res.status(500).json({ success: false, message: error.message || "Cap nhat tai khoan that bai." });
  }
}

async function handleDeleteAccount(req, res) {
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
}

function refreshToken(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Thiếu refresh token" });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const payload = { id: decoded.id, email: decoded.email, role: decoded.role };
    const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(403).json({ message: "Refresh token không hợp lệ hoặc hết hạn" });
  }
}

module.exports = {
  handleGetAccounts,
  handleResetAccountPassword,
  handleCreateAccount,
  handleUpdateAccount,
  handleDeleteAccount,
  refreshToken,
};
