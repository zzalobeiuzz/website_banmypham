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

  // Hàm kiểm tra thông tin bước 1 đã đầy đủ chưa
  const isStepOneComplete = () => {
    return (
      formData.username.trim() !== '' &&
      formData.phoneNumber.trim() !== '' &&
      formData.location.trim() !== '' &&
      formData.zipcode.trim() !== ''
    );
  };

  // Hàm xử lý chuyển bước khi nhấn nút Tiếp theo
  const handleNext = () => {
    if (step === 1 && !isStepOneComplete()) {
      alert('Vui lòng nhập đầy đủ thông tin ở bước 1');
      return;
    }
    if (step < 3) setStep(prev => prev + 1);
  };

  // Hàm xử lý khi click vào vòng tròn bước
  const handleStepClick = (targetStep) => {
    // Nếu muốn cho phép nhảy tới bước 1 luôn luôn, còn bước 2 thì cần kiểm tra bước 1 hoàn tất trước
    if (targetStep === 1) {
      setStep(1);
      return;
    }
    if (targetStep === 2 && !isStepOneComplete()) {
      alert('Vui lòng hoàn thành bước 1 trước khi chuyển sang bước 2');
      return;
    }
    if (targetStep === 3) {
      // Giả sử bạn muốn bước 2 chưa xong vẫn cho qua bước 3 thì bỏ kiểm tra bước 2
      // Nếu không, thêm kiểm tra tương tự bước 2
      if (!isStepOneComplete()) {
        alert('Vui lòng hoàn thành bước 1 trước khi chuyển sang bước 3');
        return;
      }
    }
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
              required
            />
            <input
              className="input-field"
              type="text"
              placeholder="Zipcode"
              name="zipcode"
              value={formData.zipcode}
              onChange={handleChange}
              required
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
