import { Html5Qrcode } from "html5-qrcode";
import React, { useEffect, useRef, useState } from "react";

const BarcodeScannerPopup = ({ onClose, onScanSuccess }) => {
  const scannerRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");

  useEffect(() => {
    Html5Qrcode.getCameras().then((devices) => {
      setCameras(devices);
      if (devices.length > 0) {
        setSelectedCamera(devices[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedCamera) return;

    const html5QrCode = new Html5Qrcode("reader");
    html5QrCode
      .start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          console.log("✅ Quét thành công:", decodedText);
          onScanSuccess(decodedText);
          html5QrCode.stop().then(() => onClose());
        },
        (error) => {
          console.warn("🚨 Lỗi quét:", error);
        }
      )
      .catch((err) => console.error("🚨 Lỗi khởi động:", err));

    return () => {
      html5QrCode.stop().catch(() => {});
    };
  }, [selectedCamera]);

  return (
    <div className="scanner-popup">
      <div className="scanner-content">
        <button onClick={onClose}>✖</button>
        <h3>Quét mã sản phẩm</h3>

        {cameras.length > 1 && (
          <select value={selectedCamera} onChange={(e) => setSelectedCamera(e.target.value)}>
            {cameras.map((cam) => (
              <option key={cam.id} value={cam.id}>
                {cam.label}
              </option>
            ))}
          </select>
        )}

        <div id="reader" style={{ width: "100%" }}></div>
        <p>Đưa mã vào vùng camera để quét tự động.</p>
      </div>
    </div>
  );
};

export default BarcodeScannerPopup;
