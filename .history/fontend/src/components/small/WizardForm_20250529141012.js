import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.scss";

// Hàm bỏ dấu tiếng Việt
function removeVietnameseTones(str) {
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // tách dấu
  str = str.replace(/đ/g, "d").replace(/Đ/g, "D");
  return str;
}

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

  const handleChange = (e, section) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "password") {
      // Password chỉ cho phép a-z, A-Z, 0-9 (không dấu, không khoảng trắng, không ký tự đặc biệt)
      newValue = value.replace(/[^a-zA-Z0-9]/g, "");
    } else {
      // Các input khác: bỏ dấu tiếng Việt rồi loại bỏ ký tự không phải a-z, A-Z, 0-9, khoảng trắng, dấu chấm, dấu gạch ngang (tùy bạn)
      newValue = removeVietnameseTones(value);
      // Cho phép: chữ, số, khoảng trắng, dấu . và dấu - (bạn có thể điều chỉnh)
      newValue = newValue.replace(/[^a-zA-Z0-9 .-]/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: newValue,
      },
    }));
  };

  // Các phần còn lại giữ nguyên
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
    console.log("Dữ liệu đăng ký:", formData);
  };

  return (
    <div className="registration-form">
      <div className="steps-container">
        <div className="step-line" />
        {[1, 2, 3].map((s) => (
          <div key={s} onClick={() => handleStepClick(s)} style={{ cursor: "pointer" }}>
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

            {/* Phần đăng ký mạng xã hội, nút đăng nhập giữ nguyên */}
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
                    ? "Ho va ten (khong dau)"
                    : field === "phoneNumber"
                    ? "So dien thoai"
                    : "Dia chi (khong dau)"
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
