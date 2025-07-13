import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../../../../constants.js";
import useHttp from "../../../../../hooks/useHttp";
import BarcodeScannerPopup from "../../BarcodeScannerPopup.js";
import "./style.scss";

const AddProduct = () => {
  const navigate = useNavigate();

  // State dữ liệu
  const [productCode, setProductCode] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [categoryID, setCategoryID] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [supplierID, setSupplierID] = useState("");
  const [isHot, setIsHot] = useState(false);

  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { request } = useHttp();

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Thêm sản phẩm:", {
      productCode,
      name,
      price,
      description,
      type,
      categoryID,
      stockQuantity,
      supplierID,
      isHot,
      imageFile,
    });

    // Reset form
    setProductCode("");
    setName("");
    setPrice("");
    setDescription("");
    setType("");
    setCategoryID("");
    setStockQuantity("");
    setSupplierID("");
    setIsHot(false);
    setImagePreview("");
    setImageFile(null);
    setFileName("");
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
        setProductCode(data.product.id || "");
        setName(data.product.name);
        setPrice(data.product.price);
        setDescription(data.product.description || "");
        setType(data.product.type || "");
        setCategoryID(data.product.categoryId || "");
        setStockQuantity(data.product.stockQuantity || "");
        setSupplierID(data.product.supplierID || "");
        setIsHot(data.product.isHot === 1);
      } else {
        setProductCode(barcode);
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
          <div className="input-id">
            <label>Mã sản phẩm (Product Code)</label>
            <input
              type="text"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              placeholder="Nhập mã sản phẩm"
              required
            />
            </div>
          </div>

          <div className="form-group">
            
              <label>Tên sản phẩm</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên sản phẩm"
                required
              />
            
            <div className="input-name">
              <label>Giá</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Nhập giá"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả sản phẩm"
            />
          </div>

          <div className="form-group">
            <label>Loại (Type)</label>
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Loại sản phẩm"
            />
          </div>

          <div className="form-group">
            <label>Danh mục (Category ID)</label>
            <input
              type="text"
              value={categoryID}
              onChange={(e) => setCategoryID(e.target.value)}
              placeholder="ID danh mục"
            />
          </div>

          <div className="form-group">
            <label>Số lượng tồn (Stock Quantity)</label>
            <input
              type="number"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              placeholder="Số lượng tồn kho"
            />
          </div>

          <div className="form-group">
            <label>Nhà cung cấp (Supplier ID)</label>
            <input
              type="text"
              value={supplierID}
              onChange={(e) => setSupplierID(e.target.value)}
              placeholder="ID nhà cung cấp"
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
