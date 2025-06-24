import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.scss";

const WizardForm = () => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

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
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value,
      },
    }));
  };

  const isStepTwoComplete = () =>
    formData.personal.fullName.trim() !== "" &&
    formData.personal.phoneNumber.trim() !== "";

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



  const handleSubmitEmail = async (e) => {
    e.preventDefault();
  
    const payload = {
      email: formData.account.email, // chỉ gửi email để kiểm tra và gửi mã xác thực
    };
  
    try {
      const response = await axios.post("http://localhost:5000/api/auth/register", payload);
  
      if (response.status === 200) {
        alert("✅ Mã xác thực đã được gửi về email của bạn.");
        setStep(4);
      } else {
        alert(response.data.message || "Không thể gửi mã xác thực.");
      }
    } catch (error) {
      console.error("❌ Lỗi gửi email xác thực:", error);
      alert(
        error.response?.data?.message || "Đã xảy ra lỗi khi gửi email xác thực."
      );
    }
  };
  
  
  
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const payload = {
      ...formData.account,
      ...formData.personal,
      role: 0, // ✅ Thêm thuộc tính role
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
        // Gửi mã xác thực giả lập sau khi đăng ký thành công
        const fakeCode = "123456";
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
  

  const handleResendCode = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(newCode);
    alert(
      `Mã xác thực mới đã được gửi đến ${formData.account.email}\n(Mã: ${newCode})`
    );
    setResendCooldown(120);
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
                handleSubmit()
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
