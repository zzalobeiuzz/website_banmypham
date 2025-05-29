import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.scss";

const WizardForm = () => {
  const [step, setStep] = useState(1);
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

  // Hàm xử lý nhập liệu
  // Với password: chỉ cho phép a-z, A-Z, 0-9, loại bỏ ký tự khác
  const handleChange = (e, section) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "password") {
      newValue = value.replace(/[^a-zA-Z0-9]/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: newValue,
      },
    }));
  };

  // Kiểm tra bước 1 đã nhập đủ chưa
  const isStepOneComplete = () =>
    Object.values(formData.account).every((val) => val.trim() !== "");

  // Xử lý click chuyển bước
  const handleStepClick = (targetStep) => {
    if (targetStep === 1 || isStepOneComplete()) {
      setStep(targetStep);
    } else {
      alert("Vui lòng hoàn thành bước 1 trước khi chuyển tiếp");
    }
  };

  // Nút tiếp theo
  const handleNext = () => {
    if (step === 1 && !isStepOneComplete()) {
      alert("Vui lòng nhập đầy đủ thông tin ở bước 1");
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  // Nút quay lại
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Xử lý submit cuối cùng
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Đăng ký thành công!");
    console.log("Dữ liệu đăng ký:", formData);
  };

  return (
    <div className="registration-form">
      {/* Thanh tiến trình */}
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

      {/* Nội dung từng bước */}
      <div className="step-content">
        {/* Bước 1: Thông tin tài khoản */}
        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNext();
            }}
          >
            <h3>Thông tin tài khoản</h3>

            {["username", "email", "password"].map((field) => (
              <input
                key={field}
                className="input-field"
                type={field === "password" ? "password" : "text"}
                placeholder={
                  field === "username"
                    ? "Tên đăng nhập"
                    : field === "email"
                    ? "Email"
                    : "Mật khẩu"
                }
                name={field}
                value={formData.account[field]}
                onChange={(e) => handleChange(e, "account")}
                required
              />
            ))}

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

        {/* Bước 2: Thông tin cá nhân */}
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

        {/* Bước 3: Xác nhận */}
        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <h3>Xác nhận</h3>
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
              <button type="submit" className="btn">
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
