// import { Html5Qrcode } from "html5-qrcode";
// import React, { useEffect, useRef, useState } from "react";

// const BarcodeScannerPopup = ({ onClose, onScanSuccess }) => {
//   const qrRegionId = "qr-reader";
//   const html5QrCodeRef = useRef(null);
//   const [cameras, setCameras] = useState([]);
//   const [selectedCameraId, setSelectedCameraId] = useState("");

//   useEffect(() => {
//     Html5Qrcode.getCameras()
//       .then((devices) => {
//         setCameras(devices);
//         if (devices[0]) {
//           setSelectedCameraId(devices[0].id);
//         }
//       })
//       .catch((err) => console.error("❌ Không lấy được camera:", err));

//     return () => {
//       stopScanner();
//     };
//   }, []);

//   useEffect(() => {
//     if (!selectedCameraId) return;

//     const startScanner = async () => {
//       if (html5QrCodeRef.current) {
//         // Stop nếu đang chạy
//         if (html5QrCodeRef.current._isScanning || html5QrCodeRef.current.getState() === 2) {
//           await html5QrCodeRef.current.stop().catch((err) => {
//             console.warn("⚠️ Không thể dừng scanner khi chuyển camera:", err);
//           });
//         }
//       }

//       const html5QrCode = new Html5Qrcode(qrRegionId);
//       html5QrCodeRef.current = html5QrCode;

//       html5QrCode
//         .start(
//           { deviceId: { exact: selectedCameraId } },
//           {
//             fps: 10,
//             qrbox: { width: 50, height: 250 },
//           },
//           (decodedText) => {
//             console.log("✅ Quét thành công:", decodedText);
//             onScanSuccess(decodedText);

//             html5QrCode
//               .stop()
//               .then(() => {
//                 console.log("✅ Scanner đã dừng");
//                 onClose();
//               })
//               .catch((err) => console.warn("⚠️ Không thể dừng scanner:", err));
//           },
//           (errorMessage) => {
//             console.log("Lỗi đọc:", errorMessage);
//           }
//         )
//         .catch((err) => console.error("❌ Lỗi khởi động scanner:", err));
//     };

//     startScanner();

//     return () => {
//       stopScanner();
//     };
//   }, [selectedCameraId]);

//   const stopScanner = async () => {
//     if (html5QrCodeRef.current) {
//       try {
//         if (html5QrCodeRef.current._isScanning || html5QrCodeRef.current.getState() === 2) {
//           await html5QrCodeRef.current.stop();
//           console.log("✅ Scanner đã dừng");
//         }
//       } catch (err) {
//         console.warn("⚠️ Không thể dừng scanner:", err);
//       }
//     }
//   };

//   const handleCameraChange = async (e) => {
//     const newCamId = e.target.value;
//     await stopScanner();
//     setSelectedCameraId(newCamId);
//   };

//   return (
//     <div className="scanner-popup">
//       <div className="scanner-content">
//         <button
//           className="btn-close"
//           onClick={async () => {
//             await stopScanner();
//             onClose();
//           }}
//         >
//           ✖
//         </button>
//         <h3>Quét mã sản phẩm</h3>

//         {cameras.length > 1 && (
//           <select value={selectedCameraId} onChange={handleCameraChange}>
//             {cameras.map((cam, index) => (
//               <option key={cam.id} value={cam.id}>
//                 {cam.label || `Camera ${index + 1}`}
//               </option>
//             ))}
//           </select>
//         )}

//         <div id={qrRegionId} style={{ width: "100%", marginTop: "10px" }} />
//         <p>Đưa mã vào vùng camera để quét tự động.</p>
//       </div>
//     </div>
//   );
// };

// export default BarcodeScannerPopup;


import React, { useEffect, useRef, useState } from "react";

// Nếu bạn dùng script CDN Quagga (ví dụ trong public/index.html), thì không cần import
// Nếu bạn dùng npm, thì: import Quagga from "quagga";

const BarcodeScannerPopup = ({ onClose, onScanSuccess }) => {
  const videoRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  // Lấy danh sách camera
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter((device) => device.kind === "videoinput");
        setCameras(videoDevices);
        if (videoDevices[0]) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      })
      .catch((err) => console.error("❌ Không lấy được camera:", err));
  }, []);

  // Stop scanner
  const stopScanner = () => {
    const Quagga = window.Quagga;
    if (Quagga && Quagga.stop && Quagga.running) {
      Quagga.stop();
      Quagga.running = false;
      console.log("✅ Scanner đã dừng");
    }
  };

  // Xử lý khi quét thành công
  const handleDetected = (result) => {
    if (result && result.codeResult && result.codeResult.code) {
      console.log("✅ Quét thành công:", result.codeResult.code);
      onScanSuccess(result.codeResult.code);
      stopScanner();
      onClose();
    }
  };

  // Start scanner khi camera thay đổi
  useEffect(() => {
    const Quagga = window.Quagga;
    if (!Quagga || !selectedDeviceId) return;

    stopScanner();

    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target: videoRef.current,
          constraints: {
            deviceId: { exact: selectedDeviceId },
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
        Quagga.running = true;
        console.log("✅ Scanner đã khởi động");
      }
    );

    Quagga.onDetected(handleDetected);

    return () => {
      stopScanner();
      Quagga.offDetected(handleDetected);
    };
  }, [selectedDeviceId]);

  // Handle camera change
  const handleCameraChange = (e) => {
    const newCamId = e.target.value;
    setSelectedDeviceId(newCamId);
  };

  return (
    <div className="scanner-popup">
      <div className="scanner-content">
        <button
          className="btn-close"
          onClick={() => {
            stopScanner();
            onClose();
          }}
        >
          ✖
        </button>
        <h3>Quét mã sản phẩm</h3>

        {cameras.length > 1 && (
          <select value={selectedDeviceId} onChange={handleCameraChange}>
            {cameras.map((cam, index) => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
        )}

        <div
          ref={videoRef}
          style={{
            position: "relative",
            width: "100%",
            height: "300px",
            marginTop: "10px",
            background: "#000",
          }}
        />

        <p>Đưa mã vào vùng camera để quét tự động.</p>
      </div>
    </div>
  );
};

export default BarcodeScannerPopup;
