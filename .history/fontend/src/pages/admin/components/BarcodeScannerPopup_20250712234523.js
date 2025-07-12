import React, { useEffect, useRef, useState } from "react";
import "./components.scss";

const BarcodeScannerPopup = ({ onClose, onScanSuccess }) => {
  const videoRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  // Lấy danh sách camera
  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((allDevices) => {
        const videoDevices = allDevices.filter((device) => device.kind === "videoinput");
        setDevices(videoDevices);
        if (videoDevices[0]) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      })
      .catch((err) => console.error("❌ Không lấy được camera:", err));

    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (!selectedDeviceId) return;

    const startScanner = async () => {
      const Quagga = window.Quagga;

      if (!Quagga) {
        console.error("⚠️ Quagga chưa load (chưa import script CDN?)");
        return;
      }

      try {
        await stopScanner();

        Quagga.init(
          {
            inputStream: {
              type: "LiveStream",
              target: videoRef.current,
              constraints: {
                deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
                facingMode: "environment",
              },
            },
            locator: {
              patchSize: "medium",
              halfSample: true,
            },
            numOfWorkers: navigator.hardwareConcurrency || 4,
            decoder: {
              readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader"],
            },
            locate: true,
          },
          (err) => {
            if (err) {
              console.error("❌ Lỗi init:", err);
              return;
            }
            Quagga.start();
          }
        );

        Quagga.onDetected(handleDetected);
      } catch (err) {
        console.error("❌ Lỗi khởi động scanner:", err);
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [selectedDeviceId]);

  const stopScanner = async () => {
    const Quagga = window.Quagga;
    if (Quagga && Quagga.stop) {
      Quagga.stop();
      Quagga.offDetected(handleDetected);
      console.log("✅ Scanner đã dừng");
    }
  };

  const handleDetected = (result) => {
    if (result && result.codeResult && result.codeResult.code) {
      console.log("✅ Quét thành công:", result.codeResult.code);
      onScanSuccess(result.codeResult.code);
      stopScanner();
      onClose();
    }
  };

  const handleCameraChange = async (e) => {
    const newCamId = e.target.value;
    await stopScanner();
    setSelectedDeviceId(newCamId);
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

        {devices.length > 1 && (
          <select value={selectedDeviceId} onChange={handleCameraChange}>
            {devices.map((cam, index) => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
        )}

        <div ref={videoRef} style={{ width: "100%", marginTop: "10px" }} />
        <p>Đưa mã vào vùng camera để quét tự động.</p>
      </div>
    </div>
  );
};

export default BarcodeScannerPopup;
