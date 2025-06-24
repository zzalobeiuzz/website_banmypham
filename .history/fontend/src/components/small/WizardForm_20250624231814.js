// 📦 Import các thư viện cần thiết
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.scss";

const WizardForm = () => {
  // 🧠 Quản lý các trạng thái (state)
  const [step, setStep] = useState(1); // Bước hiện tại của form
  const [showPassword, setShowPassword] = useState(false); // Hiện/ẩn mật khẩu
  const [verificationCode, setVerificationCode] = useState(""); // Mã người dùng nhập
  const [sentCode, setSentCode] = useState(""); // Mã đã gửi từ server
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // Hiện thông báo thành công
  const [resendCooldown, setResendCooldown] = useState(180); // Đếm ngược gửi lại mã
  const [emailError, setEmailError] = useState(null); // Lỗi nếu email đã dùng

  // 📝 Dữ liệu từ form đăng ký
  const [formData, setFormData] = useState({
    account: {
      email: "",
      displayName: "",
      password: "",
    },
    personal: {
      fullName: "",
      phoneNumber: "",
      address: "",
    },
  });

  const navigate = useNavigate(); // Điều hướng sau đăng ký thành công

  // 📧 Kiểm tra định dạng email
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // 📥 Cập nhật dữ liệu form khi người dùng nhập
  const handleChange = (section) => (e) => {
    const { name, value } = e.target;

    // Nếu người dùng đang thay đổi email, reset lỗi
    if (section === "account" && name === "email") {
      setEmailError(null);
    }

    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value,
      },
    }));
  };

  // ✅ Kiểm tra đã điền đầy đủ bước 2
  const isStepTwoComplete = () =>
    formData.personal.fullName.trim() !== "" &&
    formData.personal.phoneNumber.trim() !== "";

  // 👉 Chuyển bước tiếp theo khi hợp lệ
  const handleNext = () => {
    if (step === 1) {
      const { email, displayName, password } = formData.account;
      if (!email.trim() || !displayName.trim() || !password.trim()) {
        alert("Vui lòng nhập đầy đủ thông tin ở bước 1");
        return;
      }
      if (!isValidEmail(email)) {
        alert("Email không hợp lệ");
        setFormData((prev) => ({
          ...prev,
          account: { ...prev.account, email: "" },
        }));
        return;
      }
    }

    if (step === 2 && !isStepTwoComplete()) {
      alert("Vui lòng nhập đầy đủ thông tin ở bước 2");
      return;
    }

    setStep((prev) => prev + 1);
  };

  // 🔙 Quay lại bước trước
  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  // 📨 Gửi mã xác thực đến email người dùng
  const handleSubmitEmail = async (e) => {
    e.preventDefault();

    const payload = { email: formData.account.email };

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/sendVerificationCode",
        payload
      );
      const { success, message, code } = response.data;

      if (success) {
        alert("✅ Mã xác thực đã được gửi về email của bạn.");
        setSentCode(code);
        setStep(4);
      } else {
        setEmailError(message); // Gắn lỗi dưới bước 3
      }
    } catch (error) {
      console.error("❌ Lỗi gửi email xác thực:", error);
      alert(
        error.response?.data?.message || "Đã xảy ra lỗi khi gửi email xác thực."
      );
    }
  };

  // 🧾 Gửi dữ liệu đăng ký sau khi xác thực thành công
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData.account,
      ...formData.personal,
      role: 0, // 👤 Gán quyền mặc định là user
    };

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const fakeCode = "123456"; // Giả lập mã xác thực nếu cần
        setSentCode(fakeCode);
        setStep(4);
      } else {
        const data = await response.json();
        alert(data.message || "Đăng ký thất bại.");
      }
    } catch (err) {
      console.error("Lỗi gửi đăng ký:", err);
      alert("Đã xảy ra lỗi khi gửi dữ liệu đăng ký.");
    }
  };

  // 🔁 Gửi lại mã xác thực + đặt lại thời gian chờ
  const handleResendCode = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(newCode);
    alert(
      `Mã xác thực mới đã được gửi đến ${formData.account.email}\n(Mã: ${newCode})`
    );
    setResendCooldown(120);
  };

  // ⏳ Đếm ngược thời gian chờ gửi lại mã
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // 📦 Trả ra giao diện JSX (nằm ở phần return phía dưới)
  return (
    // 🧾 Giao diện chính của form đăng ký nhiều bước
    <div className="registration-form">
      {/* 🔢 Header các bước đăng ký (Step indicator) */}
      <div className="steps-container">
        <div className="step-line" />
        {[1, 2, 3].map((s) => (
          <div key={s} onClick={() => setStep(s)} style={{ cursor: "pointer" }}>
            <div className={`circle ${step === s ? "active" : "inactive"}`}>
              {step > s ? "✓" : s} {/* ✅ Hiện dấu tick nếu đã hoàn thành */}
            </div>
            Bước {s}
          </div>
        ))}
      </div>

      {/* 📦 Nội dung tương ứng theo từng bước */}
      <div className="step-content">
        {/* 🧾 Bước 1: Thông tin tài khoản */}
        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNext();
            }}
          >
            <h3>Thông tin tài khoản</h3>
            {/* 🔐 Các trường nhập: email, tên hiển thị, mật khẩu */}
            {["email", "displayName", "password"].map((field) =>
              field === "password" ? (
                <div key={field} className="password-input-wrapper">
                  <input
                    className="input-field password-input"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Mật khẩu"
                    value={formData.account.password}
                    onChange={handleChange("account")}
                    required
                  />
                  {/* 👁️ Toggle hiển thị mật khẩu */}
                  <span
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <img
                      src={
                        showPassword
                          ? "./assets/icons/icons8-eye-48.png"
                          : "./assets/icons/icons8-hide-64.png"
                      }
                      alt="toggle password"
                    />
                  </span>
                </div>
              ) : (
                <input
                  key={field}
                  className="input-field"
                  type="text"
                  name={field}
                  placeholder={field === "email" ? "Email" : "Tên hiển thị"}
                  value={formData.account[field]}
                  onChange={handleChange("account")}
                  required
                />
              )
            )}

            <button type="submit" className="btn">
              Tiếp theo
            </button>

            {/* 🌐 Đăng ký với mạng xã hội */}
            <div className="sign-up-social">
              <span>Đăng ký với</span>
              <div className="social-buttons">
                {["google", "facebook"].map((name) => (
                  <button key={name} className={`social ${name}`} type="button">
                    <img
                      src={`./assets/icons/icons8-${name}-24.png`}
                      alt={name}
                    />
                  </button>
                ))}
              </div>

              {/* 🔁 Chuyển về đăng nhập nếu đã có tài khoản */}
              <span className="return-login">
                Bạn đã có tài khoản?{" "}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => navigate("/", { state: { showLogin: true } })}
                >
                  Đăng nhập
                </button>
              </span>
            </div>
          </form>
        )}

        {/* 🧍‍♂️ Bước 2: Thông tin cá nhân */}
        {step === 2 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNext();
            }}
          >
            <h3>Thông tin cá nhân</h3>
            {["fullName", "phoneNumber", "address"].map((field) => (
              <input
                key={field}
                className="input-field"
                type="text"
                name={field}
                placeholder={
                  field === "fullName"
                    ? "Họ và tên"
                    : field === "phoneNumber"
                    ? "Số điện thoại"
                    : "Địa chỉ"
                }
                value={formData.personal[field]}
                onChange={handleChange("personal")}
                required={field !== "address"}
              />
            ))}
            <div className="button-group">
              <button type="button" className="btn" onClick={handleBack}>
                Quay lại
              </button>
              <button type="submit" className="btn">
                Tiếp theo
              </button>
            </div>
          </form>
        )}

        {/* 🔍 Bước 3: Xác nhận thông tin trước khi gửi email */}
        {step === 3 && (
          <form onSubmit={handleSubmitEmail}>
            <h3>Xác nhận thông tin</h3>
            <ul>
              {Object.entries(formData.account).map(([k, v]) => (
                <li key={k}>
                  <strong>{k}:</strong> {v}
                </li>
              ))}
              {Object.entries(formData.personal).map(([k, v]) => (
                <li key={k}>
                  <strong>{k}:</strong> {v}
                </li>
              ))}
            </ul>
            {/* ⚠️ Hiển thị lỗi nếu email đã tồn tại */}
            {emailError && (
              <p
                className="text-error"
                style={{ color: "red", marginTop: "10px" }}
              >
                ❌ {emailError}
              </p>
            )}
            <div className="button-group">
              <button type="button" className="btn" onClick={handleBack}>
                Quay lại
              </button>
              <button type="submit" className="btn">
                Xác nhận
              </button>
            </div>
          </form>
        )}

        {/* 📧 Bước 4: Nhập mã xác thực đã gửi về email */}
        {step === 4 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (verificationCode === sentCode) {
                setShowSuccessMessage(true);
                handleSubmit(); // ✅ Gửi dữ liệu đăng ký
              } else {
                alert("Mã xác thực không đúng. Vui lòng kiểm tra lại email.");
              }
            }}
          >
            <h3>Xác thực Email</h3>
            <p>
              Mã xác thực đã được gửi đến{" "}
              <strong>{formData.account.email}</strong>.
            </p>

            <input
              className="input-field"
              type="text"
              placeholder="Nhập mã xác thực"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
            />

            {/* 🔁 Gửi lại mã nếu người dùng chưa nhận */}
            <div className="resend-code">
              <button
                type="button"
                className="link-button resend-btn"
                onClick={handleResendCode}
                disabled={resendCooldown > 0}
              >
                {resendCooldown > 0
                  ? `Gửi lại mã (${resendCooldown}s)`
                  : "Gửi lại mã"}
              </button>
            </div>

            {/* 🎯 Nút hoàn tất đăng ký hoặc hiển thị thành công */}
            <div className="button-group">
              {!showSuccessMessage ? (
                <>
                  <button type="button" className="btn" onClick={handleBack}>
                    Quay lại
                  </button>
                  <button type="submit" className="btn">
                    Hoàn tất
                  </button>
                </>
              ) : (
                <div className="success-message">
                  <p>🎉 Đăng ký thành công!</p>
                  <button
                    className="btn ok-btn"
                    onClick={() =>
                      navigate("/", { state: { showLogin: true } })
                    }
                  >
                    Đăng nhập ngay
                  </button>
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default WizardForm;
