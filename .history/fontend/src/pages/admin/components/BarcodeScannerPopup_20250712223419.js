import React, { useEffect, useState } from "react";
import { QrReader } from "react-qr-reader";

const BarcodeScannerPopup = ({ onClose, onScanSuccess }) => {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  // Lấy danh sách camera
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter(device => device.kind === "videoinput");
        setDevices(videoDevices);
        if (videoDevices[0]) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      })
      .catch(err => console.error("❌ Không lấy được camera:", err));
  }, []);

  const handleScan = (data) => {
    if (data) {
      console.log("✅ Quét thành công:", data);
      onScanSuccess(data);
      onClose();
    }
  };

  const handleError = (err) => {
    console.error("❌ Lỗi:", err);
  };

  return (
    <div className="scanner-popup">
      <div className="scanner-content">
        <button className="btn-close" onClick={onClose}>✖</button>
        <h3>Quét mã sản phẩm</h3>

        {devices.length > 1 && (
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
            {devices.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
        )}

        <QrReader
          constraints={{
            video: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined }
          }}
          onResult={(result, error) => {
            if (!!result) {
              handleScan(result.getText());
            }
            if (!!error) {
              handleError(error);
            }
          }}
          style={{ width: "100%" }}
        />
        <p>Đưa mã vào vùng camera để quét tự động.</p>
      </div>
    </div>
  );
};

export default BarcodeScannerPopup;
