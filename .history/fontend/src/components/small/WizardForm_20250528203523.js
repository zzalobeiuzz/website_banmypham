import React, { useState } from 'react';
import './style.scss';

const RegistrationForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    phoneNumber: '',
    location: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const isStepOneComplete = () => {
    return (
      formData.username.trim() !== '' &&
      formData.phoneNumber.trim() !== '' &&
      formData.location.trim() !== ''
    );
  };

  const handleNext = () => {
    if (step === 1 && !isStepOneComplete()) {
      alert('Vui lòng nhập đầy đủ thông tin ở bước 1');
      return;
    }
    if (step < 3) setStep(prev => prev + 1);
  };

  const handleStepClick = (targetStep) => {
    if (targetStep === 1) return setStep(1);
    if ((targetStep === 2 || targetStep === 3) && !isStepOneComplete()) {
      alert('Vui lòng hoàn thành bước 1 trước khi chuyển tiếp');
      return;
    }
    setStep(targetStep);
  };

  const handleBack = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Đăng ký thành công!');
  };

  return (
    <div className="registration-form">
      <div className="steps-container">
        <div className="step-line"></div>

        <div>
          <div
            className={`circle ${step === 1 ? 'active' : 'inactive'}`}
            onClick={() => handleStepClick(1)}
          >
            {step > 1 ? '✓' : '1'}
          </div>
          Bước 1
        </div>

        <div>
          <div
            className={`circle ${step === 2 ? 'active' : 'inactive'}`}
            onClick={() => handleStepClick(2)}
          >
            {step > 2 ? '✓' : '2'}
          </div>
          Bước 2
        </div>

        <div>
          <div
            className={`circle ${step === 3 ? 'active' : 'inactive'}`}
            onClick={() => handleStepClick(3)}
          >
            3
          </div>
          Bước 3
        </div>
      </div>

      <div className="step-content">
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
            <h3>Thông tin cá nhân</h3>
            <input
              className="input-field"
              type="text"
              placeholder="Tên đăng nhập"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <input
              className="input-field"
              type="text"
              placeholder="Số điện thoại"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />
            <input
              className="input-field"
              type="text"
              placeholder="Địa điểm"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />

            <button type="submit" className="btn">Tiếp theo</button>
            {/* Nút Google và Facebook */}
            <div className="sign-up-social"
            <span>Đăng kí với</span>
            <div className="social-buttons">
            
            
              <button
                type="button"
                className="social google"
                onMouseEnter={(e) =>
                  (e.currentTarget.querySelector('img').src = './assets/icons/icons8-google-white.png')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.querySelector('img').src = './assets/icons/icons8-google-24.png')
                }
              >
                <img src="./assets/icons/icons8-google-24.png" alt="Google" />
              </button>

              <button
                type="button"
                className="social facebook"
                onMouseEnter={(e) =>
                  (e.currentTarget.querySelector('img').src = './assets/icons/icons8-facebook-white.png')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.querySelector('img').src = './assets/icons/icons8-facebook-24.png')
                }
              >
                <img src="./assets/icons/icons8-facebook-24.png" alt="Facebook" />
              </button>
            </div>
            </div>

          </form>
        )}

        {step === 2 && (
          <>
            <h3>Thông tin ngân hàng</h3>
            <p style={{ color: '#777' }}>Chức năng chưa hoàn thiện.</p>
            <div className="button-group">
              <button className="btn" onClick={handleBack}>Quay lại</button>
              <button className="btn" onClick={handleNext}>Tiếp theo</button>
            </div>
          </>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <h3>Xác nhận</h3>
            <ul>
              <li><strong>Tên đăng nhập:</strong> {formData.username}</li>
              <li><strong>Số điện thoại:</strong> {formData.phoneNumber}</li>
              <li><strong>Địa điểm:</strong> {formData.location}</li>
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

export default RegistrationForm;
