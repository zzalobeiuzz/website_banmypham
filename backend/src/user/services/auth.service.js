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
const axios = require("axios");
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
const FACEBOOK_GRAPH_API = "https://graph.facebook.com/me";
const AVATAR_FOLDER = path.join(__dirname, "../../../uploads/assets/avatar");

const googleClient = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI || GOOGLE_POPUP_REDIRECT_URI
);

// 📁 Đảm bảo thư mục lưu avatar Facebook tồn tại trước khi ghi file.
const ensureFacebookAvatarFolder = async () => {
  await fs.promises.mkdir(AVATAR_FOLDER, { recursive: true });
};

// 🖼️ Suy luận phần mở rộng ảnh từ header content-type.
const getImageExtensionFromHeaders = (contentType, fallback = ".jpg") => {
  const type = String(contentType || "").toLowerCase();
  if (type.includes("image/png")) return ".png";
  if (type.includes("image/webp")) return ".webp";
  if (type.includes("image/gif")) return ".gif";
  if (type.includes("image/avif")) return ".avif";
  if (type.includes("image/jpeg") || type.includes("image/jpg")) return ".jpg";
  return fallback;
};

// 🧹 Dọn các file avatar Facebook cũ cùng id để tránh tích lũy file rác.
const clearLegacyFacebookAvatarFiles = async ({ facebookId, keepFileName }) => {
  const id = String(facebookId || "").trim();
  if (!id) return;

  try {
    const files = await fs.promises.readdir(AVATAR_FOLDER);
    const prefix = `avatar_fb_${id}`;

    await Promise.all(
      files
        .filter((name) => {
          if (!name.startsWith(prefix)) return false;
          return name !== keepFileName;
        })
        .map((name) => fs.promises.unlink(path.join(AVATAR_FOLDER, name)).catch(() => null))
    );
  } catch (error) {
    // Ignore cleanup errors to avoid interrupting login.
  }
};

// ⬇️ Tải avatar Facebook về local và trả đường dẫn tương đối để lưu DB.
const downloadFacebookAvatarToLocal = async ({ facebookId, avatarUrl }) => {
  const id = String(facebookId || "").trim();
  const url = String(avatarUrl || "").trim();
  if (!id || !/^https?:\/\//i.test(url)) return "";

  try {
    await ensureFacebookAvatarFolder();

    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 12000,
    });

    const ext = getImageExtensionFromHeaders(response?.headers?.["content-type"], ".jpg");
    const fileName = `avatar_fb_${id}${ext}`;
    const filePath = path.join(AVATAR_FOLDER, fileName);

    await clearLegacyFacebookAvatarFiles({ facebookId: id, keepFileName: fileName });
    await fs.promises.writeFile(filePath, response.data);
    return `avatar/${fileName}`;
  } catch (error) {
    return "";
  }
};

// 🔎 Kiểm tra avatar có phải đường dẫn local dạng avatar/... hay không.
const isLocalAvatarPath = (value) => /^avatar\//i.test(String(value || "").trim());

// 🎫 Chuẩn hóa dữ liệu trả về sau đăng nhập + tạo access/refresh token.
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
// 🔐 Đăng nhập bằng email/mật khẩu truyền thống.
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

// 🟢 Lấy hoặc tạo user từ payload Google (bắt buộc email đã verify).
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

// 🔍 Verify id_token Google tại backend.
const verifyGoogleIdToken = async (idToken) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};

// 🔁 Đổi authorization code Google sang id_token (thử nhiều redirect_uri).
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

// 🌐 Đăng nhập Google: nhận credential/code -> verify -> lấy/tạo user -> cấp token hệ thống.
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

// 🌐 Verify access token Facebook và lấy profile chuẩn từ Graph API.
const verifyFacebookAccessToken = async (accessToken) => {
  const token = String(accessToken || "").trim();
  if (!token) {
    throw new Error("Thiếu accessToken từ Facebook.");
  }

  const response = await axios.get(FACEBOOK_GRAPH_API, {
    params: {
      fields: "id,name,email,picture.width(256).height(256)",
      access_token: token,
    },
    timeout: 10000,
  });

  const payload = response?.data || null;
  if (!payload) return null;

  // Fallback ảnh đại diện theo Facebook id khi picture.data.url không có.
  if (!payload?.picture?.data?.url && payload?.id) {
    payload.picture = {
      data: {
        url: `https://graph.facebook.com/${payload.id}/picture?type=large`,
      },
    };
  }

  return payload;
};

// 🟦 Lấy hoặc tạo user từ Facebook payload.
// Nếu thiếu email thật thì fallback email ảo facebook.local để vẫn đăng nhập được.
const getOrCreateFacebookUser = async (facebookPayload) => {
  const facebookId = String(facebookPayload?.id || "").trim();
  const emailFromFacebook = String(facebookPayload?.email || "").trim().toLowerCase();
  const placeholderEmail = facebookId ? `${facebookId}@facebook.local` : "";
  const email = emailFromFacebook || placeholderEmail;
  const displayName = String(facebookPayload?.name || "").trim() || "Facebook User";
  const payloadAvatarUrl = String(facebookPayload?.picture?.data?.url || "").trim();
  const avatarUrl =
    payloadAvatarUrl ||
    (facebookId ? `https://graph.facebook.com/${facebookId}/picture?type=large` : "");
  const avatar = (await downloadFacebookAvatarToLocal({ facebookId, avatarUrl })) || avatarUrl;

  if (!email) {
    throw new Error("Không lấy được thông tin tài khoản Facebook hợp lệ để đăng nhập.");
  }

  let user = await getUserByEmail(email);

  // Nếu user cũ dùng email ảo và lần sau Facebook trả email thật thì nâng cấp sang email thật.
  if (!user && emailFromFacebook && placeholderEmail) {
    const placeholderUser = await getUserByEmail(placeholderEmail);
    if (placeholderUser) {
      try {
        await updateCustomerProfileByEmail({
          currentEmail: placeholderEmail,
          newEmail: emailFromFacebook,
        });
      } catch (error) {
        // Bỏ qua nếu email thật đã tồn tại ở tài khoản khác.
      }

      user = await getUserByEmail(emailFromFacebook) || placeholderUser;
    }
  }

  if (!user) {
    const randomPassword = crypto.randomBytes(24).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    await createUser({
      email,
      password: hashedPassword,
      displayName,
      fullName: displayName,
      avatar,
      role: 0,
    });

    user = await getUserByEmail(email);
  }

  // Đồng bộ avatar Facebook mỗi lần đăng nhập nếu có avatar mới.
  if (user && avatar && String(user.Avatar || "").trim() !== avatar) {
    try {
      await updateAvatarByEmail(String(user.Email || email), avatar);
      user.Avatar = avatar;
    } catch (error) {
      // Không chặn luồng đăng nhập nếu cập nhật avatar thất bại.
    }
  }

  return user;
};

// 🌐 Đăng nhập Facebook: ưu tiên dữ liệu verify từ server, đồng bộ avatar local rồi cấp token.
exports.loginWithFacebook = async ({ accessToken, facebookProfile }) => {
  const apiPayload = await verifyFacebookAccessToken(accessToken);
  const profileObj = facebookProfile && typeof facebookProfile === "object" ? facebookProfile : {};
  const apiId = String(apiPayload?.id || "").trim();
  const profileId = String(profileObj?.id || "").trim();
  // Always trust server-verified id first; client profile is fallback only.
  const resolvedId = apiId || profileId;

  const profilePictureUrl = String(profileObj?.picture?.data?.url || "").trim();
  const apiPictureUrl = String(apiPayload?.picture?.data?.url || "").trim();
  const resolvedPictureUrl =
    apiPictureUrl ||
    profilePictureUrl ||
    (resolvedId ? `https://graph.facebook.com/${resolvedId}/picture?type=large` : "");

  const mergedPayload = {
    ...(profileObj || {}),
    ...(apiPayload || {}),
    id: resolvedId,
    picture: resolvedPictureUrl
      ? {
          data: {
            url: resolvedPictureUrl,
          },
        }
      : undefined,
    email:
      String(apiPayload?.email || "").trim().toLowerCase() ||
      String(profileObj?.email || "").trim().toLowerCase() ||
      "",
  };

  const payload = mergedPayload;
  const user = await getOrCreateFacebookUser(payload);

  // Always try to refresh avatar from Facebook and keep local avatar path in DB.
  const refreshAvatarUrl = String(payload?.picture?.data?.url || "").trim() ||
    (payload?.id ? `https://graph.facebook.com/${payload.id}/picture?type=large` : "");
  const refreshedLocalAvatar = await downloadFacebookAvatarToLocal({
    facebookId: payload?.id,
    avatarUrl: refreshAvatarUrl,
  });

  if (refreshedLocalAvatar && String(user?.Email || "").trim()) {
    const shouldPersistLocal =
      !isLocalAvatarPath(user.Avatar) || String(user.Avatar || "").trim() !== refreshedLocalAvatar;

    if (shouldPersistLocal) {
      try {
        await updateAvatarByEmail(String(user.Email).trim(), refreshedLocalAvatar);
      } catch (error) {
        // Ignore avatar update failures and continue login.
      }
    }

    user.Avatar = refreshedLocalAvatar;
  }

  // Fallback dữ liệu trả về token ngay cả khi DB chưa đồng bộ kịp.
  const rawFallbackAvatar = String(payload?.picture?.data?.url || "").trim();
  const fallbackAvatar = refreshedLocalAvatar || rawFallbackAvatar;
  const fallbackEmail = String(payload?.email || (payload?.id ? `${payload.id}@facebook.local` : "")).trim().toLowerCase();

  if (!String(user?.Avatar || "").trim() && fallbackAvatar) {
    user.Avatar = fallbackAvatar;
  }

  if (!String(user?.Email || "").trim() && fallbackEmail) {
    user.Email = fallbackEmail;
  }

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
  // Trước khi tạo code, kiểm tra email và mục đích sử dụng hợp lệ
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
// 📝 Đăng ký tài khoản mới bằng thông tin người dùng nhập.
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
// 🔁 Đổi mật khẩu theo luồng quên mật khẩu (xác minh bằng code/session).
exports.resetPassword = async ({ email, code, newPassword, sessionData }) => {
  // So mã người dùng nhập với mã đã lấy từ session ở controller.
  // Mã này không lấy từ frontend/server response, mà lấy từ session lưu trong bảng "sessions".
  if (String(sessionData.code || "").trim() !== String(code || "").trim()) {
    throw new Error("Mã xác thực không đúng.");
  }

  // Chặn đổi mật khẩu nếu mã đã quá thời hạn 15 phút.
  if (sessionData.expireAt && sessionData.expireAt < Date.now()) {
    throw new Error("Mã xác thực đã hết hạn.");
  }

  // Chỉ khi mã hợp lệ mới hash mật khẩu mới và cập nhật vào bảng ACCOUNT.
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const result = await resetPass(email, hashedPassword);
  if (!result.success) {
    throw new Error("Không thể cập nhật mật khẩu.");
  }

  console.log(`✅ Đã đổi mật khẩu cho ${email}`);
};

// 🔒 Đổi mật khẩu khi đã đăng nhập (xác thực mật khẩu hiện tại trước).
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

// 📁 Đảm bảo thư mục avatar user tồn tại.
const ensureAvatarFolder = () => {
  if (!fs.existsSync(avatarFolder)) {
    fs.mkdirSync(avatarFolder, { recursive: true });
  }
};

const buildAvatarPath = (fileName) => `avatar/${fileName}`;

// 🧩 Chuẩn hóa đuôi file avatar hợp lệ.
const normalizeExt = (inputExt, fallback = ".jpg") => {
  const ext = String(inputExt || "").toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"].includes(ext)) {
    return ext === ".jpeg" ? ".jpg" : ext;
  }
  return fallback;
};

// 💾 Lưu avatar upload từ client vào local storage và trả path lưu DB.
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

// 👤 Cập nhật avatar user (API upload avatar cá nhân).
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

// 👤 Cập nhật nhanh hồ sơ người dùng (name/phone/address).
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

// 📄 Lấy hồ sơ người dùng theo email.
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

// 🧾 Cập nhật đầy đủ hồ sơ; nếu đổi email thì yêu cầu đăng nhập lại.
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
