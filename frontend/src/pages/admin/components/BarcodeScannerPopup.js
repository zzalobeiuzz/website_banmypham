import { BrowserMultiFormatReader } from "@zxing/browser";
import React, { useCallback, useEffect, useRef, useState } from "react";
import "./components.scss";

const BarcodeScannerPopup = ({ onClose, onScanSuccess }) => {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const controlsRef = useRef(null);
  const lastScannedValueRef = useRef("");
  const lastScannedAtRef = useRef(0);

  const [cameras, setCameras] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  const stopScanner = useCallback(async () => {
    try {
      if (controlsRef.current) {
        await controlsRef.current.stop();
        controlsRef.current = null;
      }
      codeReaderRef.current = null;

      console.log("✅ Đã dừng scanner");
    } catch (error) {
      console.warn("⚠️ Không thể dừng scanner:", error);
    }
  }, []);

  const startScanner = useCallback(
    async (deviceId) => {
      try {
        await stopScanner();
        lastScannedValueRef.current = "";
        lastScannedAtRef.current = 0;

        const codeReader = new BrowserMultiFormatReader();
        codeReaderRef.current = codeReader;

        const controls = await codeReader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, err) => {
            if (result) {
              const scannedValue = String(result.getText() || "").trim();
              if (!scannedValue) return;

              // Chặn callback lặp do camera đọc cùng mã trong nhiều frame liên tiếp.
              const now = Date.now();
              const isDuplicateBurst =
                scannedValue === lastScannedValueRef.current &&
                now - lastScannedAtRef.current < 600;

              if (isDuplicateBurst) {
                return;
              }

              lastScannedValueRef.current = scannedValue;
              lastScannedAtRef.current = now;

              console.log("✅ Scan thành công:", scannedValue);
              onScanSuccess(scannedValue);
              stopScanner();
            }
          }
        );
        controlsRef.current = controls;

        console.log("🚀 Đã bắt đầu scanner với camera", deviceId);
      } catch (error) {
        console.error("❌ Không thể bắt đầu scanner:", error);
      }
    },
    [stopScanner, onScanSuccess]
  );

  useEffect(() => {
    const initScanner = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === "videoinput");
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
  }, [startScanner, stopScanner]);

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
          onClick={async () => {
            await stopScanner();
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
