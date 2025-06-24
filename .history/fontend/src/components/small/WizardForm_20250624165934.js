import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.scss";

const WizardForm = () => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(120);

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

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (section) => (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value,
      },
    }));
  };

  const isStepOneComplete = () => {
    const { email, displayName, password } = formData.account;
    return (
      email.trim() !== "" &&
      isValidEmail(email) &&
      displayName.trim() !== "" &&
      password.trim() !== ""
    );
  };

  const isStepTwoComplete = () =>
    formData.personal.fullName.trim() !== "" &&
    formData.personal.phoneNumber.trim() !== "";

  const isStepAllowed = (target) => {
    if (target === 1) return true;
    if (target === 2) return isStepOneComplete();
    if (target === 3 || target === 4)
      return isStepOneComplete() && isStepTwoComplete();
    return false;
  };

  const handleStepClick = (targetStep) => {
    if (isStepAllowed(targetStep)) {
      setStep(targetStep);
    } else {
      alert("Vui lòng hoàn thành các bước trước đó.");
    }
  };

  const handleNext = () => {
    if (step === 1 && !isStepOneComplete()) {
      alert("Vui lòng nhập đầy đủ thông tin ở bước 1");
      return;
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

  const handleResendCode = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(newCode);
    alert(`Mã xác thực mới đã được gửi đến ${formData.account.email}\n(Mã: ${newCode})`);
    setResendCooldown(120);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fakeCode = "123456";
    setSentCode(fakeCode);
    setStep(4);
  };

  useEffect(() => {
    if (resendCooldown === 0) return;
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
          <div
            key={s}
            onClick={() => handleStepClick(s)}
            style={{ cursor: "pointer" }}
          >
            <div className={`circle ${step === s ? "active" : "inactive"}`}>
              {step > s ? "✓" : s}
            </div>
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

            <input
              className={`input-field ${emailError ? "input-error" : ""}`}
              type="text"
              placeholder="Email"
              name="email"
              value={formData.account.email}
              onChange={handleChange("account")}
              required
            />
            {emailError && <p className="error-text">{emailError}</p>}

            <input
              className="input-field"
              type="text"
              placeholder="Tên hiển thị"
              name="displayName"
              value={formData.account.displayName}
              onChange={handleChange("account")}
              required
            />

            <div className="password-input-wrapper">
              <input
                className="input-field password-input"
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                name="password"
                value={formData.account.password}
                onChange={handleChange("account")}
                required
              />
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

            <button type="submit" className="btn">
              Tiếp theo
            </button>

            <div className="sign-up-social">
              <span>Đăng kí với</span>
              <div className="social-buttons">
                {[
                  {
                    name: "google",
                    iconDefault: "./assets/icons/icons8-google-24.png",
                    iconHover: "./assets/icons/icons8-google-white.png",
                  },
                  {
                    name: "facebook",
                    iconDefault: "./assets/icons/icons8-facebook-24.png",
                    iconHover: "./assets/icons/icons8-facebook-white.png",
                  },
                ].map(({ name, iconDefault, iconHover }) => (
                  <button
                    key={name}
                    type="button"
                    className={`social ${name}`}
                    onMouseEnter={(e) =>
                      (e.currentTarget.querySelector("img").src = iconHover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.querySelector("img").src = iconDefault)
                    }
                  >
                    <img src={iconDefault} alt={name} />
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
                placeholder={
                  field === "fullName"
                    ? "Họ và tên"
                    : field === "phoneNumber"
                    ? "Số điện thoại"
                    : "Địa chỉ"
                }
                name={field}
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

        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <h3>Xác nhận thông tin</h3>
            <ul>
              {Object.entries(formData.account).map(([key, value]) => (
                <li key={key}>
                  <strong>{key}:</strong> {value}
                </li>
              ))}
              {Object.entries(formData.personal).map(([key, value]) => (
                <li key={key}>
                  <strong>{key}:</strong> {value}
                </li>
              ))}
            </ul>
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

        {step === 4 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (verificationCode === sentCode) {
                setShowSuccessMessage(true);
              } else {
                alert("Mã xác thực không đúng. Vui lòng kiểm tra lại email.");
              }
            }}
          >
            <h3>Xác thực Email</h3>
            <p>
              Chúng tôi đã gửi mã xác thực đến email{" "}
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
                    onClick={() => navigate("/", { state: { showLogin: true } })}
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
