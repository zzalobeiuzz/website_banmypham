import React, { useEffect, useState } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import ImageUploader from "../../../../../utils/patchedUploader";
import BarcodeScannerPopup from "../../BarcodeScannerPopup";
import "./style.scss";

// Đăng ký module imageUploader cho Quill
Quill.register("modules/imageUploader", ImageUploader);

const quillModules = {
  toolbar: {
    container: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike"],
      ["image", "link"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
      ["insertImageUrl"],
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

  // State form
  const [productCode, setProductCode] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [supplierID, setSupplierID] = useState("");
  const [isHot, setIsHot] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [fileName, setFileName] = useState("");

  const [intro, setIntro] = useState("");
  const [usage, setUsage] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");

  const [categories, setCategories] = useState([]);
  const [selectedCategoryID, setSelectedCategoryID] = useState("");
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategoryID, setSelectedSubCategoryID] = useState("");

  const [showScanner, setShowScanner] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await request("GET", `${API_BASE}/api/user/products/loadCategory`);
        setCategories(res.data || []);
      } catch (error) {
        console.error("Lỗi lấy danh mục:", error.message);
      }
    };
    fetchCategories();
  }, [request]);

  // Khi chọn danh mục
  const handleCategoryChange = (e) => {
    const catID = e.target.value;
    setSelectedCategoryID(catID);
    setSelectedSubCategoryID("");
    const category = categories.find((c) => c.CategoryID === catID);
    setSubCategories(category?.SubCategories || []);
  };

  const formatCurrency = (value) => {
    if (!value) return "";
    return Number(value).toLocaleString("vi-VN");
  };

  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setPrice(raw);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!imageFile) {
        alert("⚠️ Vui lòng chọn hoặc kéo thả hình ảnh sản phẩm!");
        return;
      }

      const formData = new FormData();
      formData.append("ProductCode", productCode);
      formData.append("Name", name);
      formData.append("Price", price);
      formData.append("Type", type);
      formData.append("CategoryID", selectedCategoryID);
      formData.append("SubCategoryID", selectedSubCategoryID);
      formData.append("StockQuantity", stockQuantity);
      formData.append("SupplierID", supplierID);
      formData.append("IsHot", isHot ? 1 : 0);
      formData.append("Intro", intro);
      formData.append("Usage", usage);
      formData.append("Ingredients", ingredients);
      formData.append("Instructions", instructions);
      formData.append("Image", imageFile);

      await request("POST", `${API_BASE}/api/admin/products/add`, formData, "Lưu sản phẩm", {
        "Content-Type": "multipart/form-data",
      });

      alert("✅ Lưu sản phẩm thành công!");
      navigate(-1);
    } catch (error) {
      alert(`❌ Lưu thất bại: ${error.message || "Lỗi không xác định"}`);
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

  // Barcode scanner
  const handleScanBarcode = () => setShowScanner(true);
  const handleCloseScanner = () => setShowScanner(false);

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
        setSelectedCategoryID(data.product.categoryId || "");
        setSelectedSubCategoryID(data.product.subCategoryId || "");
        setStockQuantity(data.product.stockQuantity || "");
        setSupplierID(data.product.supplierID || "");
        setIsHot(data.product.isHot === 1);

        const category = categories.find((c) => c.CategoryID === data.product.categoryId);
        setSubCategories(category?.SubCategories || []);
      } else {
        setProductCode(barcode);
      }
    } catch (err) {
      alert(err.message || "Lỗi kiểm tra sản phẩm!");
    }
    setShowScanner(false);
  };

  const handleGoBack = () => navigate(-1);

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
              <select value={selectedCategoryID} onChange={handleCategoryChange}>
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.CategoryID} value={cat.CategoryID}>
                    {cat.CategoryName}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-type">
              <label>Danh mục con</label>
              <select
                value={selectedSubCategoryID}
                onChange={(e) => setSelectedSubCategoryID(e.target.value)}
                disabled={!selectedCategoryID}
              >
                <option value="">Chọn danh mục con</option>
                {subCategories.map((sub) => (
                  <option key={sub.SubCategoryID} value={sub.SubCategoryID}>
                    {sub.SubCategoryName}
                  </option>
                ))}
              </select>
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

          <button type="submit" className="btn-primary">Thêm sản phẩm</button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
