import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import React, { useEffect, useRef, useState } from "react";
import "./components.scss";

const BarcodeScannerPopup = ({ onClose, onScanSuccess }) => {
  const videoRef = useRef(null);
  const codeReader = useRef();
  const [cameras, setCameras] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();

    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter(device => device.kind === "videoinput");
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      })
      .catch((err) => console.error("⚠️ Không lấy được camera:", err));

    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (!selectedDeviceId || !codeReader.current) return;

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
    if (codeReader.current) {
      // 👇 Cách chuẩn nhất
      codeReader.current.stopStreams();
    }
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
