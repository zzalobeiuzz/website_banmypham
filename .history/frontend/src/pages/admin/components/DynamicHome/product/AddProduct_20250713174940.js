import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../../../../constants.js";
import useHttp from "../../../../../hooks/useHttp"; // 👉 Đường dẫn đúng với file của bạn
import BarcodeScannerPopup from "../../BarcodeScannerPopup.js";
import "./style.scss";

const AddProduct = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState("/assets/images/preview-placeholder.png");
  const [imageFile, setImageFile] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [fileName, setFileName] = useState("");
  const { request } = useHttp();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Thêm sản phẩm:", { name, price, description, imageFile });

    setName("");
    setPrice("");
    setDescription("");
    setImagePreview("/assets/images/preview-placeholder.png");
    setImageFile(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFileName(file.name); // ✅ Cập nhật tên file
    }
  };
  

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleScanBarcode = () => {
    setShowScanner(true);
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
  };

  // ✅ Xử lý khi quét barcode thành công
  const handleBarcodeResult = async (barcode) => {
    console.log("📦 Mã quét được:", barcode);

    try {
      // Gọi API kiểm tra barcode dùng custom hook
      const data = await request(
        "GET",
        `${API_BASE}/api/admin/products/checkProductExistence?code=${barcode}`
      );

      if (data.exists&& data.product) {
        alert(`⚠️ Sản phẩm đã tồn tại!`);
        console.log(data.product.name)
        // Tự động điền form
        setName(data.product.name);
        setPrice(data.product.price);
        setDescription(data.product.description || "");
      } else {
        console.log("chưa tồn tại")
        // Sản phẩm chưa tồn tại → gán barcode vào tên
        setName(barcode);
      }
    } catch (error) {
      console.error("Lỗi kiểm tra sản phẩm:", error);
      alert(error.message || "Không thể kiểm tra sản phẩm. Vui lòng thử lại!");
    }

    setShowScanner(false); // Đóng popup sau khi xử lý xong
  };

  // ... Các phần code còn lại (return JSX, form, state, v.v.)


  return (
    <div className="form-add-product-wrapper">
      {showScanner && (
        <BarcodeScannerPopup
          onClose={handleCloseScanner}
          onScanSuccess={handleBarcodeResult}
        />
      )}

      <div className="barcode-wrapper">
        <div className="barcode-actions">
          <button className="btn-back" onClick={handleGoBack}>← Quay lại</button>
          <button className="btn-scan" onClick={handleScanBarcode}>Quét mã</button>
        </div>
      </div>

      <div className="left-panel">
      <h3>Hình ảnh sản phẩm</h3>
    
      <div className="image-preview-wrapper">
        <img src={imagePreview} alt="Preview" className="image-preview" />
        <div className="image-overlay">Kéo ảnh vào hoặc chọn ảnh từ máy</div>
      </div>
    
      <div className="file-input-wrapper">
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {/* Dòng hiển thị tên file */}
        {fileName && <div className="file-name">{fileName}</div>}
      </div>
    </div>

      <div className="right-panel">
        <h2>Thêm sản phẩm mới</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên sản phẩm</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên sản phẩm"
              required
            />
          </div>

          <div className="form-group">
            <label>Giá</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Nhập giá"
              required
            />
          </div>

          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả sản phẩm"
            />
          </div>

          <button type="submit" className="btn-primary">
            Thêm sản phẩm
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
