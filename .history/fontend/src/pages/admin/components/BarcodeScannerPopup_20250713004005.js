import { BrowserMultiFormatReader } from "@zxing/browser";
import React, { useEffect, useRef, useState } from "react";

const BarcodeScannerPopup = ({ onClose, onScanSuccess }) => {
  const codeReaderRef = useRef(null);
  const videoRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    // Lấy danh sách camera
    codeReader.getVideoInputDevices()
      .then((videoInputDevices) => {
        setCameras(videoInputDevices);
        if (videoInputDevices[0]) {
          setSelectedCameraId(videoInputDevices[0].deviceId);
        }
      })
      .catch((err) => console.error("❌ Không lấy được camera:", err));

    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (!selectedCameraId) return;

    const startScanner = async () => {
      try {
        await stopScanner();

        const previewElem = document.getElementById("video-preview");
        if (!previewElem) return;

        await codeReaderRef.current.decodeFromVideoDevice(
          selectedCameraId,
          previewElem,
          (result, err) => {
            if (result) {
              console.log("✅ Quét thành công:", result.getText());
              onScanSuccess(result.getText());
              stopScanner();
              onClose();
            }
            if (err && !(err.name === "NotFoundException")) {
              console.error("❌ Lỗi khi quét:", err);
            }
          }
        );
      } catch (error) {
        console.error("❌ Lỗi khởi động scanner:", error);
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCameraId]);

  const stopScanner = async () => {
    if (codeReaderRef.current) {
      try {
        await codeReaderRef.current.stopContinuousDecode();
        console.log("✅ Scanner đã dừng (stopContinuousDecode)");
      } catch (err) {
        console.warn("⚠️ Không thể dừng bằng stopContinuousDecode:", err);
        try {
          await codeReaderRef.current.stopStreams();
          console.log("✅ Scanner đã dừng (stopStreams fallback)");
        } catch (innerErr) {
          console.error("❌ Không thể dừng scanner:", innerErr);
        }
      }
    }
  };

  const handleCameraChange = async (e) => {
    const newCamId = e.target.value;
    await stopScanner();
    setSelectedCameraId(newCamId);
  };

  return (
    <div className="scanner-popup">
      <div className="scanner-content">
        <button
          className="btn-close"
          onClick={async () => {
            await stopScanner();
            onClose();
          }}
        >
          ✖
        </button>
        <h3>Quét mã sản phẩm</h3>

        {cameras.length > 1 && (
          <select value={selectedCameraId} onChange={handleCameraChange}>
            {cameras.map((cam, index) => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
        )}

        <div id="video-preview" ref={videoRef} style={{ width: "100%", marginTop: "10px" }} />
        <p>Đưa mã vào vùng camera để quét tự động.</p>
      </div>
    </div>
  );
};

export default BarcodeScannerPopup;
