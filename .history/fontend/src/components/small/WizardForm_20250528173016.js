import React, { useState } from 'react';

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
    setStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    alert('Đăng ký thành công!');
  };

  // Style cho progress bar
  const progressStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '30px'
  };

  const stepStyles = (currentStep) => ({
    flex: 1,
    padding: '10px 20px',
    borderRadius: '20px',
    backgroundColor: step >= currentStep ? '#4CAF50' : '#ddd',
    color: step >= currentStep ? 'white' : '#999',
    textAlign: 'center',
    margin: '0 5px',
    cursor: 'pointer',
    transition: 'all 0.3s'
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

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Đăng ký tài khoản</h2>
      
      {/* Progress Bar */}
      <div style={progressStyles}>
        <div style={stepStyles(1)} onClick={() => setStep(1)}>
          Personal
        </div>
        <div style={stepStyles(2)} onClick={() => setStep(2)}>
          Bank
        </div>
        <div style={stepStyles(3)} onClick={() => setStep(3)}>
          Confirm
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