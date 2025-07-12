import { BrowserMultiFormatReader } from "@zxing/browser";
import React, { useEffect, useRef, useState } from "react";
import "./BarcodeScannerPopup.scss";

const BarcodeScannerPopup = ({ onClose, onScanSuccess }) => {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  useEffect(() => {
    const initScanner = async () => {
      try {
        const codeReader = new BrowserMultiFormatReader();
        codeReaderRef.current = codeReader;

        // Lấy danh sách camera
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === "videoinput");
        setCameras(videoDevices);

        if (videoDevices.length > 0) {
          const defaultDeviceId = videoDevices[0].deviceId;
          setSelectedDeviceId(defaultDeviceId);
          startScanner(defaultDeviceId);
        }
      } catch (error) {
        console.error("❌ Lỗi khởi tạo scanner:", error);
      }
    };

    initScanner();

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanner = async (deviceId) => {
    try {
      await stopScanner(); // Dừng trước nếu đang chạy

      await codeReaderRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            console.log("✅ Scan thành công:", result.getText());
            onScanSuccess(result.getText());
            stopScanner();
          }
        }
      );
      console.log("🚀 Đã bắt đầu scanner với camera", deviceId);
    } catch (error) {
      console.error("❌ Không thể bắt đầu scanner:", error);
    }
  };

  const stopScanner = async () => {
    try {
      if (codeReaderRef.current) {
        await codeReaderRef.current.stopContinuousDecode();
        console.log("✅ Đã dừng scanner");
      }
    } catch (error) {
      console.warn("⚠️ Không thể dừng scanner:", error);
    }
  };

  const handleCameraChange = (e) => {
    const newDeviceId = e.target.value;
    setSelectedDeviceId(newDeviceId);
    startScanner(newDeviceId);
  };

  return (
    <div className="scanner-popup">
      <div className="scanner-content">
        <h2>📷 Quét mã vạch</h2>

        {cameras.length > 1 && (
          <select value={selectedDeviceId} onChange={handleCameraChange}>
            {cameras.map((cam, idx) => (
              <option key={idx} value={cam.deviceId}>
                {cam.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>
        )}

        <video ref={videoRef} style={{ width: "100%", borderRadius: "8px" }} />

        <button
          className="close-btn"
          onClick={() => {
            stopScanner();
            onClose();
          }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

export default BarcodeScannerPopup;
