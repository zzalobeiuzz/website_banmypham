import React from "react";
import "./"; // nếu cần, hoặc có thể tách riêng file style riêng

const BarcodeScannerPopup = ({ onClose }) => {
  return (
    <div className="scanner-popup">
      <div className="scanner-content">
        <button className="btn-close" onClick={onClose}>✖</button>
        <h3>Quét mã sản phẩm</h3>
        <p>(Tại đây bạn có thể tích hợp camera quét mã)</p>
        {/* Ví dụ: <BarcodeScannerComponent /> */}
      </div>
    </div>
  );
};

export default BarcodeScannerPopup;
