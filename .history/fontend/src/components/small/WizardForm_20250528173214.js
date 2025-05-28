import React, { useState } from 'react';

const RegistrationForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    phoneNumber: '',
    location: '',
    zipcode: ''
  });

  // Hàm kiểm tra từng bước đã hoàn thành chưa
  const isStepComplete = (stepNumber) => {
    if (stepNumber === 1) {
      return (
        formData.username.trim() !== '' &&
        formData.phoneNumber.trim() !== '' &&
        formData.location.trim() !== '' &&
        formData.zipcode.trim() !== ''
      );
    }
    // Thêm điều kiện cho các bước khác nếu cần
    return false;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    alert('Đăng ký thành công!');
  };

  // Style cho progress bar và steps
  const progressContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '40px',
    position: 'relative'
  };

  const stepCircleStyle = (completed, active) => ({
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: active ? '#4CAF50' : '#ddd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #ccc',
    cursor: 'pointer',
    transition: 'all 0.3s',
    position: 'relative',
    zIndex: 1
  });

  const lineStyle = (filled) => ({
    position: 'absolute',
    top: '50%',
    left: '50px',
    right: '50px',
    height: '4px',
    backgroundColor: filled ? '#4CAF50' : '#fff',
    zIndex: 0,
    transform: 'translateY(-50%)'
  });

  // Style chung cho form
  const formStyle = {
    backgroundColor: '#f4f4f4',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 15px',
    margin: '10px 0',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '16px'
  };

  const buttonStyle = {
    padding: '12px 30px',
    marginTop: '20px',
    backgroundColor: '#00CFA1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s'
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Đăng ký tài khoản</h2>

      {/* Progress Steps */}
      <div style={progressContainerStyle}>
        {/* Đường nối giữa các steps, hiển thị khi bước trước đã hoàn thành */}
        {step > 1 && (
          <div style={{ ...lineStyle(isStepComplete(1)) }} />
        )}

        {/* Step 1 */}
        <div
          style={stepCircleStyle(step >= 1, step === 1)}
          onClick={() => setStep(1)}
        >
          1
        </div>

        {/* Đường nối giữa Step 1 và Step 2 */}
        {step > 1 && (
          <div style={{ ...lineStyle(isStepComplete(2)) }} />
        )}

        {/* Step 2 */}
        <div
          style={stepCircleStyle(step >= 2, step === 2)}
          onClick={() => setStep(2)}
        >
          2
        </div>

        {/* Đường nối giữa Step 2 và Step 3 */}
        {step > 2 && (
          <div style={{ ...lineStyle(isStepComplete(3)) }} />
        )}

        {/* Step 3 */}
        <div
          style={stepCircleStyle(step >= 3, step === 3)}
          onClick={() => setStep(3)}
        >
          3
        </div>
      </div>

      {/* Nội dung từng bước */}
      <div style={formStyle}>
        {step === 1 && (
          <div>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Thông tin cá nhân</h3>
            <input
              style={inputStyle}
              type="text"
              placeholder="Tên đăng nhập"
              name="username"
              value={formData.username}
              onChange={handleChange}
            />
            <input
              style={inputStyle}
              type="text"
              placeholder="Số điện thoại"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
            <input
              style={inputStyle}
              type="text"
              placeholder="Địa điểm"
              name="location"
              value={formData.location}
              onChange={handleChange}
            />
            <input
              style={inputStyle}
              type="text"
              placeholder="Zipcode"
              name="zipcode"
              value={formData.zipcode}
              onChange={handleChange}
            />
            <button style={buttonStyle} onClick={handleNext}>Tiếp theo</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Thông tin ngân hàng</h3>
            {/* Các input của bước ngân hàng */}
            {/* Bạn có thể thêm các input như số thẻ, tên ngân hàng, v.v. */}
            <p style={{ color: '#777' }}>Chức năng chưa hoàn thiện.</p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button style={buttonStyle} onClick={handleBack}>Quay lại</button>
              <button style={buttonStyle} onClick={handleNext}>Tiếp theo</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Xác nhận</h3>
            {/* Hiển thị thông tin đã nhập */}
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><strong>Tên đăng nhập:</strong> {formData.username}</li>
              <li><strong>Số điện thoại:</strong> {formData.phoneNumber}</li>
              <li><strong>Địa điểm:</strong> {formData.location}</li>
              <li><strong>Zipcode:</strong> {formData.zipcode}</li>
            </ul>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button style={buttonStyle} onClick={handleBack}>Quay lại</button>
              <button style={buttonStyle} onClick={handleSubmit}>Hoàn tất</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationForm;