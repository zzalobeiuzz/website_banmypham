import React from "react";
import QrScanner from "react-qr-barcode-scanner";

const BarcodeScannerPopup = ({ onClose, onScanSuccess }) => {
  const handleScan = (data) => {
    if (data) {
      console.log("✅ Quét thành công:", data.text);
      onScanSuccess(data.text);
      onClose();
    }
  };

  const handleError = (err) => {
    console.error("Lỗi:", err);
  };

  return (
    <div className="scanner-popup">
      <div className="scanner-content">
        <button className="btn-close" onClick={onClose}>✖</button>
        <h3>Quét mã sản phẩm</h3>
        <QrScanner
          onUpdate={(err, result) => {
            if (result) handleScan(result);
            if (err) handleError(err);
          }}
          facingMode="environment"
          style={{ width: "100%" }}
        />
        <p>Đưa mã vào vùng camera để quét tự động.</p>
      </div>
    </div>
  );
};

export default BarcodeScannerPopup;
