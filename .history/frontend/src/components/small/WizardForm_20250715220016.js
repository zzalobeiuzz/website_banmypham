// 📦 Import các thư viện cần thiết
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../constants";
import useHttp from "../../hooks/useHttp";
import "./wizardForm.scss";

const WizardForm = () => {
  const { request } = useHttp();

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailError, setEmailError] = useState(null);
  const [verificationError, setVerificationError] = useState("");

  const labelMap = {
    email: "Email",
    displayName: "Tên hiển thị",
    password: "Mật khẩu",
    fullName: "Họ và tên",
    phoneNumber: "Số điện thoại",
    address: "Địa chỉ",
  };

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

  const navigate = useNavigate();

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (section) => (e) => {
    const { name, value } = e.target;
    if (section === "account" && name === "email") {
      setResendCooldown(0);
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

  const isStepTwoComplete = () =>
    formData.personal.fullName.trim() !== "" && formData.personal.phoneNumber.trim() !== "";

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

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const handleSubmitEmail = async () => {
    const payload = { email: formData.account.email, use: "register" };
    setEmailError(null);
    setSentCode("");
    try {
      const response = await request("POST", `${API_BASE}/api/user/auth/sendVerificationCode`, payload);
      const { success, message, code } = response;
      if (success) {
        setSentCode(code);
        setStep(4);
        setResendCooldown(120);
      } else {
        setEmailError(message);
        setStep(3);
      }
    } catch (error) {
      console.error("❌ Lỗi gửi email xác thực:", error);
      alert(error.response?.data?.message || "Đã xảy ra lỗi khi gửi email xác thực.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData.account,
      ...formData.personal,
      role: 0,
    };
    try {
      const response = await request("POST", `${API_BASE}/api/user/auth/register`, payload);
      if (response?.success) {
        setShowSuccessMessage(true);
      } else {
        alert(response?.message || "Đăng ký thất bại.");
      }
    } catch (err) {
      console.error("Lỗi gửi đăng ký:", err);
      alert("Đã xảy ra lỗi khi gửi dữ liệu đăng ký.");
    }
  };

  const handleResendCode = async () => {
    await handleSubmitEmail();
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  return (
    <div className="registration-form">
      <div className="steps-container">
        <div className="step-line" />
        {[1, 2, 3].map((s) => (
          <div key={s} onClick={() => setStep(s)} style={{ cursor: "pointer" }}>
            <div className={`circle ${step === s ? "active" : "inactive"}`}>{step > s ? "✓" : s}</div>
            Bước {s}
          </div>
        ))}
      </div>

      <div className="step-content">
        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNext();
            }}
          >
            <h3>Thông tin tài khoản</h3>
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
                  <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    <img
                      src={
                        showPassword
                          ? `${UPLOAD_BASE}/icons/icons8-eye-48.png`
                          : `${UPLOAD_BASE}/icons/icons8-hide-64.png`
                      }
                      alt="toggle password"
                      loading="lazy"
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

            <button type="submit" className="btn">Tiếp theo</button>

            <div className="sign-up-social">
              <span>Đăng ký với</span>
              <div className="social-buttons">
                {["google", "facebook"].map((name) => (
                  <button key={name} className={`social ${name}`} type="button">
                    <img
                      src={`${UPLOAD_BASE}/icons/icons8-${name}-24.png`}
                      alt={name}
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
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
              <button type="button" className="btn" onClick={handleBack}>Quay lại</button>
              <button type="submit" className="btn">Tiếp theo</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitEmail();
            }}
          >
            <h3>Xác nhận thông tin</h3>
            <ul>
              {Object.entries(formData.account).map(([k, v]) => (
                <li key={k}>
                  <strong>{labelMap[k] || k}:</strong> {v}
                </li>
              ))}
              {Object.entries(formData.personal).map(([k, v]) => (
                <li key={k}>
                  <strong>{labelMap[k] || k}:</strong> {v}
                </li>
              ))}
            </ul>
            {emailError && (
              <p className="text-error" style={{ color: "red", marginTop: "10px" }}>❌ {emailError}</p>
            )}
            <div className="button-group">
              <button type="button" className="btn" onClick={handleBack}>Quay lại</button>
              <button type="submit" className="btn">Xác nhận & gửi mã</button>
            </div>
          </form>
        )}

        {step === 4 && (
          <>
            {!showSuccessMessage ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (verificationCode === sentCode) {
                    handleSubmit(e);
                  } else {
                    setVerificationError("Mã xác thực không đúng. Vui lòng kiểm tra lại email.");
                  }
                }}
              >
                <h3>Xác thực Email</h3>
                <p>Mã xác thực đã được gửi đến <strong>{formData.account.email}</strong>.</p>
                <input
                  className="input-field"
                  type="text"
                  placeholder="Nhập mã xác thực"
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value);
                    setVerificationError("");
                  }}
                  required
                />
                <div className="resend-code">
                  <button
                    type="button"
                    className="link-button resend-btn"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0}
                  >
                    {resendCooldown > 0 ? `Gửi lại mã (${resendCooldown}s)` : "Gửi lại mã"}
                  </button>
                </div>
                {verificationError && (
                  <p className="text-error" style={{ color: "red", marginTop: "10px" }}>
                    ❌ {verificationError}
                  </p>
                )}
                <div className="button-group">
                  <button type="button" className="btn" onClick={handleBack}>Quay lại</button>
                  <button type="submit" className="btn">Hoàn tất</button>
                </div>
              </form>
            ) : (
              <div className="success-message">
                <p>🎉 Đăng ký thành công!</p>
                <button className="btn ok-btn" onClick={() => navigate("/", { state: { showLogin: true } })}>
                  Đăng nhập ngay
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WizardForm;
