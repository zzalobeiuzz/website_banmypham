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
  const [error, setError] = useState('');

  const isStepOneComplete = () => {
    return (
      formData.username.trim() !== '' &&
      formData.phoneNumber.trim() !== '' &&
      formData.location.trim() !== '' &&
      formData.zipcode.trim() !== ''
    );
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleNext = () => {
    if (step === 1 && !isStepOneComplete()) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (step < 3) {
      setStep(prev => prev + 1);
      setError('');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
      setError('');
    }
  };

  const handleStepClick = (targetStep) => {
    if (targetStep > step && step === 1 && !isStepOneComplete()) {
      setError('Vui lòng nhập đầy đủ thông tin trước khi chuyển bước.');
      return;
    }
    setStep(targetStep);
    setError('');
  };

  const handleSubmit = () => {
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
          </div>Bước 1
        </div>
        <div>
          <div
            className={`circle ${step === 2 ? 'active' : 'inactive'}`}
            onClick={() => handleStepClick(2)}
          >
            {step > 2 ? '✓' : '2'}
          </div>Bước 2
        </div>
        <div>
          <div
            className={`circle ${step === 3 ? 'active' : 'inactive'}`}
            onClick={() => handleStepClick(3)}
          >
            3
          </div>Bước 3
        </div>
      </div>

      <div className="step-content">
        {error && <p className="error-message">{error}</p>}

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
              re
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
            <p className="note">Chức năng chưa hoàn thiện.</p>
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
