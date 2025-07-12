

import { BrowserMultiFormatReader } from "@zxing/browser";
import React, { useEffect, useRef, useState } from "react";

const BarcodeScannerPopup = ({ onClose, onScanSuccess }) => {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const scannedRef = useRef(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        setCameras(videoDevices);
        if (videoDevices[0]) {
          setSelectedCameraId(videoDevices[0].deviceId);
        }
      })
      .catch((err) => console.error("❌ Không lấy được camera:", err));

    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (!selectedCameraId) return;

    scannedRef.current = false; // reset flag khi đổi camera

    const codeReader = codeReaderRef.current;

    stopScanner().then(() => {
      codeReader.decodeFromVideoDevice(
        selectedCameraId,
        videoRef.current,
        (result, err) => {
          if (result && !scannedRef.current) {
            scannedRef.current = true;
            console.log("✅ Quét thành công:", result.getText());
            onScanSuccess(result.getText());
            stopScanner().then(() => onClose());
          }

          if (err) {
            // Bạn có thể log nếu muốn
            // console.error("Lỗi:", err);
          }
        }
      );
    });

    return () => {
      stopScanner();
    };
  }, [selectedCameraId]);

  const stopScanner = async () => {
    if (codeReaderRef.current) {
      try {
        await codeReaderRef.current.reset();
        console.log("✅ Scanner đã dừng");
      } catch (err) {
        console.warn("⚠️ Không thể dừng scanner:", err);
      }
    }
  };

  return (
    <div className="scanner-popup">
      <div className="scanner-content">
        <button
          className="btn-close"
          onClick={() => {
            stopScanner().then(() => onClose());
          }}
        >
          ✖
        </button>
        <h3>Quét mã sản phẩm</h3>

        {cameras.length > 1 && (
          <select
            value={selectedCameraId}
            onChange={(e) => setSelectedCameraId(e.target.value)}
          >
            {cameras.map((cam, index) => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
        )}

        <video
          ref={videoRef}
          style={{ width: "100%", marginTop: "10px" }}
          muted
          autoPlay
        />
        <p>Đưa mã vào vùng camera để quét tự động.</p>
      </div>
    </div>
  );
};

export default BarcodeScannerPopup;
