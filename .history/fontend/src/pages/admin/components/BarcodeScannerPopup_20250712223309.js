import React from "react";
import QrReader from "react-qr-reader";

const BarcodeScannerPopup = ({ onClose, onScanSuccess }) => {
  const handleScan = (data) => {
    if (data) {
      console.log("✅ Quét thành công:", data);
      onScanSuccess(data);
      onClose();
    }
  };

  const handleError = (err) => {
    console.error("❌ Lỗi:", err);
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
