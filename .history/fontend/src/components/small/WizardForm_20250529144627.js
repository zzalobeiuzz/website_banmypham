import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.scss";

const WizardForm = () => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false); // trạng thái hiện mật khẩu
  const [formData, setFormData] = useState({
    account: {
      username: "",
      email: "",
      password: "",
    },
    personal: {
      fullName: "",
      phoneNumber: "",
      address: "",
    },
  });
  const navigate = useNavigate();
  
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleChange = (e, section) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value,
      },
    }));
  };

  const isStepOneComplete = () =>
    Object.values(formData.account).every((val) => val.trim() !== "");

  const handleStepClick = (targetStep) => {
    if (targetStep === 1 || isStepOneComplete()) setStep(targetStep);
    else alert("Vui lòng hoàn thành bước 1 trước khi chuyển tiếp");
  };

  const handleNext = () => {
    if (step === 1 && !isStepOneComplete()) {
      alert("Vui lòng nhập đầy đủ thông tin ở bước 1");
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => step > 1 && setStep(step - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Đăng ký thành công!");
    console.log("Dữ liệu:", formData);
  };

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
            {["username", "email", "password"].map((field) =>
              field === "password" ? (
                <div key={field} className="password-input-wrapper">
                  <input
                    className="input-field password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mật khẩu"
                    name="password"
                    value={formData.account.password}
                    onChange={(e) => handleChange(e, "account")}
                    required
                  />
                  <span
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    <img
                      src={
                        showPassword
                        ? "./assets/icons/icons8-eye-48.png"
                        : "./assets/icons/icons8-hide-64.png"
                      }
                      alt={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    />
                  </span>
                </div>
              ) : (
                <input
                  key={field}
                  className="input-field"
                  type="text"
                  placeholder={field === "username" ? "Tên đăng nhập" : "Email"}
                  name={field}
                  value={formData.account[field]}
                  onChange={(e) => handleChange(e, "account")}
                  required
                />
              )
            )}
            
            

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
                    <img
                      src={iconDefault}
                      alt={name.charAt(0).toUpperCase() + name.slice(1)}
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
                placeholder={
                  field === "fullName"
                    ? "Họ và tên"
                    : field === "phoneNumber"
                    ? "Số điện thoại"
                    : "Địa chỉ"
                }
                name={field}
                value={formData.personal[field]}
                onChange={(e) => handleChange(e, "personal")}
                required
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
                  <strong>
                    {key === "username"
                      ? "Tên đăng nhập"
                      : key === "email"
                      ? "Email"
                      : key === "password"
                      ? "Mật khẩu"
                      : key}
                    :
                  </strong>{" "}
                  {value}
                </li>
              ))}
              {Object.entries(formData.personal).map(([key, value]) => (
                <li key={key}>
                  <strong>
                    {key === "fullName"
                      ? "Họ và tên"
                      : key === "phoneNumber"
                      ? "Số điện thoại"
                      : key === "address"
                      ? "Địa chỉ"
                      : key}
                    :
                  </strong>{" "}
                  {value}
                </li>
              ))}
            </ul>

            <div className="button-group">
              <button type="button" className="btn" onClick={handleBack}>
                Quay lại
              </button>
              <button type="submit" className="btn" >
                Hoàn tất
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default WizardForm;
