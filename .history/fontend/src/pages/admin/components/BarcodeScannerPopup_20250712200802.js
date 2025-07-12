import React from "react";
import QrScanner from "react-qr-barcode-scanner";
import "./components.scss";

const BarcodeScannerPopup = ({ onClose, onScan }) => {
  const handleScan = (data) => {
    if (data) {
      onScan(data.text); // data.text chứa giá trị mã đọc được
      onClose();         // đóng popup sau khi quét
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
        <QrScanner
          onUpdate={(err, result) => {
            if (result) handleScan(result);
            if (err) handleError(err);
          }}
          style={{ width: "100%" }}
        />
        <p>Đưa mã vào vùng camera để quét tự động.</p>
      </div>
    </div>
  );
};

export default BarcodeScannerPopup;
