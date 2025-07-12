import {
  BrowserMultiFormatReader,
  listVideoInputDevices,
} from "@zxing/browser";
import React, { useEffect, useRef, useState } from "react";
import "./components.scss";

const BarcodeScannerPopup = ({ onClose, onScanSuccess }) => {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");

  const startScanner = async () => {
    if (!selectedCameraId) return;

    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    try {
      console.log("🚀 Bắt đầu scanner...");
      await codeReader.decodeFromVideoDevice(
        selectedCameraId,
        videoRef.current,
        (result, err) => {
          if (result) {
            console.log("✅ Quét thành công:", result.getText());
            stopScanner();
            onScanSuccess(result.getText());
          }
          if (err && err.name !== "NotFoundException") {
            console.error("⚠️ Lỗi khi quét:", err);
          }
        }
      );
    } catch (error) {
      console.error("❌ Không thể bắt đầu scanner:", error);
    }
  };

  const stopScanner = () => {
    try {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        console.log("✅ Scanner đã dừng");
      }
    } catch (error) {
      console.warn("⚠️ Không thể dừng scanner:", error);
    }
  };

  useEffect(() => {
    listVideoInputDevices()
      .then((videoInputDevices) => {
        setCameras(videoInputDevices);
        if (videoInputDevices.length > 0) {
          setSelectedCameraId(videoInputDevices[0].deviceId);
        }
      })
      .catch((err) => console.error("❌ Không lấy được danh sách camera:", err));

    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (selectedCameraId) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [selectedCameraId]);

  return (
    <div className="scanner-popup">
      <div className="scanner-header">
        <h2>Quét mã vạch</h2>
        <button onClick={onClose}>Đóng</button>
      </div>

      <div>
        <select
          value={selectedCameraId}
          onChange={(e) => setSelectedCameraId(e.target.value)}
        >
          {cameras.map((camera, index) => (
            <option key={index} value={camera.deviceId}>
              {camera.label || `Camera ${index + 1}`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <video ref={videoRef} style={{ width: "100%" }} />
      </div>
    </div>
  );
};

export default BarcodeScannerPopup;
