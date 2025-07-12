import { Html5Qrcode } from "html5-qrcode";
import React, { useEffect, useRef } from "react";
import "./components.scss"; // hoặc SCSS riêng

const BarcodeScannerPopup = ({ onClose, onScan }) => {
  const qrRef = useRef(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!qrRef.current) return;

    const html5QrCode = new Html5Qrcode("qr-reader");
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: "environment" }, // camera sau
        {
          fps: 10,
          qrbox: 250,
        },
        (decodedText, decodedResult) => {
          console.log("Mã quét được:", decodedText);
          if (typeof onScan === "function") {
            onScan(decodedText);
          }
          html5QrCode.stop().then(() => {
            onClose();
          });
        },
        (errorMessage) => {
          console.warn("Lỗi quét:", errorMessage);
        }
      )
      .catch((err) => {
        console.error("Không thể khởi động camera:", err);
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch((err) => console.error("Stop error", err));
      }
    };
  }, [onClose, onScan]);

  return (
    <div className="scanner-popup">
      <div className="scanner-content">
        <button className="btn-close" onClick={onClose}>✖</button>
        <h3>Quét mã sản phẩm</h3>
        <div id="qr-reader" ref={qrRef} style={{ width: "100%" }} />
        <p>Đưa mã QR hoặc barcode vào vùng camera để quét tự động.</p>
      </div>
    </div>
  );
};

export default BarcodeScannerPopup;
