import React from "react";
import QrReader from "react-qr-reader";
import "./components.scss";

const BarcodeScannerPopup = ({ onClose, onScan }) => {
  const handleScan = (data) => {
    if (data) {
      onScan(data); // data chứa chuỗi mã đọc được
      onClose();    // đóng popup sau khi quét
    }
  };

  const handleError = (err) => {
    console.error("Scan Error:", err);
  };

  return (
    <div className="scanner-popup">
      <div className="scanner-content">
        <button className="btn-close" onClick={onClose}>✖</button>
        <h3>Quét mã sản phẩm</h3>
        <QrReader
          delay={300}
          onError={handleError}
          onScan={handleScan}
          style={{ width: "100%" }}
        />
        <p>Đưa mã vào vùng camera để quét tự động.</p>
      </div>
    </div>
  );
};

export default BarcodeScannerPopup;
