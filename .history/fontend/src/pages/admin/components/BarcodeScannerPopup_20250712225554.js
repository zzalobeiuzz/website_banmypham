import { Html5Qrcode } from "html5-qrcode";
import React, { useEffect, useRef, useState } from "react";

const BarcodeScannerPopup = ({ onClose, onScanSuccess }) => {
  const qrRegionId = "qr-reader";
  const html5QrCodeRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        setCameras(devices);
        if (devices[0]) {
          setSelectedCameraId(devices[0].id);
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
      if (html5QrCodeRef.current) {
        // Stop nếu đang chạy
        if (html5QrCodeRef.current._isScanning || html5QrCodeRef.current.getState() === 2) {
          await html5QrCodeRef.current.stop().catch((err) => {
            console.warn("⚠️ Không thể dừng scanner khi chuyển camera:", err);
          });
        }
      }

      const html5QrCode = new Html5Qrcode(qrRegionId);
      html5QrCodeRef.current = html5QrCode;

      html5QrCode
        .start(
          { deviceId: { exact: selectedCameraId } },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            console.log("✅ Quét thành công:", decodedText);
            onScanSuccess(decodedText);

            html5QrCode
              .stop()
              .then(() => {
                console.log("✅ Scanner đã dừng");
                onClose();
              })
              .catch((err) => console.warn("⚠️ Không thể dừng scanner:", err));
          },
          (errorMessage) => {
            // console.log("Lỗi đọc:", errorMessage);
          }
        )
        .catch((err) => console.error("❌ Lỗi khởi động scanner:", err));
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [selectedCameraId]);

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current._isScanning || html5QrCodeRef.current.getState() === 2) {
          await html5QrCodeRef.current.stop();
          console.log("✅ Scanner đã dừng");
        }
      } catch (err) {
        console.warn("⚠️ Không thể dừng scanner:", err);
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
              <option key={cam.id} value={cam.id}>
                {cam.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
        )}

        <div id={qrRegionId} style={{ width: "100%", marginTop: "10px" }} />
        <p>Đưa mã vào vùng camera để quét tự động.</p>
      </div>
    </div>
  );
};

export default BarcodeScannerPopup;
