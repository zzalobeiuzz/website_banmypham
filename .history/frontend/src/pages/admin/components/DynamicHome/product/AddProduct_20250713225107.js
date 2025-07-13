import ImageUploader from "quill-image-uploader";
import React, { useState } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import BarcodeScannerPopup from "../../BarcodeScannerPopup";
import "./style.scss";

// Đăng ký module imageUploader
Quill.register("modules/imageUploader", ImageUploader);

const AddProduct = () => {
  const navigate = useNavigate();
  const { request } = useHttp();

  // States
  const [productCode, setProductCode] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("");
  const [categoryID, setCategoryID] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [supplierID, setSupplierID] = useState("");
  const [isHot, setIsHot] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [fileName, setFileName] = useState("");

  const [intro, setIntro] = useState("");
  const [usage, setUsage] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");

  const [showScanner, setShowScanner] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Format VNĐ
  const formatCurrency = (value) => {
    if (!value) return "";
    return new Intl.NumberFormat("vi-VN").format(Number(value)) + "đ";
  };

  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setPrice(raw);
  };

  // Quill modules
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike"],
      ["image", "link"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
    ],
    imageUploader: {
      upload: async (file) => {
        try {
          const formData = new FormData();
          formData.append("image", file);
    
          const res = await fetch(`${API_BASE}/api/admin/products/preview_upload`, {
            method: "POST",
            body: formData,
          });
    
          const data = await res.json();
          console.log("✅ Server trả về:", data);
    
          if (!data.url) {
            throw new Error("Không có URL trả về từ server");
          }
    
          return data.url;
        } catch (error) {
          console.error("❌ Lỗi upload ảnh:", error);
          // Throw để Quill hiển thị lỗi, không crash
          throw error;
        }
      },
    },
    
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({
      productCode,
      name,
      price,
      type,
      categoryID,
      stockQuantity,
      supplierID,
      isHot,
      imageFile,
      intro,
      usage,
      ingredients,
      instructions,
    });

    // Reset
    setProductCode("");
    setName("");
    setPrice("");
    setType("");
    setCategoryID("");
    setStockQuantity("");
    setSupplierID("");
    setIsHot(false);
    setImagePreview("");
    setImageFile(null);
    setFileName("");
    setIntro("");
    setUsage("");
    setIngredients("");
    setInstructions("");
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
    try {
      const data = await request(
        "GET",
        `${API_BASE}/api/admin/products/checkProductExistence?code=${barcode}`
      );
      if (data.exists && data.product) {
        alert("⚠️ Sản phẩm đã tồn tại!");
        setProductCode(data.product.id || "");
        setName(data.product.name);
        setPrice(data.product.price);
        setType(data.product.type || "");
        setCategoryID(data.product.categoryId || "");
        setStockQuantity(data.product.stockQuantity || "");
        setSupplierID(data.product.supplierID || "");
        setIsHot(data.product.isHot === 1);
      } else {
        setProductCode(barcode);
      }
    } catch (err) {
      alert(err.message || "Lỗi kiểm tra sản phẩm!");
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
          style={{ backgroundImage: imageFile ? `url(${imagePreview})` : "none" }}
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
          {/* Inputs */}
          <div className="form-group d-flex">
            <div className="input-id w-25">
              <label>Mã sản phẩm</label>
              <input type="text" value={productCode} onChange={(e) => setProductCode(e.target.value)} required />
            </div>
            <div className="input-name flex-fill">
              <label>Tên sản phẩm</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          </div>
          {/* Giá & khác */}
          <div className="form-group d-flex flex-wrap gap-2">
            <div className="input-price">
              <label>Giá</label>
              <input type="text" value={formatCurrency(price)} onChange={handlePriceChange} required />
            </div>
            <div className="input-category w-25">
              <label>Danh mục</label>
              <input type="text" value={categoryID} onChange={(e) => setCategoryID(e.target.value)} />
            </div>
            <div className="input-type">
              <label>Loại</label>
              <input type="text" value={type} onChange={(e) => setType(e.target.value)} />
            </div>
            <div className="input-stock">
              <label>Số lượng tồn</label>
              <input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} />
            </div>
            <div className="input-supplier">
              <label>Nhà cung cấp</label>
              <input type="text" value={supplierID} onChange={(e) => setSupplierID(e.target.value)} />
            </div>
          </div>

          {/* Mô tả */}
          <div className="form-group"><label>Mô tả (Giới thiệu)</label>
            <ReactQuill theme="snow" value={intro} onChange={setIntro} modules={quillModules} />
          </div>
          <div className="form-group"><label>Công dụng</label>
            <ReactQuill theme="snow" value={usage} onChange={setUsage} modules={quillModules} />
          </div>
          <div className="form-group"><label>Thành phần</label>
            <ReactQuill theme="snow" value={ingredients} onChange={setIngredients} modules={quillModules} />
          </div>
          <div className="form-group"><label>Hướng dẫn sử dụng</label>
            <ReactQuill theme="snow" value={instructions} onChange={setInstructions} modules={quillModules} />
          </div>

          <div className="form-group">
            <label>
              <input type="checkbox" checked={isHot} onChange={(e) => setIsHot(e.target.checked)} /> Hot
            </label>
          </div>

          <button type="submit" className="btn-primary">Thêm sản phẩm</button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
