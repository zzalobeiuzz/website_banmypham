import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.scss';

const WizardForm = () => {
  const [step, setStep] = useState(1); // Theo dõi bước hiện tại
  const [formData, setFormData] = useState({
    username: '',
    phoneNumber: '',
    password: '',
  }); // Lưu dữ liệu form
  const navigate = useNavigate();

  const handleChange = e =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const isStepOneComplete = () =>
    Object.values(formData).every(val => val.trim() !== '');

  const handleStepClick = targetStep => {
    if (targetStep === 1 || isStepOneComplete()) setStep(targetStep);
    else alert('Vui lòng hoàn thành bước 1 trước khi chuyển tiếp');
  };

  const handleNext = () => {
    if (step === 1 && !isStepOneComplete()) {
      alert('Vui lòng nhập đầy đủ thông tin ở bước 1');
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => step > 1 && setStep(step - 1);

  const handleSubmit = e => {
    e.preventDefault();
    alert('Đăng ký thành công!');
  };

  return (
    <div className="registration-form">
      {/* Thanh điều hướng các bước */}
      <div className="steps-container">
        <div className="step-line" />
        {[1, 2, 3].map(s => (
          <div key={s} onClick={() => handleStepClick(s)} style={{ cursor: 'pointer' }}>
            <div className={`circle ${step === s ? 'active' : 'inactive'}`}>
              {step > s ? '✓' : s}
            </div>
            Bước {s}
          </div>
        ))}
      </div>

      <div className="step-content">
        {/* Bước 1: Nhập thông tin cá nhân */}
        {step === 1 && (
          <form onSubmit={e => { e.preventDefault(); handleNext(); }}>
            <h3>Thông tin tài khoản</h3>
            {['username', 'phoneNumber', 'password'].map(field => (
              <input
                key={field}
                className="input-field"
                type="text"
                placeholder={
                  field === 'username' ? 'Tên đăng nhập' :
                  field === 'phoneNumber' ? 'Số điện thoại' : 'Mật khẩu' 
                }
                name={field}
                value={formData[field]}
                onChange={handleChange}
                required
              />
            ))}
            <button type="submit" className="btn">Tiếp theo</button>

            {/* Đăng ký bằng mạng xã hội */}
            <div className="sign-up-social">
              <span>Đăng kí với</span>
              <div className="social-buttons">
                {[
                  {
                    name: 'google',
                    iconDefault: './assets/icons/icons8-google-24.png',
                    iconHover: './assets/icons/icons8-google-white.png'
                  },
                  {
                    name: 'facebook',
                    iconDefault: './assets/icons/icons8-facebook-24.png',
                    iconHover: './assets/icons/icons8-facebook-white.png'
                  }
                ].map(({ name, iconDefault, iconHover }) => (
                  <button
                    key={name}
                    type="button"
                    className={`social ${name}`}
                    // Hover để đổi icon
                    onMouseEnter={e => (e.currentTarget.querySelector('img').src = iconHover)}
                    onMouseLeave={e => (e.currentTarget.querySelector('img').src = iconDefault)}
                  >
                    <img src={iconDefault} alt={name.charAt(0).toUpperCase() + name.slice(1)} />
                  </button>
                ))}
              </div>

              {/* Chuyển về trang chủ và hiển thị popup đăng nhập */}
              <span className="return-login">
                Bạn đã có tài khoản?{' '}
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

        {/* Bước 2: Placeholder cho thông tin ngân hàng */}
        {step === 2 && (
          <>
            <h3>Thông tin cá nhận</h3>
            <p style={{ color: '#777' }}>Chức năng chưa hoàn thiện.</p>
            <div className="button-group">
              <button className="btn" onClick={handleBack}>Quay lại</button>
              <button className="btn" onClick={handleNext}>Tiếp theo</button>
            </div>
          </>
        )}

        {/* Bước 3: Xác nhận lại thông tin */}
        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <h3>Xác nhận</h3>
            <ul>
              {Object.entries(formData).map(([key, value]) => (
                <li key={key}>
                  <strong>
                    {key === 'username' ? 'Tên đăng nhập' :
                     key === 'phoneNumber' ? 'Số điện thoại' : 'Địa điểm'}:
                  </strong> {value}
                </li>
              ))}
            </ul>
            <div className="button-group">
              <button type="button" className="btn" onClick={handleBack}>Quay lại</button>
              <button type="submit" className="btn">Hoàn tất</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default WizardForm;
