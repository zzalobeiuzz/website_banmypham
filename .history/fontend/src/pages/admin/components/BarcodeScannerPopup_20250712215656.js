import { Html5Qrcode } from "html5-qrcode";
import React, { useEffect, useRef, useState } from "react";
import "./components.scss";

const BarcodeScannerPopup = ({ onClose, onScanSuccess }) => {
  const qrRegionId = "qr-reader";
  const html5QrCodeRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);

  useEffect(() => {
    // Lấy danh sách camera
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
          setSelectedCameraId(devices[0].id);
        }
      })
      .catch((err) => {
        console.error("⚠️ Không lấy được danh sách camera:", err);
      });

    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (!selectedCameraId) return;

    const html5QrCode = new Html5Qrcode(qrRegionId);
    html5QrCodeRef.current = html5QrCode;

    const config = { fps: 10, qrbox: 250 };

    html5QrCode
      .start(
        { deviceId: { exact: selectedCameraId } },
        config,
        (decodedText) => {
          console.log("✅ Quét thành công:", decodedText);
          onScanSuccess(decodedText);
          stopScannerAndClose();
        },
        (errorMessage) => {
          console.log("Frame error:", errorMessage);
        }
      )
      .catch((err) => {
        console.error("⚠️ Không thể khởi động camera:", err);
      });

    return () => {
      stopScanner();
    };
  }, [selectedCameraId]);

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

        {cameras.length > 0 && (
          <select
            className="camera-select"
            value={selectedCameraId}
            onChange={(e) => setSelectedCameraId(e.target.value)}
          >
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Camera ${camera.id}`}
              </option>
            ))}
          </select>
        )}

        <div id={qrRegionId} style={{ width: "100%" }} />
        <p>Đưa mã vào vùng camera để quét tự động.</p>
      </div>
    </div>
  );
};

export default BarcodeScannerPopup;
