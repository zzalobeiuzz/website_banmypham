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

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Xóa lỗi nếu người dùng bắt đầu nhập lại
    if (value.trim() !== '') {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStepOne = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Bắt buộc nhập tên đăng nhập';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Bắt buộc nhập số điện thoại';
    if (!formData.location.trim()) newErrors.location = 'Bắt buộc nhập địa điểm';
    if (!formData.zipcode.trim()) newErrors.zipcode = 'Bắt buộc nhập zipcode';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateStepOne()) return;
    }
    setStep(prev => prev + 1);
  };

  const handleStepClick = (targetStep) => {
    if (targetStep === 1) return setStep(1);
    if (!validateStepOne()) return;
    setStep(targetStep);
  };

  const handleBack = () => {
    if (step > 1) setStep(prev => prev - 1);
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
          <>
            <h3>Thông tin cá nhân</h3>
            <div>
              <input
                className="input-field"
                type="text"
                placeholder="Tên đăng nhập"
                name="username"
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && <p className="error-text">{errors.username}</p>}
            </div>
            <div>
              <input
                className="input-field"
                type="text"
                placeholder="Số điện thoại"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
              {errors.phoneNumber && <p className="error-text">{errors.phoneNumber}</p>}
            </div>
            <div>
              <input
                className="input-field"
                type="text"
                placeholder="Địa điểm"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
              {errors.location && <p className="error-text">{errors.location}</p>}
            </div>
            <div>
              <input
                className="input-field"
                type="text"
                placeholder="Zipcode"
                name="zipcode"
                value={formData.zipcode}
                onChange={handleChange}
              />
              {errors.zipcode && <p className="error-text">{errors.zipcode}</p>}
            </div>
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
