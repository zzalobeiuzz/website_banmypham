const {
  login,
  loginWithGoogle,
  loginWithFacebook,
  checkEmailAndGenerateCode,
  register,
  generateAndSendVerificationCode,
  resetPassword,
  updateUserAvatar,
  changePassword,
  updateUserProfileFull,
  getUserProfile,
} = require("../services/auth.service");

//================= Xử lý đăng nhập =================
exports.loginHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);

    res.status(200).json(result);
    console.log("✅ Đăng nhập thành công");
  } catch (err) {
    console.error("❌ Lỗi khi đăng nhập:", err.message);

    if (
      err.message === "Người dùng không tồn tại." ||
      err.message === "Mật khẩu không chính xác."
    ) {
      return res.status(401).json({ message: err.message });
    }

    res.status(500).json({ message: "Lỗi server khi đăng nhập." });
  }
};

exports.googleLoginHandler = async (req, res) => {
  try {
    const { credential, code } = req.body || {};
    const result = await loginWithGoogle({ credential, code });
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ Lỗi đăng nhập Google:", err.message);
    return res.status(401).json({ message: err.message || "Đăng nhập Google thất bại." });
  }
};

exports.facebookLoginHandler = async (req, res) => {
  try {
    const { accessToken, facebookProfile } = req.body || {};
    const result = await loginWithFacebook({ accessToken, facebookProfile });
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ Lỗi đăng nhập Facebook:", err.message);
    return res.status(401).json({ message: err.message || "Đăng nhập Facebook thất bại." });
  }
};

//================= Xử lý đăng ký =================
exports.registerHandler = async (req, res) => {
  try {
    const cleanEmail = String(req.body?.email || "").trim().toLowerCase();
    const cleanCode = String(req.body?.verificationCode || "").trim();

    if (!cleanEmail || !cleanCode) {
      return res.status(400).json({
        success: false,
        message: "Thiếu email hoặc mã xác thực.",
      });
    }

    // Khi đăng ký, mã xác thực cũng được lưu trong session giống luồng quên mật khẩu.
    // Backend lấy mã trong session ra để so, frontend không được tự giữ mã server trả về.
    const verifications = req.session.verifications || {};
    const sessionData = verifications[cleanEmail];

    if (!sessionData) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy mã xác thực cho email này.",
      });
    }

    if (String(sessionData.code || "").trim() !== cleanCode) {
      return res.status(400).json({
        success: false,
        message: "Mã xác thực không đúng.",
      });
    }

    if (sessionData.expireAt && sessionData.expireAt < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Mã xác thực đã hết hạn.",
      });
    }

    const result = await register({
      ...req.body,
      email: cleanEmail,
    });

    if (!result?.success) {
      return res.status(400).json(result);
    }

    // Đăng ký thành công thì xoá mã khỏi session để mã không thể dùng lại.
    delete req.session.verifications[cleanEmail];

    req.session.save((err) => {
      if (err) {
        console.error("❌ Lỗi khi lưu session sau đăng ký:", err);
        return res.status(500).json({ success: false, message: "Lỗi khi lưu session." });
      }

      res.status(200).json(result);
    });
    console.log("✅ Đăng ký thành công");
  } catch (err) {
    console.error("❌ Lỗi khi đăng ký:", err.message);
    res.status(500).json({ success: false, message: "Lỗi server khi đăng ký." });
  }
};

//================= Xử lý gửi mã xác thực =================
exports.sendVerificationCode = async (req, res) => {
  const { email, use } = req.body;
  const cleanEmail = String(email || "").trim().toLowerCase();

  // Check thiếu field
  if (!cleanEmail || !use) {
    return res.status(400).json({
      success: false,
      message: "Thiếu email hoặc mục đích (use).",
    });
  }

  try {
    // Gọi service (service đã gửi email luôn)
    const result = await generateAndSendVerificationCode(cleanEmail, use);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    const code = result.code;

    // Tạo vùng lưu mã xác thực trong session nếu phiên hiện tại chưa có.
    // Dữ liệu này nằm trong req.session và sẽ được store session ghi xuống SQL Server.
    if (!req.session.verifications) {
      req.session.verifications = {};
    }

    // Lưu mã xác thực theo email để lát nữa so với mã người dùng nhập.
    // Vì session đang cấu hình MSSQLStore, khi gọi req.session.save()
    // dữ liệu này sẽ được lưu vào bảng "sessions" trong database, không lưu vào bảng OTP riêng.
    req.session.verifications[cleanEmail] = {
      code,
      expireAt: Date.now() + 15 * 60 * 1000, // Mã chỉ có hiệu lực trong 15 phút.
    };

    // Ghi session xuống store. Với cấu hình hiện tại, store là SQL Server bảng "sessions".
    req.session.save((err) => {
      if (err) {
        console.error("❌ Lỗi lưu session:", err);
        return res.status(500).json({ success: false, message: "Lỗi lưu session." });
      }

      const responsePayload = {
        success: true,
        message: result.message,
      };

      res.status(200).json(responsePayload);
    });
  } catch (err) {
    console.error("❌ Lỗi xử lý sendVerificationCode:", err.message);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi phía server.",
    });
  }
};

//================= Xử lý reset password =================
exports.resetPasswordHandler = async (req, res) => {
  try {
    const { code, newPassword, email } = req.body;

    // Check thiếu trường
    if (!code || !newPassword || !email) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin cần thiết." });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = String(code || "").trim();
    // Lấy mã đã lưu trong session theo email người dùng.
    // Nếu không có dữ liệu này thì có thể session đã hết hạn, email chưa gửi mã,
    // hoặc request reset không dùng cùng session/cookie với request gửi mã.
    const verifications = req.session.verifications || {};
    const sessionData = verifications[cleanEmail];
    if (!sessionData) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy mã xác thực cho email này123123.",
      });
    }

    // Gọi service để kiểm tra mã, kiểm tra hạn dùng, sau đó mới hash và cập nhật mật khẩu trong DB.
    await resetPassword({
      email: cleanEmail,
      code: cleanCode,
      newPassword,
      sessionData,
    });

    // Đổi mật khẩu xong thì xoá mã khỏi session để mã không thể dùng lại lần nữa.
    delete req.session.verifications[cleanEmail];

    // Lưu lại session sau khi đã xoá mã xác thực.
    req.session.save((err) => {
      if (err) {
        console.error("❌ Lỗi khi lưu session sau xóa:", err);
        return res.status(500).json({ success: false, message: "Lỗi khi lưu session." });
      }

      return res.status(200).json({ success: true, message: "Đổi mật khẩu thành công!" });
    });
  } catch (err) {
    console.error("❌ Lỗi reset password:", err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateAvatarHandler = async (req, res) => {
  try {
    const email = req.user?.email;
    const file = req.file;
    const avatarUrl = req.body?.avatarUrl;

    const result = await updateUserAvatar({ email, file, avatarUrl });
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ Lỗi cập nhật avatar:", err.message);
    return res.status(400).json({ message: err.message || "Cập nhật avatar thất bại." });
  }
};

exports.changePasswordHandler = async (req, res) => {
  try {
    const email = req.user?.email;
    const { currentPassword, newPassword } = req.body || {};

    const result = await changePassword({ email, currentPassword, newPassword });
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ Lỗi đổi mật khẩu:", err.message);
    return res.status(400).json({ message: err.message || "Đổi mật khẩu thất bại." });
  }
};

exports.updateProfileHandler = async (req, res) => {
  try {
    const currentEmail = req.user?.email;
    const { email, name, phoneNumber, address } = req.body || {};

    const result = await updateUserProfileFull({
      currentEmail,
      email,
      name,
      phoneNumber,
      address,
    });
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ Lỗi cập nhật hồ sơ:", err.message);
    return res.status(400).json({ message: err.message || "Cập nhật hồ sơ thất bại." });
  }
};

exports.getProfileHandler = async (req, res) => {
  try {
    const email = req.user?.email;
    const result = await getUserProfile({ email });
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ Lỗi lấy hồ sơ:", err.message);
    return res.status(400).json({ message: err.message || "Lấy hồ sơ thất bại." });
  }
};
