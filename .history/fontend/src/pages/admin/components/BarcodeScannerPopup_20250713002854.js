// import { Html5Qrcode } from "html5-qrcode";
// import React, { useEffect, useRef, useState } from "react";

// const BarcodeScannerPopup = ({ onClose, onScanSuccess }) => {
//   const qrRegionId = "qr-reader";
//   const html5QrCodeRef = useRef(null);
//   const [cameras, setCameras] = useState([]);
//   const [selectedCameraId, setSelectedCameraId] = useState("");
//   const [isStarting, setIsStarting] = useState(false); // ⭐

//   // Lấy danh sách camera
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

//   // Stop scanner an toàn
//   const stopScanner = async () => {
//     if (html5QrCodeRef.current) {
//       try {
//         const state = html5QrCodeRef.current.getState();
//         if (state === 2) {
//           await html5QrCodeRef.current.stop();
//           console.log("✅ Scanner đã dừng");
//         }
//       } catch (err) {
//         console.warn("⚠️ Không thể dừng scanner:", err);
//       }
//     }
//   };

//   // Start scanner khi chọn camera
//   useEffect(() => {
//     if (!selectedCameraId) return;

//     const startScanner = async () => {
//       setIsStarting(true);
//       await stopScanner();

//       const html5QrCode = new Html5Qrcode(qrRegionId);
//       html5QrCodeRef.current = html5QrCode;

//       html5QrCode
//         .start(
//           { deviceId: { exact: selectedCameraId } },
//           {
//             fps: 10,
//             qrbox: { width: 250, height: 250 },
//           },
//           (decodedText) => {
//             console.log("✅ Quét thành công:", decodedText);
//             onScanSuccess(decodedText);

//             html5QrCode
//               .stop()
//               .then(() => {
//                 console.log("✅ Scanner đã dừng sau khi quét");
//                 onClose();
//               })
//               .catch((err) => console.warn("⚠️ Không thể dừng scanner:", err));
//           },
//           (errorMessage) => {
//             // console.log("Lỗi đọc:", errorMessage);
//           }
//         )
//         .then(() => {
//           setIsStarting(false);
//         })
//         .catch((err) => {
//           console.error("❌ Lỗi khởi động scanner:", err);
//           setIsStarting(false);
//         });
//     };

//     startScanner();

//     return () => {
//       if (!isStarting) {
//         stopScanner();
//       }
//     };
//   }, [selectedCameraId]);

//   // Khi chọn camera khác
//   const handleCameraChange = (e) => {
//     setSelectedCameraId(e.target.value);
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

import { BrowserMultiFormatReader, NotFoundException, listVideoInputDevices } from "@zxing/browser";
import React, { useEffect, useRef, useState } from "react";

const BarcodeScannerPopup = ({ onClose, onScanSuccess }) => {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    listVideoInputDevices().then((devices) => {
      setCameras(devices);
      if (devices[0]) {
        setSelectedCameraId(devices[0].deviceId);
      }
    });

    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (!selectedCameraId) return;

    const codeReader = codeReaderRef.current;

    stopScanner().then(() => {
      codeReader.decodeFromVideoDevice(
        selectedCameraId,
        videoRef.current,
        (result, err) => {
          if (result) {
            console.log("✅ Quét thành công:", result.getText());
            onScanSuccess(result.getText());
            stopScanner().then(() => onClose());
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error(err);
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
