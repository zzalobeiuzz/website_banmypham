const {
  getUserByEmail,
  isEmailExist,
  createUser,
  resetPass,
  updateAvatarByEmail,
  getUserProfileByEmail,
  updateCustomerProfileByEmail,
} = require("../models/user.model");
const { generateVerificationCode } = require("../utils/authUtils");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); // ✅ thêm
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const fs = require("fs");
const path = require("path");
const { sendVerificationEmail } = require("./email.service");

const JWT_SECRET = process.env.JWT_SECRET;  // ✅ lấy từ .env
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;  // ✅ lấy từ .env
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const GOOGLE_POPUP_REDIRECT_URI = "postmessage";

const googleClient = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI || GOOGLE_POPUP_REDIRECT_URI
);

const buildAuthResponse = (user) => {
  const payload = {
    id: user.UserID,
    email: user.Email,
    name: user.DisplayName,
    profileName: user.CustomerName || user.DisplayName,
    phoneNumber: user.PhoneNumber || "",
    address: user.Address || "",
    role: user.Role,
    avatar: user.Avatar || null,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "30d" });

  return {
    message: "Đăng nhập thành công!",
    user: payload,
    accessToken,
    refreshToken,
  };
};

//==========================LOGIN=========================
exports.login = async (email, password) => {
  const user = await getUserByEmail(email);

  if (!user) {
    throw new Error("Người dùng không tồn tại.");
  }

  const isMatch = await bcrypt.compare(password, user.Password);
  if (!isMatch) {
    throw new Error("Mật khẩu không chính xác.");
  }

  return buildAuthResponse(user);
};

const getOrCreateGoogleUser = async (googlePayload) => {
  const email = String(googlePayload?.email || "").trim().toLowerCase();
  const displayName = String(googlePayload?.name || "").trim() || email.split("@")[0] || "Google User";

  if (!email || googlePayload?.email_verified !== true) {
    throw new Error("Tài khoản Google chưa xác thực email.");
  }

  let user = await getUserByEmail(email);

  if (!user) {
    const randomPassword = crypto.randomBytes(24).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    await createUser({
      email,
      password: hashedPassword,
      displayName,
      fullName: displayName,
      role: 0,
    });

    user = await getUserByEmail(email);
  }

  return user;
};

const verifyGoogleIdToken = async (idToken) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};

const exchangeGoogleCodeToIdToken = async (code) => {
  const redirectCandidates = [GOOGLE_POPUP_REDIRECT_URI, GOOGLE_REDIRECT_URI].filter(Boolean);
  let lastError = null;

  for (const redirectUri of redirectCandidates) {
    try {
      const { tokens } = await googleClient.getToken({
        code,
        redirect_uri: redirectUri,
      });
      if (tokens?.id_token) return tokens.id_token;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) throw lastError;
  throw new Error("Không lấy được id_token từ authorization code.");
};

exports.loginWithGoogle = async ({ credential, code }) => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Server chưa cấu hình GOOGLE_CLIENT_ID.");
  }

  if (!GOOGLE_CLIENT_SECRET) {
    throw new Error("Server chưa cấu hình GOOGLE_CLIENT_SECRET.");
  }

  if (!credential && !code) {
    throw new Error("Thiếu credential hoặc code từ Google.");
  }

  const idToken = credential || (await exchangeGoogleCodeToIdToken(code));
  const payload = await verifyGoogleIdToken(idToken);
  const user = await getOrCreateGoogleUser(payload);

  return buildAuthResponse(user);
};

//==========================KIỂM TRA MAIL VÀ TẠO CODE==============================
exports.checkEmailAndGenerateCode = async (email, use) => {
  const exists = await isEmailExist(email);

  if (use === "register" && exists) {
    return {
      success: false,
      message: "Email đã được sử dụng",
    };
  }

  if (use === "forgot" && !exists) {
    return {
      success: false,
      message: "❌ Email không tồn tại",
    };
  }

  const code = generateVerificationCode();
  return {
    success: true,
    code,
  };
};

//==========================GỬI MAIL XÁC THỰC==============================
exports.generateAndSendVerificationCode = async (email, use) => {
  const result = await exports.checkEmailAndGenerateCode(email, use);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  const code = result.code;

  const response = {
    success: true,
    code,
    message:
      use === "register"
        ? "✅ Mã xác thực đã được tạo. Đang gửi email..."
        : "📧 Mã khôi phục đã được gửi đến email của bạn!",
  };

  // Gửi email không blocking
  setTimeout(() => {
    sendVerificationEmail(email, code, use).catch((err) => {
      console.error("❌ Gửi email thất bại:", err.message);
    });
  }, 0);

  return response;
};

//==========================ĐĂNG KÝ==============================
exports.register = async (data) => {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    await createUser({
      ...data,
      password: hashedPassword,
    });

    return {
      success: true,
      message: "Đăng ký thành công.",
    };
  } catch (error) {
    console.error("❌ Lỗi trong service register:", error.message);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi đăng ký.",
    };
  }
};

//==========================RESET PASSWORD==============================
exports.resetPassword = async ({ email, code, newPassword, sessionData }) => {
  if (sessionData.code !== code) {
    throw new Error("Mã xác thực không đúng.");
  }

  if (sessionData.expireAt && sessionData.expireAt < Date.now()) {
    throw new Error("Mã xác thực đã hết hạn.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const result = await resetPass(email, hashedPassword);
  if (!result.success) {
    throw new Error("Không thể cập nhật mật khẩu.");
  }

  console.log(`✅ Đã đổi mật khẩu cho ${email}`);
};

exports.changePassword = async ({ email, currentPassword, newPassword }) => {
  if (!email) {
    throw new Error("Thiếu email người dùng.");
  }

  if (!currentPassword || !newPassword) {
    throw new Error("Thiếu mật khẩu hiện tại hoặc mật khẩu mới.");
  }

  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error("Không tìm thấy người dùng.");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.Password);
  if (!isMatch) {
    throw new Error("Mật khẩu hiện tại không chính xác.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const result = await resetPass(email, hashedPassword);

  return {
    success: true,
    message: result.message || "Đổi mật khẩu thành công.",
  };
};

const avatarFolder = path.join(__dirname, "../../../uploads/assets/avatar");

const ensureAvatarFolder = () => {
  if (!fs.existsSync(avatarFolder)) {
    fs.mkdirSync(avatarFolder, { recursive: true });
  }
};

const buildAvatarPath = (fileName) => `avatar/${fileName}`;

const normalizeExt = (inputExt, fallback = ".jpg") => {
  const ext = String(inputExt || "").toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"].includes(ext)) {
    return ext === ".jpeg" ? ".jpg" : ext;
  }
  return fallback;
};

const saveAvatarFromFile = async ({ email, file }) => {
  ensureAvatarFolder();

  const rawExt = path.extname(file.originalname || "") || (file.mimetype ? `.${file.mimetype.split("/")[1]}` : ".jpg");
  const ext = normalizeExt(rawExt);
  const safeEmail = email.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  const fileName = `avatar_${safeEmail}_${Date.now()}${ext}`;
  const targetPath = path.join(avatarFolder, fileName);

  await fs.promises.writeFile(targetPath, file.buffer);
  return buildAvatarPath(fileName);
};

exports.updateUserAvatar = async ({ email, file }) => {
  if (!email) {
    throw new Error("Thieu email de cap nhat avatar.");
  }

  if (!file) {
    throw new Error("Vui long tai len mot file anh avatar tu may.");
  }

  const newAvatarUrl = await saveAvatarFromFile({ email, file });

  await updateAvatarByEmail(email, newAvatarUrl);

  return {
    success: true,
    avatar: newAvatarUrl,
    message: "Cap nhat avatar thanh cong.",
  };
};

exports.updateUserProfile = async ({ email, name, phoneNumber, address }) => {
  if (!email) {
    throw new Error("Thiếu email người dùng.");
  }

  const user = await getUserProfileByEmail(email);
  if (!user) {
    throw new Error("Không tìm thấy người dùng.");
  }

  const normalizedName = name !== undefined ? String(name).trim() : undefined;
  const normalizedPhone = phoneNumber !== undefined ? String(phoneNumber).trim() : undefined;
  const normalizedAddress = address !== undefined ? String(address).trim() : undefined;

  if (name !== undefined) {
    if (!normalizedName) {
      throw new Error("Tên không được trống.");
    }
  }

  if (phoneNumber !== undefined) {
    if (!normalizedPhone) {
      throw new Error("Số điện thoại không được trống.");
    }
  }

  if (address !== undefined) {
    if (!normalizedAddress) {
      throw new Error("Địa chỉ không được trống.");
    }
  }

  if (name === undefined && phoneNumber === undefined && address === undefined) {
    throw new Error("Không có thông tin nào để cập nhật.");
  }

  await updateCustomerProfileByEmail({
    currentEmail: email,
    newEmail: email,
    name: normalizedName,
    phoneNumber: normalizedPhone,
    address: normalizedAddress,
  });

  const responseData = { success: true, message: "Cập nhật thông tin thành công." };
  if (name !== undefined) responseData.name = normalizedName;
  if (phoneNumber !== undefined) responseData.phoneNumber = normalizedPhone;
  if (address !== undefined) responseData.address = normalizedAddress;

  return responseData;
};

exports.getUserProfile = async ({ email }) => {
  if (!email) {
    throw new Error("Thiếu email người dùng.");
  }

  const profile = await getUserProfileByEmail(email);
  if (!profile) {
    throw new Error("Không tìm thấy người dùng.");
  }

  return {
    success: true,
    data: {
      email: profile.Email,
      displayName: profile.DisplayName || "",
      name: profile.Name || profile.DisplayName || "",
      phoneNumber: profile.Phone || "",
      address: profile.Address || "",
      avatar: profile.Avatar || null,
      role: profile.Role,
    },
  };
};

exports.updateUserProfileFull = async ({ currentEmail, email, name, phoneNumber, address }) => {
  if (!currentEmail) {
    throw new Error("Thiếu email người dùng.");
  }

  const normalizedEmail = email !== undefined ? String(email).trim().toLowerCase() : currentEmail;
  const normalizedName = name !== undefined ? String(name).trim() : undefined;
  const normalizedPhone = phoneNumber !== undefined ? String(phoneNumber).trim() : undefined;
  const normalizedAddress = address !== undefined ? String(address).trim() : undefined;

  if (!normalizedEmail) {
    throw new Error("Email không hợp lệ.");
  }

  if (name !== undefined && !normalizedName) {
    throw new Error("Tên không được trống.");
  }

  if (phoneNumber !== undefined && !normalizedPhone) {
    throw new Error("Số điện thoại không được trống.");
  }

  if (address !== undefined && !normalizedAddress) {
    throw new Error("Địa chỉ không được trống.");
  }

  await updateCustomerProfileByEmail({
    currentEmail,
    newEmail: normalizedEmail,
    name: normalizedName,
    phoneNumber: normalizedPhone,
    address: normalizedAddress,
  });

  const requiresReLogin = normalizedEmail !== String(currentEmail).trim().toLowerCase();

  return {
    success: true,
    message: "Cập nhật thông tin thành công.",
    email: normalizedEmail,
    name: normalizedName,
    phoneNumber: normalizedPhone,
    address: normalizedAddress,
    requiresReLogin,
  };
};
