import { Html5Qrcode } from "html5-qrcode";
import React, { useEffect, useRef, useState } from "react";
import "./components.scss";

const BarcodeScannerPopup = ({ onClose, onScan }) => {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
        },
        (decodedText) => {
          console.log("✅ Mã quét được:", decodedText);
          if (typeof onScan === "function") {
            onScan(decodedText);
          }
          if (isScanning) {
            html5QrCode
              .stop()
              .then(() => {
                console.log("🔴 Đã dừng scanner");
                setIsScanning(false);
                onClose();
              })
              .catch((err) => {
                console.error("❌ Lỗi stop:", err);
                onClose();
              });
          }
        },
        (errorMessage) => {
          // Có thể log cảnh báo
          // console.warn("Lỗi quét:", errorMessage);
        }
      )
      .then(() => {
        setIsScanning(true);
      })
      .catch((err) => {
        console.error("🚨 Không thể khởi động camera:", err);
      });

    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current
          .stop()
          .then(() => console.log("🟢 Scanner cleaned up"))
          .catch((err) => console.warn("⚠️ Cleanup error", err));
      }
    };
  }, [onClose, onScan, isScanning]);

  return (
    <div className="scanner-popup">
      <div className="scanner-content">
        <button className="btn-close" onClick={onClose}>✖</button>
        <h3>Quét mã sản phẩm</h3>
        <div id="qr-reader" style={{ width: "100%" }} />
        <p>Đưa mã QR hoặc barcode vào vùng camera để quét tự động.</p>
      </div>
    </div>
  );
};

export default BarcodeScannerPopup;
