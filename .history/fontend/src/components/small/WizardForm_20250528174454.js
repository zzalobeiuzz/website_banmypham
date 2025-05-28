import React, { useState } from 'react';
import './style.scss';

const RegistrationForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    phoneNumber: '',
    location: '',
    zipcode: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNext = () => {
    if (step < 3) setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  const handleSubmit = () => {
    alert('Đăng ký thành công!');
  };

  return (
    <div className="registration-form">
      <h2>Đăng ký tài khoản</h2>

      <div className="steps-container">
        <div className="step-line"></div>

        <div
          className={`circle ${step === 1 ? 'active' : 'inactive'}`}
          onClick={() => setStep(1)}
        >
          {step > 1 ? '✓' : '1'}
          <span>2323</span>
        </div>

        <div
          className={`circle ${step === 2 ? 'active' : 'inactive'}`}
          onClick={() => setStep(2)}
        >
          {step > 2 ? '✓' : '2'}
        </div>

        <div
          className={`circle ${step === 3 ? 'active' : 'inactive'}`}
          onClick={() => setStep(3)}
        >
          3
        </div>
      </div>

      <div className="step-content">
        {step === 1 && (
          <>
            <h3>Thông tin cá nhân</h3>
            <input
              className="input-field"
              type="text"
              placeholder="Tên đăng nhập"
              name="username"
              value={formData.username}
              onChange={handleChange}
            />
            <input
              className="input-field"
              type="text"
              placeholder="Số điện thoại"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
            <input
              className="input-field"
              type="text"
              placeholder="Địa điểm"
              name="location"
              value={formData.location}
              onChange={handleChange}
            />
            <input
              className="input-field"
              type="text"
              placeholder="Zipcode"
              name="zipcode"
              value={formData.zipcode}
              onChange={handleChange}
            />
            <button className="btn" onClick={handleNext}>Tiếp theo</button>
          </>
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
          <>
            <h3>Xác nhận</h3>
            <ul>
              <li><strong>Tên đăng nhập:</strong> {formData.username}</li>
              <li><strong>Số điện thoại:</strong> {formData.phoneNumber}</li>
              <li><strong>Địa điểm:</strong> {formData.location}</li>
              <li><strong>Zipcode:</strong> {formData.zipcode}</li>
            </ul>
            <div className="button-group">
              <button className="btn" onClick={handleBack}>Quay lại</button>
              <button className="btn" onClick={handleSubmit}>Hoàn tất</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RegistrationForm;
