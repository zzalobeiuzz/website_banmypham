import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../../../../constants.js";
import useHttp from "../../../../../hooks/useHttp";
import BarcodeScannerPopup from "../../BarcodeScannerPopup.js";
import "./style.scss";

const AddProduct = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [fileName, setFileName] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { request } = useHttp();

  // 🟢 Submit với FormData
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("ProductName", name);
    formData.append("Price", price);
    formData.append("Description", description);
    if (imageFile) {
      formData.append("Image", imageFile);
    }

    try {
      await request("POST", `${API_BASE}/api/admin/products`, formData, "Thêm sản phẩm");
      alert("Thêm sản phẩm thành công!");

      // Reset form
      setName("");
      setPrice("");
      setDescription("");
      setImageFile(null);
      setImagePreview("");
      setFileName("");
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Lỗi khi thêm sản phẩm");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFileName(file.name);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFileName(file.name);
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

  const handleBarcodeResult = async (barcode) => {
    console.log("📦 Mã quét được:", barcode);

    try {
      const data = await request(
        "GET",
        `${API_BASE}/api/admin/products/checkProductExistence?code=${barcode}`
      );

      if (data.exists && data.product) {
        alert(`⚠️ Sản phẩm đã tồn tại!`);
        setName(data.product.name);
        setPrice(data.product.price);
        setDescription(data.product.description || "");
      } else {
        setName(barcode);
      }
    } catch (error) {
      console.error("Lỗi kiểm tra sản phẩm:", error);
      alert(error.message || "Không thể kiểm tra sản phẩm. Vui lòng thử lại!");
    }

    setShowScanner(false);
  };

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
          <h2>Thêm sản phẩm mới</h2>
          <button className="btn-scan" onClick={handleScanBarcode}>Quét mã</button>
        </div>
      </div>

      <div className="left-panel">
        <h3>Hình ảnh sản phẩm</h3>
        <div
          className={`image-preview-wrapper ${isDragging ? "dragging" : ""}`}
          style={{
            backgroundImage: imageFile ? `url(${imagePreview})` : "none",
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!imageFile && <div className="image-overlay">Kéo ảnh vào hoặc chọn ảnh từ máy</div>}
        </div>

        <div className="file-input-wrapper">
          <label htmlFor="fileUpload" className="custom-file-label">Chọn ảnh</label>
          <input
            type="file"
            id="fileUpload"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
          {fileName && <div className="file-name">{fileName}</div>}
        </div>
      </div>

      <div className="right-panel">
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
