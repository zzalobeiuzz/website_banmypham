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

  // Các handler khác (submit, image, barcode...) giữ nguyên
  // ...

  // --- ✅ Handler submit giữ nguyên (bạn copy từ code trước) ---

  return (
    <div className="form-add-product-wrapper">
      {showScanner && (
        <BarcodeScannerPopup
          onClose={() => setShowScanner(false)}
          onScanSuccess={handleBarcodeResult}
        />
      )}

      <div className="barcode-wrapper">
        <div className="barcode-actions">
          <button className="btn-back" onClick={() => navigate(-1)}>← Quay lại</button>
          <h2>Thêm sản phẩm mới</h2>
          <button className="btn-scan" onClick={() => setShowScanner(true)}>Quét mã</button>
        </div>
      </div>

      {/* Panel trái ảnh giữ nguyên */}

      <div className="right-panel">
        <form onSubmit={handleSubmit}>
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
              <select value={categoryID} onChange={(e) => setCategoryID(e.target.value)}>
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
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

          {/* Các editor giữ nguyên */}

          <button type="submit" className="btn-primary">Thêm sản phẩm</button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
