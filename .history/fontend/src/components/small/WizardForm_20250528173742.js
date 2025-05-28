import React, { useState } from 'react';

const RegistrationForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    phoneNumber: '',
    location: '',
    zipcode: ''
  });

  // Kiểm tra bước đã hoàn thành chưa
  const isStepComplete = (stepNumber) => {
    if (stepNumber === 1) {
      return (
        formData.username.trim() !== '' &&
        formData.phoneNumber.trim() !== '' &&
        formData.location.trim() !== '' &&
        formData.zipcode.trim() !== ''
      );
    }
    // Các bước tiếp theo có thể thêm điều kiện tương tự
    return false;
  };

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

  // Style cho các step
  const stepsContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '40px',
    position: 'relative',
  };

  const circleStyle = (completed, active) => ({
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: active ? '#00CFA1' : '#ccc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #00CFA1',
    cursor: 'pointer',
    transition: 'all 0.3s',
    margin: '0 10px'
  });

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Đăng ký tài khoản</h2>

      {/* Thanh tiến trình không có đường nối */}
      <div style={stepsContainerStyle}>
        {/* Bước 1 */}
        <div
          style={circleStyle(step >= 1, step === 1)}
          onClick={() => setStep(1)}
        >
          {step > 1 ? '✓' : '1'}
        </div>
        {/* Bước 2 */}
        <div
          style={circleStyle(step >= 2, step === 2)}
          onClick={() => setStep(2)}
        >
          {step > 2 ? '✓' : '2'}
        </div>
        {/* Bước 3 */}
        <div
          style={circleStyle(step >= 3, step === 3)}
          onClick={() => setStep(3)}
        >
          3
        </div>
      </div>

      {/* Nội dung các bước */}
      <div style={{
        backgroundColor: '#f4f4f4',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      }}>
        {step === 1 && (
          <>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Thông tin cá nhân</h3>
            <input
              style={{ ...inputStyle, marginBottom: '10px' }}
              type="text"
              placeholder="Tên đăng nhập"
              name="username"
              value={formData.username}
              onChange={handleChange}
            />
            <input
              style={{ ...inputStyle, marginBottom: '10px' }}
              type="text"
              placeholder="Số điện thoại"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
            <input
              style={{ ...inputStyle, marginBottom: '10px' }}
              type="text"
              placeholder="Địa điểm"
              name="location"
              value={formData.location}
              onChange={handleChange}
            />
            <input
              style={{ ...inputStyle, marginBottom: '10px' }}
              type="text"
              placeholder="Zipcode"
              name="zipcode"
              value={formData.zipcode}
              onChange={handleChange}
            />
            <button style={buttonStyle} onClick={handleNext}>Tiếp theo</button>
          </>
        )}

        {step === 2 && (
          <>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Thông tin ngân hàng</h3>
            {/* Các input của bước ngân hàng */}
            {/* Bạn có thể thêm các input như số thẻ, tên ngân hàng, v.v. */}
            <p style={{ color: '#777' }}>Chức năng chưa hoàn thiện.</p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button style={buttonStyle} onClick={handleBack}>Quay lại</button>
              <button style={buttonStyle} onClick={handleNext}>Tiếp theo</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
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

export default RegistrationForm;