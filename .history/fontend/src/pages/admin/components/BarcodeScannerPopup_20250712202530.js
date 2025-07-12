import { Html5QrcodeScanner } from "html5-qrcode";
import React, { useEffect } from "react";
import "./components.scss";

const BarcodeScannerPopup = ({ onClose, onScan }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("scanner", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    });

    scanner.render(
      (result) => {
        onScan(result);
        onClose();
      },
      (error) => {
        console.warn("Scan error:", error);
      }
    );

    return () => {
      scanner.clear().catch((error) => console.error("Clear error:", error));
    };
  }, [onClose, onScan]);

  return (
    <div className="scanner-popup">
      <div className="scanner-content">
        <button className="btn-close" onClick={onClose}>✖</button>
        <h3>Quét mã sản phẩm</h3>
        <div id="scanner" style={{ width: "100%" }}></div>
        <p>Đưa mã QR hoặc barcode vào vùng camera để quét tự động.</p>
      </div>
    </div>
  );
};

export default BarcodeScannerPopup;
