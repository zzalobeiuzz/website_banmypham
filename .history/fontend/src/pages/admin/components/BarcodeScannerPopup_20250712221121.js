import { BrowserMultiFormatReader } from "@zxing/browser";
import React, { useEffect, useRef, useState } from "react";
import "./";

const BarcodeScannerPopup = ({ onClose, onScanSuccess }) => {
  const videoRef = useRef(null);
  const codeReader = useRef(new BrowserMultiFormatReader());
  const [cameras, setCameras] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  useEffect(() => {
    // Lấy danh sách camera
    codeReader.current
      .listVideoInputDevices()
      .then((videoInputDevices) => {
        setCameras(videoInputDevices);
        if (videoInputDevices.length > 0) {
          setSelectedDeviceId(videoInputDevices[0].deviceId);
        }
      })
      .catch((err) => console.error("⚠️ Không lấy được camera:", err));

    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (!selectedDeviceId) return;

    codeReader.current.decodeFromVideoDevice(
      selectedDeviceId,
      videoRef.current,
      (result, err) => {
        if (result) {
          console.log("✅ Quét thành công:", result.getText());
          onScanSuccess(result.getText());
          stopScannerAndClose();
        }
        if (err && !(err instanceof NotFoundException)) {
          console.error("⚠️ Lỗi quét:", err);
        }
      }
    );

    return () => {
      stopScanner();
    };
  }, [selectedDeviceId]);

  const stopScanner = () => {
    codeReader.current.reset();
  };

  const stopScannerAndClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <div className="scanner-popup">
      <div className="scanner-content">
        <button className="btn-close" onClick={stopScannerAndClose}>✖</button>
        <h3>Quét mã sản phẩm</h3>

        {cameras.length > 0 && (
          <select
            className="camera-select"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
            {cameras.map((cam) => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label || `Camera ${cam.deviceId}`}
              </option>
            ))}
          </select>
        )}

        <video
          ref={videoRef}
          style={{ width: "100%" }}
          muted
          autoPlay
          playsInline
        />
        <p>Đưa mã vào vùng camera để quét tự động.</p>
      </div>
    </div>
  );
};

export default BarcodeScannerPopup;
