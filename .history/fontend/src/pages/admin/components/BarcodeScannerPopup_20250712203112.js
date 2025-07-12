import React from "react";
import QrScanner from "react-qr-scanner";
import "./components.scss"; // hoặc file SCSS riêng của bạn

const BarcodeScannerPopup = ({ onClose, onScan }) => {
  const handleScan = (data) => {
    if (data) {
      if (typeof onScan === "function") {
        onScan(data.text || data); // data.text hoặc data tuỳ cấu trúc trả về
      }
      onClose();
    }
  };

  const handleError = (err) => {
    console.error("Scan Error:", err);
  };

  const previewStyle = {
    height: 240,
    width: "100%",
  };

  return (
    <div className="scanner-popup">
      <div className="scanner-content">
        <button className="btn-close" onClick={onClose}>✖</button>
        <h3>Quét mã sản phẩm</h3>
        <QrScanner
          delay={300}
          style={previewStyle}
          onError={handleError}
          onScan={handleScan}
        />
        <p>Đưa mã QR hoặc barcode vào vùng camera để quét tự động.</p>
      </div>
    </div>
  );
};

export default BarcodeScannerPopup;
