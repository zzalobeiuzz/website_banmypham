const {
  getCustomerList,
  getCustomerDetail,
  deleteCustomer,
  resetCustomerPassword,
  updateCustomerInfo,
  createCustomer,
} = require("./customer.model");

const bcrypt = require("bcrypt");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

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

const saveAvatarFromFile = ({ email, file }) => {
  if (!file?.buffer || !email) return "";

  ensureAvatarFolder();
  const rawExt = path.extname(file.originalname || "") || (file.mimetype ? `.${file.mimetype.split("/")[1]}` : ".jpg");
  const ext = normalizeExt(rawExt);
  const safeEmail = String(email || "").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  const fileName = `avatar_${safeEmail}_${Date.now()}${ext}`;
  const targetPath = path.join(AVATAR_FOLDER, fileName);

  fs.writeFileSync(targetPath, file.buffer);
  return `avatar/${fileName}`;
};

const saveAvatarFromUrl = async ({ email, url }) => {
  const raw = String(url || "").trim();
  if (!raw || !email) return "";

  if (raw.startsWith("avatar/") || raw.startsWith("/uploads/assets/avatar/")) {
    return raw.replace(/^\/uploads\/assets\//, "");
  }

  ensureAvatarFolder();
  const safeEmail = String(email || "").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();

  if (raw.startsWith("data:")) {
    const [meta, encoded] = raw.split(",");
    if (!encoded) return "";

    const mimeMatch = String(meta || "").match(/^data:([^;]+)/i);
    const mime = String(mimeMatch?.[1] || "image/jpeg").toLowerCase();
    const extByMime = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
      "image/avif": ".avif",
    };
    const ext = normalizeExt(extByMime[mime] || ".jpg");
    const fileName = `avatar_${safeEmail}_${Date.now()}${ext}`;
    const targetPath = path.join(AVATAR_FOLDER, fileName);

    fs.writeFileSync(targetPath, Buffer.from(encoded, "base64"));
    return `avatar/${fileName}`;
  }

  if (!/^https?:\/\//i.test(raw)) return "";

  const response = await axios.get(raw, { responseType: "arraybuffer", timeout: 15000 });
  const contentType = String(response.headers?.["content-type"] || "").toLowerCase();
  let ext = ".jpg";

  if (contentType.includes("png")) ext = ".png";
  else if (contentType.includes("webp")) ext = ".webp";
  else if (contentType.includes("gif")) ext = ".gif";
  else if (contentType.includes("avif")) ext = ".avif";

  const fileName = `avatar_${safeEmail}_${Date.now()}${ext}`;
  const targetPath = path.join(AVATAR_FOLDER, fileName);

  fs.writeFileSync(targetPath, response.data);
  return `avatar/${fileName}`;
};

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
};

async function handleGetCustomers(req, res) {
  try {
    const customers = await getCustomerList();
    return res.json({ success: true, data: customers });
  } catch (error) {
    console.error("❌ Lỗi handleGetCustomers:", error);
    return res.status(500).json({ success: false, message: error.message || "Không thể tải dữ liệu khách hàng." });
  }
}

async function handleGetCustomerDetail(req, res) {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ success: false, message: "Thiếu customerId" });
    }

    const customer = await getCustomerDetail(customerId);

    if (!customer) {
      return res.status(404).json({ success: false, message: "Khách hàng không tồn tại" });
    }

    return res.json({ success: true, data: customer });
  } catch (error) {
    console.error("❌ Lỗi handleGetCustomerDetail:", error);
    return res.status(500).json({ success: false, message: error.message || "Không thể tải chi tiết khách hàng." });
  }
}

async function handleDeleteCustomer(req, res) {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ success: false, message: "Thiếu customerId" });
    }

    const result = await deleteCustomer(customerId);

    if (!result) {
      return res.status(404).json({ success: false, message: "Khách hàng không tồn tại hoặc không thể xóa" });
    }

    return res.json({ success: true, message: "Xóa khách hàng thành công" });
  } catch (error) {
    console.error("❌ Lỗi handleDeleteCustomer:", error);
    return res.status(500).json({ success: false, message: error.message || "Không thể xóa khách hàng." });
  }
}

async function handleResetCustomerPassword(req, res) {
  try {
    const { customerId } = req.params;
    const { newPassword } = req.body || {};

    if (!customerId) {
      return res.status(400).json({ success: false, message: "Thiếu customerId" });
    }

    if (!newPassword || typeof newPassword !== "string") {
      return res.status(400).json({ success: false, message: "Vui lòng nhập mật khẩu mới." });
    }

    const normalizedPassword = newPassword.trim();
    if (normalizedPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự." });
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);
    const updated = await resetCustomerPassword(customerId, hashedPassword);

    if (!updated) {
      return res.status(404).json({ success: false, message: "Khách hàng chưa có tài khoản để reset mật khẩu." });
    }

    return res.json({ success: true, message: "Đã reset mật khẩu thành công." });
  } catch (error) {
    console.error("❌ Lỗi handleResetCustomerPassword:", error);
    return res.status(500).json({ success: false, message: error.message || "Reset mật khẩu thất bại." });
  }
}

async function handleUpdateCustomer(req, res) {
  try {
    const { customerId } = req.params;
    const { fullName, phoneNumber, address } = req.body || {};

    if (!customerId) {
      return res.status(400).json({ success: false, message: "Thiếu customerId" });
    }

    const normalizedFullName = String(fullName || "").trim();
    const normalizedPhoneNumber = String(phoneNumber || "").trim();
    const normalizedAddress = String(address || "").trim();

    if (!normalizedFullName) {
      return res.status(400).json({ success: false, message: "Tên khách hàng không được để trống." });
    }

    if (!normalizedPhoneNumber) {
      return res.status(400).json({ success: false, message: "Số điện thoại không được để trống." });
    }

    if (!normalizedAddress) {
      return res.status(400).json({ success: false, message: "Địa chỉ không được để trống." });
    }

    const updated = await updateCustomerInfo({
      customerId,
      fullName: normalizedFullName,
      phoneNumber: normalizedPhoneNumber,
      address: normalizedAddress,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Khách hàng không tồn tại." });
    }

    const latestCustomer = await getCustomerDetail(customerId);

    return res.json({
      success: true,
      message: "Cập nhật thông tin khách hàng thành công.",
      data: latestCustomer,
    });
  } catch (error) {
    console.error("❌ Lỗi handleUpdateCustomer:", error);
    return res.status(500).json({ success: false, message: error.message || "Cập nhật khách hàng thất bại." });
  }
}

async function handleCreateCustomer(req, res) {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      address,
      createAccount,
      password,
      displayName,
      avatar,
      avatarUrl,
      linkGoogle,
    } = req.body || {};

    const normalizedFullName = String(fullName || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPhoneNumber = String(phoneNumber || "").trim();
    const normalizedAddress = String(address || "").trim();
    const normalizedDisplayName = String(displayName || "").trim();
    let normalizedAvatar = String(avatar || "").trim();
    const normalizedAvatarUrl = String(avatarUrl || "").trim();
    const shouldLinkGoogle = toBoolean(linkGoogle);
    const shouldCreateAccount = toBoolean(createAccount) || shouldLinkGoogle;

    if (!normalizedFullName) {
      return res.status(400).json({ success: false, message: "Tên khách hàng không được để trống." });
    }

    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: "Email không được để trống." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Email không hợp lệ." });
    }

    if (!normalizedPhoneNumber) {
      return res.status(400).json({ success: false, message: "Số điện thoại không được để trống." });
    }

    if (!normalizedAddress) {
      return res.status(400).json({ success: false, message: "Địa chỉ không được để trống." });
    }

    let hashedPassword = null;
    if (shouldCreateAccount) {
      const rawPassword = String(password || "").trim();

      if (!rawPassword && !shouldLinkGoogle) {
        return res.status(400).json({ success: false, message: "Vui lòng nhập mật khẩu khi tạo tài khoản." });
      }

      if (rawPassword && rawPassword.length < 6) {
        return res.status(400).json({ success: false, message: "Mật khẩu phải có ít nhất 6 ký tự." });
      }

      const finalPassword = rawPassword || crypto.randomBytes(24).toString("hex");
      hashedPassword = await bcrypt.hash(finalPassword, 10);

      if (req?.file) {
        normalizedAvatar = saveAvatarFromFile({ email: normalizedEmail, file: req.file });
      } else if (normalizedAvatarUrl) {
        normalizedAvatar = await saveAvatarFromUrl({ email: normalizedEmail, url: normalizedAvatarUrl });
      }
    }

    await createCustomer({
      email: normalizedEmail,
      fullName: normalizedFullName,
      phoneNumber: normalizedPhoneNumber,
      address: normalizedAddress,
      createAccount: shouldCreateAccount,
      hashedPassword,
      displayName: normalizedDisplayName || normalizedFullName,
      avatar: normalizedAvatar || null,
    });

    const latestCustomer = await getCustomerDetail(normalizedEmail);

    return res.status(201).json({
      success: true,
      message: shouldLinkGoogle
        ? "Tạo khách hàng thành công. Đã sẵn sàng đăng nhập Google bằng đúng email này."
        : "Tạo khách hàng thành công."
      ,
      data: latestCustomer,
    });
  } catch (error) {
    console.error("❌ Lỗi handleCreateCustomer:", error);
    if (String(error?.message || "").toLowerCase().includes("email đã tồn tại")) {
      return res.status(400).json({ success: false, message: "Email đã tồn tại." });
    }
    return res.status(500).json({ success: false, message: error.message || "Tạo khách hàng thất bại." });
  }
}

module.exports = {
  handleGetCustomers,
  handleGetCustomerDetail,
  handleDeleteCustomer,
  handleResetCustomerPassword,
  handleUpdateCustomer,
  handleCreateCustomer,
};