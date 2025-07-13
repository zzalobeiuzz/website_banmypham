import React, { useState, useEffect } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import ImageUploader from "../../../../../utils/patchedUploader";
import BarcodeScannerPopup from "../../BarcodeScannerPopup";
import "./style.scss";

// Đăng ký module imageUploader custom
Quill.register("modules/imageUploader", ImageUploader);

// ✅ Cấu hình toolbar và module imageUploader
const quillModules = {
  toolbar: {
    container: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike"],
      ["image", "link"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
      ["insertImageUrl"], // nút custom để dán URL ảnh
    ],
    handlers: {
      insertImageUrl: function () {
        const url = prompt("Nhập URL hình ảnh:");
        if (url) {
          const range = this.quill.getSelection();
          this.quill.insertEmbed(range.index, "image", url, "user");
        }
      },
    },
  },
  imageUploader: {
    upload: async (file) => {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_BASE}/api/admin/products/preview_upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.url) throw new Error("Không có URL trả về từ server");
      return data.url;
    },
  },
};

const AddProduct = () => {
  const navigate = useNavigate();
  const { request } = useHttp();

  // --- ✅ State quản lý thông tin sản phẩm ---
  const [productCode, setProductCode] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("");
  const [categoryID, setCategoryID] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [supplierID, setSupplierID] = useState("");
  const [isHot, setIsHot] = useState(false);

  // --- ✅ State quản lý danh mục ---
  const [categories, setCategories] = useState([]);

  // --- ✅ State ảnh ---
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [fileName, setFileName] = useState("");

  // --- ✅ State mô tả ---
  const [intro, setIntro] = useState("");
  const [usage, setUsage] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");

  // --- ✅ State barcode ---
  const [showScanner, setShowScanner] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // --- ✅ Lấy danh sách danh mục khi mount ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await request("GET", `${API_BASE}/api/admin/categories`);
        setCategories(data.categories || []);
      } catch (err) {
        console.error("Lỗi load danh mục:", err.message);
      }
    };
    fetchCategories();
  }, []);

  // --- ✅ Format giá ---
  const formatCurrency = (value) => {
    if (!value) return "";
    return new Intl.NumberFormat("vi-VN").format(Number(value)) + "đ";
  };

  // --- ✅ Xử lý thay đổi giá, chỉ cho nhập số ---
  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setPrice(raw);
  };

  // --- ✅ Xử lý submit form ---
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

    // Reset form sau khi submit
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

  // --- ✅ Xử lý chọn ảnh từ input file ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFileName(file.name);
    }
  };

  // --- ✅ Xử lý kéo ảnh vào (drag & drop) ---
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

  // --- ✅ Quay lại trang trước ---
  const handleGoBack = () => {
    navigate(-1);
  };

  // --- ✅ Mở popup quét barcode ---
  const handleScanBarcode = () => {
    setShowScanner(true);
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
  };

  // --- ✅ Xử lý kết quả quét barcode ---
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

      {/* Phần header barcode */}
      <div className="barcode-wrapper">
        <div className="barcode-actions">
          <button className="btn-back" onClick={handleGoBack}>← Quay lại</button>
          <h2>Thêm sản phẩm mới</h2>
          <button className="btn-scan" onClick={handleScanBarcode}>Quét mã</button>
        </div>
      </div>

      {/* Panel trái: ảnh */}
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

      {/* Panel phải: form */}
      <div className="right-panel">
        <form onSubmit={handleSubmit}>
          {/* Các input thông tin cơ bản */}
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

          {/* Các editor mô tả chi tiết */}
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

          <button type="submit" className="btn-primary">Thêm sản phẩm</button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
