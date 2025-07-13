import ImageUploader from "quill-image-uploader";
import React, { useState } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../../../../constants.js";
import useHttp from "../../../../../hooks/useHttp";
import BarcodeScannerPopup from "../../BarcodeScannerPopup.js";
import "./style.scss";

// Đăng ký module image uploader
Quill.register("modules/imageUploader", ImageUploader);

const AddProduct = () => {
  const navigate = useNavigate();
  const { request } = useHttp();

  // 🌟 State lưu dữ liệu sản phẩm
  const [productCode, setProductCode] = useState("");      // 🔖 Mã sản phẩm
  const [name, setName] = useState("");                   // 🏷️ Tên sản phẩm
  const [price, setPrice] = useState("");                 // 💰 Giá
  const [type, setType] = useState("");                   // 🗂️ Loại
  const [categoryID, setCategoryID] = useState("");       // 📁 ID danh mục
  const [stockQuantity, setStockQuantity] = useState(""); // 📦 Số lượng tồn
  const [supplierID, setSupplierID] = useState("");       // 🚚 Nhà cung cấp
  const [isHot, setIsHot] = useState(false);             // 🔥 Hot

  // 🖼️ State xử lý ảnh
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [fileName, setFileName] = useState("");

  // 🎥 State scanner barcode
  const [showScanner, setShowScanner] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // ✨ Các phần mô tả riêng
  const [intro, setIntro] = useState("");          // 📝 Mô tả (Giới thiệu)
  const [usage, setUsage] = useState("");          // 💡 Công dụng
  const [ingredients, setIngredients] = useState(""); // 🧪 Thành phần
  const [instructions, setInstructions] = useState(""); // 📄 Hướng dẫn sử dụng

  // 🔧 Config Quill modules
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
        const formData = new FormData();
        formData.append("image", file);

        // Gửi lên API upload ảnh (em đổi URL API của em nhé)
        const res = await fetch(`${API_BASE}/api/admin/products/priview_upload`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        return data.url; // API trả về URL ảnh => ReactQuill sẽ tự chèn
      },
    },
  };

  // 🔢 Format giá VNĐ
  const formatCurrency = (value) => {
    if (!value) return "";
    return new Intl.NumberFormat("vi-VN").format(Number(value)) + "đ";
  };

  // 💰 Xử lý thay đổi giá
  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setPrice(raw);
  };

  // ✅ Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Thêm sản phẩm:", {
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

    // Reset form
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

  // 🖼️ Xử lý ảnh
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

  // 🔙 Quay lại
  const handleGoBack = () => {
    navigate(-1);
  };

  // 📷 Mở scanner
  const handleScanBarcode = () => {
    setShowScanner(true);
  };
  const handleCloseScanner = () => {
    setShowScanner(false);
  };

  // ✅ Kết quả barcode
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

      {/* 🔎 Header */}
      <div className="barcode-wrapper">
        <div className="barcode-actions">
          <button className="btn-back" onClick={handleGoBack}>← Quay lại</button>
          <h2>Thêm sản phẩm mới</h2>
          <button className="btn-scan" onClick={handleScanBarcode}>Quét mã</button>
        </div>
      </div>

      {/* 🖼️ Panel ảnh */}
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

      {/* 📝 Panel form */}
      <div className="right-panel">
        <form onSubmit={handleSubmit}>
          <div className="form-group d-flex">
            <div className="input-id w-25">
              <label>Mã sản phẩm</label>
              <input
                type="text"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="Nhập mã sản phẩm"
                required
              />
            </div>
            <div className="input-name flex-fill">
              <label>Tên sản phẩm</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên sản phẩm"
                required
              />
            </div>
          </div>

          <div className="form-group d-flex flex-wrap gap-2">
            <div className="input-price">
              <label>Giá</label>
              <input
                type="text"
                value={formatCurrency(price)}
                onChange={handlePriceChange}
                placeholder="Nhập giá"
                required
              />
            </div>
            <div className="input-category w-25">
              <label>Danh mục</label>
              <input
                type="text"
                value={categoryID}
                onChange={(e) => setCategoryID(e.target.value)}
                placeholder="ID danh mục"
              />
            </div>
            <div className="input-type">
              <label>Loại</label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="Loại sản phẩm"
              />
            </div>
            <div className="input-stock">
              <label>Số lượng tồn</label>
              <input
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="Số lượng tồn kho"
              />
            </div>
            <div className="input-supplier">
              <label>Nhà cung cấp</label>
              <input
                type="text"
                value={supplierID}
                onChange={(e) => setSupplierID(e.target.value)}
                placeholder="ID nhà cung cấp"
              />
            </div>
          </div>

          {/* 📝 Các phần mô tả HTML */}
          <div className="form-group">
            <label>Mô tả (Giới thiệu)</label>
            <ReactQuill theme="snow" value={intro} onChange={setIntro} modules={quillModules} />
          </div>

          <div className="form-group">
            <label>Công dụng</label>
            <ReactQuill theme="snow" value={usage} onChange={setUsage} modules={quillModules} />
          </div>

          <div className="form-group">
            <label>Thành phần</label>
            <ReactQuill theme="snow" value={ingredients} onChange={setIngredients} modules={quillModules} />
          </div>

          <div className="form-group">
            <label>Hướng dẫn sử dụng</label>
            <ReactQuill theme="snow" value={instructions} onChange={setInstructions} modules={quillModules} />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={isHot}
                onChange={(e) => setIsHot(e.target.checked)}
              />{" "}
              Hot
            </label>
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
