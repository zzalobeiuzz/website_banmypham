import React, { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import "./components.scss";

const BarcodeScannerPopup = ({ onClose, onScanSuccess }) => {
  const qrRegionId = "qr-reader";
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(qrRegionId);
    html5QrCodeRef.current = html5QrCode;

    const config = { fps: 10, qrbox: 250 };

    html5QrCode
      .start(
        { facingMode: "environment" },
        config,
        (decodedText, decodedResult) => {
          console.log("✅ Quét thành công:", decodedText);
          // Gửi mã về cha
          onScanSuccess(decodedText);
          // Dừng scanner và đóng popup
          stopScannerAndClose();
        },
        (errorMessage) => {
          // Có thể log lỗi từng frame
          console.log("Frame error:", errorMessage);
        }
      )
      .catch((err) => {
        console.error("⚠️ Không thể khởi động camera:", err);
      });

    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          console.log("🟢 Đã dừng scanner");
          html5QrCodeRef.current.clear();
        })
        .catch((err) => {
          console.error("⚠️ Lỗi khi stop scanner:", err);
        });
    }
  };

  const stopScannerAndClose = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          console.log("🟢 Đã dừng scanner và sẽ đóng popup");
          html5QrCodeRef.current.clear();
          onClose();
        })
        .catch((err) => {
          console.error("⚠️ Lỗi khi stop:", err);
          onClose();
        });
    } else {
      onClose();
    }
  };

  return (
    <div className="scanner-popup">
      <div className="scanner-content">
        <button className="btn-close" onClick={stopScannerAndClose}>✖</button>
        <h3>Quét mã sản phẩm</h3>
        <div id={qrRegionId} style={{ width: "100%" }} />
        <p>Đưa mã vào vùng camera để quét tự động.</p>
      </div>
    </div>
  );
};

export default BarcodeScannerPopup;
