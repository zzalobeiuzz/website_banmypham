// 🧠 IMPORT CÁC THƯ VIỆN VÀ COMPONENT
import React, { useEffect, useState } from "react";
import ReactQuill, { Quill } from "react-quill"; // 📝 Trình soạn thảo văn bản
import "react-quill/dist/quill.snow.css";
import { useNavigate } from "react-router-dom"; // 🔙 Điều hướng
import { API_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp"; // 🌐 Hook gọi API
import ImageUploader from "../../../../../utils/patchedUploader"; // 📷 Upload ảnh
import BarcodeScannerPopup from "../../BarcodeScannerPopup"; // 📦 Popup quét mã
import Notification from "../../Notification"; // 🔔 Thông báo

import "./style.scss";

// 🧩 Đăng ký module upload ảnh cho ReactQuill
Quill.register("modules/imageUploader", ImageUploader);

// ✍️ Cấu hình thanh công cụ của trình soạn thảo
const quillModules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["image", "link"],
    ["clean"],
  ],
  imageUploader: {
    upload: async (file) => {
      // 📥 Đọc ảnh thành base64 bằng FileReader
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); // ✅ Trả về base64
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
  },
};

// ⬆️ Scroll lên đầu trang smooth
const scrollToTop = () => {
  document.querySelector(".home")?.scrollTo({ top: 0, behavior: "smooth" });
};

const AddProduct = () => {
  const navigate = useNavigate();
  const { request } = useHttp();

  // 🧾 State lưu thông tin sản phẩm đang nhập
  const [productData, setProductData] = useState({
    productCode: "",
    name: "",
    price: "",
    type: "",
    stockQuantity: "",
    supplierID: "",
    isHot: false,
    intro: "",
    usage: "",
    ingredients: "",
    instructions: "",
  });

  const [notify, setNotify] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  // 🗂️ Danh mục - danh mục con
  const [categories, setCategories] = useState([]);
  const [selectedCategoryID, setSelectedCategoryID] = useState("");
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategoryID, setSelectedSubCategoryID] = useState("");

  // 📸 Ảnh sản phẩm
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [fileName, setFileName] = useState("");

  const [showScanner, setShowScanner] = useState(false); // 📷 Popup quét mã
  const [isDragging, setIsDragging] = useState(false);   // 🖱️ Drag ảnh
  const [isSubmitting, setIsSubmitting] = useState(false); // 🕓 Loading

  // 📥 Gọi API lấy danh mục sản phẩm khi load lần đầu
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

  // 🔔 Hàm hiện thông báo
  const showNotification = (message, type = "success") => {
    setNotify({ visible: true, message, type });
  };

  // 🖊️ Hàm cập nhật state productData
  const handleChange = (key, value) => {
    setProductData((prev) => ({ ...prev, [key]: value }));
  };

  // 🗂️ Chọn danh mục cha sẽ filter danh mục con
  const handleCategoryChange = (e) => {
    const catID = e.target.value;
    setSelectedCategoryID(catID);
    setSelectedSubCategoryID("");
    const category = categories.find((c) => c.CategoryID === catID);
    setSubCategories(category?.SubCategories || []);
  };

  // 💰 Format số tiền VNĐ
  const formatCurrency = (value) => {
    if (!value) return "";
    return Number(value).toLocaleString("vi-VN") + "đ";
  };

  // 🖊️ Xử lý thay đổi ô nhập giá
  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    handleChange("price", raw);
  };

  // 📤 Submit form thêm sản phẩm
  const handleSubmitAdd = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("ProductID", productData.productCode);
      formData.append("ProductName", productData.name);
      formData.append("Price", productData.price);
      formData.append("Type", productData.type);
      formData.append("CategoryID", selectedCategoryID);
      formData.append("SubCategoryID", selectedSubCategoryID);
      formData.append("StockQuantity", productData.stockQuantity);
      formData.append("SupplierID", productData.supplierID);
      formData.append("IsHot", productData.isHot ? 1 : 0);
      formData.append("Intro", productData.intro);
      formData.append("Usage", productData.usage);
      formData.append("Ingredients", productData.ingredients);
      formData.append("Instructions", productData.instructions);
      formData.append("Image", imageFile);
      const detailID = `DTL_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      formData.append("DetailID", detailID);

      const res = await request("POST", `${API_BASE}/api/admin/products/add`, formData);

      if (res.success) {
        scrollToTop();
        showNotification("✅ Thêm sản phẩm thành công!", "success");

        // 🔁 Reset lại form
        setProductData({
          productCode: "",
          name: "",
          price: "",
          type: "",
          stockQuantity: "",
          supplierID: "",
          isHot: false,
          intro: "",
          usage: "",
          ingredients: "",
          instructions: "",
        });
        setSelectedCategoryID("");
        setSelectedSubCategoryID("");
        setSubCategories([]);
        setImageFile(null);
        setImagePreview("");
        setFileName("");
      } else {
        showNotification("❌ Thêm sản phẩm thất bại!", "error");
      }
    } catch (error) {
      showNotification(`❌ Lỗi: ${error.message || "Không xác định"}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 📂 Chọn ảnh từ máy
  const handleImageChange = (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setFileName(file.name);
      e.target.value = ""; // Cho phép chọn lại cùng file
    }
  };

  // 🖱️ Kéo ảnh vào dropzone
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setFileName(file.name);
      }
    } else if (e.dataTransfer.items && e.dataTransfer.items[0]) {
      const item = e.dataTransfer.items[0];
      if (item.kind === "string" && item.type === "text/uri-list") {
        item.getAsString((url) => {
          setImagePreview(url);
          setFileName(url.split("/").pop());
          setImageFile(null);
        });
      }
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

  const handleScanBarcode = () => setShowScanner(true);
  const handleCloseScanner = () => setShowScanner(false);

  // 📦 Kết quả quét mã
  const handleBarcodeResult = async (barcode) => {
    try {
      const data = await request("GET", `${API_BASE}/api/admin/products/checkProductExistence?code=${barcode}`);
      if (data.exists && data.product) {
        alert("⚠️ Sản phẩm đã tồn tại!");
        setProductData({
          productCode: data.product.id || "",
          name: data.product.name,
          price: data.product.price,
          type: data.product.type || "",
          stockQuantity: data.product.stockQuantity || "",
          supplierID: data.product.supplierID || "",
          isHot: data.product.isHot === 1,
          intro: "",
          usage: "",
          ingredients: "",
          instructions: "",
        });
        setSelectedCategoryID(data.product.categoryId || "");
        setSelectedSubCategoryID(data.product.subCategoryId || "");

        const category = categories.find((c) => c.CategoryID === data.product.categoryId);
        setSubCategories(category?.SubCategories || []);
      } else {
        handleChange("productCode", barcode);
      }
    } catch (err) {
      alert(err.message || "Lỗi kiểm tra sản phẩm!");
    }
    setShowScanner(false);
  };

  // 🔙 Trở lại trang trước
  const handleGoBack = () => navigate(-1);

  return null; // JSX bỏ qua ở đây để tập trung vào comment logic
};

export default AddProduct;


    return (
      <div className="form-add-product-wrapper">
        {showScanner && (
          <BarcodeScannerPopup
            onClose={handleCloseScanner}
            onScanSuccess={handleBarcodeResult}
          />
        )}
        {notify.visible && (
          <Notification
            message={notify.message}
            type={notify.type}
            onClose={() => setNotify({ ...notify, visible: false })}  // "Có"
            onConfirm={handleGoBack}                                  // "Không"
          />
        )}

        <div className="barcode-wrapper">
          <div className="barcode-actions">
            <button type="button" className="btn-back" onClick={handleGoBack}>
              ← Quay lại
            </button>
            <h2>Thêm sản phẩm mới</h2>
            <button type="button" className="btn-scan" onClick={handleScanBarcode}>
              Quét mã
            </button>
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
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitAdd();
            }}>
            <div className="form-group d-flex">
              <div className="input-id w-25">
                <label>Mã sản phẩm</label>
                <input
                  type="text"
                  value={productData.productCode}
                  onChange={(e) => handleChange("productCode", e.target.value)}
                  required
                />
              </div>
              <div className="input-name flex-fill">
                <label>Tên sản phẩm</label>
                <input
                  type="text"
                  value={productData.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    console.log("Tên sản phẩm thay đổi:", fileName);
                    handleChange("name", value);
                  }}
                  required
                />
              </div>
            </div>

            <div className="form-group d-flex flex-wrap gap-2">
              <div className="input-price">
                <label>Giá</label>
                <input
                  type="text"
                  value={formatCurrency(productData.price)}
                  onChange={handlePriceChange}
                  required
                />
              </div>

              <div className="input-category w-25">
                <label>Danh mục</label>
                <select value={selectedCategoryID} onChange={handleCategoryChange}>
                  <option value="">Chọn danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.CategoryID} value={cat.CategoryID}>{cat.CategoryName}</option>
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
                    <option key={sub.SubCategoryID} value={sub.SubCategoryID}>{sub.SubCategoryName}</option>
                  ))}
                </select>
              </div>

              <div className="input-stock">
                <label>Số lượng tồn</label>
                <input
                  type="number"
                  value={productData.stockQuantity}
                  onChange={(e) => handleChange("stockQuantity", e.target.value)}
                />
              </div>

              <div className="input-supplier">
                <label>Nhà cung cấp</label>
                <input
                  type="text"
                  value={productData.supplierID}
                  onChange={(e) => handleChange("supplierID", e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Mô tả (Giới thiệu)</label>
              <ReactQuill
                theme="snow"
                value={productData.intro}
                onChange={(val) => handleChange("intro", val)}
                modules={quillModules}
              />
            </div>

            <div className="form-group">
              <label>Công dụng</label>
              <ReactQuill
                theme="snow"
                value={productData.usage}
                onChange={(val) => handleChange("usage", val)}
                modules={quillModules}
              />
            </div>

            <div className="form-group">
              <label>Thành phần</label>
              <ReactQuill
                theme="snow"
                value={productData.ingredients}
                onChange={(val) => handleChange("ingredients", val)}
                modules={quillModules}
              />
            </div>

            <div className="form-group">
              <label>Hướng dẫn sử dụng</label>
              <ReactQuill
                theme="snow"
                value={productData.instructions}
                onChange={(val) => handleChange("instructions", val)}
                modules={quillModules}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang thêm..." : "Thêm sản phẩm"}
            </button>
          </form>
        </div>
      </div>
    );
  };

  export default AddProduct;
