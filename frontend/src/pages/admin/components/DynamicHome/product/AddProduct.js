// ==================== 🧠 IMPORT CÁC THƯ VIỆN VÀ COMPONENT ====================
import React, { useEffect, useRef, useState } from "react";
import ReactQuill, { Quill } from "react-quill"; // 📝 Trình soạn thảo văn bản
import "react-quill/dist/quill.snow.css";
import JsBarcode from "jsbarcode";
import { useNavigate } from "react-router-dom"; // 🔙 Điều hướng khi người dùng bấm Quay lại
import { API_BASE } from "../../../../../constants"; // 🌍 Địa chỉ API gốc
import useHttp from "../../../../../hooks/useHttp"; // 🌐 Custom hook gọi API
import ImageUploader from "../../../../../utils/patchedUploader"; // 📷 Upload ảnh custom cho ReactQuill
import BarcodeScannerPopup from "../../BarcodeScannerPopup"; // 📦 Popup quét mã barcode
import Notification from "../../Notification"; // 🔔 Component hiển thị thông báo

import "./style.scss";

// ==================== 📝 ĐĂNG KÝ MODULE CHO TRÌNH SOẠN THẢO ====================
Quill.register("modules/imageUploader", ImageUploader);

// ==================== ⚙️ CẤU HÌNH TOOLBAR CHO REACT QUILL ====================
const quillModules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["image", "link"],
    ["clean"],
  ],
  imageUploader: {
    // 📤 Hàm upload ảnh vào trình soạn thảo → Chuyển file thành base64
    upload: async (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); // ✅ Trả về chuỗi base64
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
  },
};

// ==================== ⬆️ SCROLL LÊN ĐẦU TRANG ====================
const scrollToTop = () => {
  document.querySelector(".home")?.scrollTo({ top: 0, behavior: "smooth" });
};

// ==================== 🧩 COMPONENT CHÍNH: AddProduct ====================
const AddProduct = () => {
  const navigate = useNavigate();
  const { request } = useHttp(); // 🌐 Gọi API
  const barcodeSvgRef = useRef(null);

  // 🧾 STATE: Dữ liệu sản phẩm đang được nhập
  const [productData, setProductData] = useState({
    productCode: "",       // 🔢 Mã sản phẩm
    barcode: "",           // 📶 Barcode sản phẩm
    name: "",              // 🏷️ Tên sản phẩm
    price: "",             // 💰 Giá
    type: "",              // 📦 Loại sản phẩm (thường để trống nếu không cần)
    stockQuantity: "",     // 📦 Số lượng tồn kho
    supplierID: "",        // 🏭 Nhà cung cấp
    isHot: false,          // 🔥 Sản phẩm hot (đặc biệt)
    intro: "",             // 📖 Mô tả ngắn (giới thiệu)
    usage: "",             // 🛠️ Công dụng
    ingredients: "",       // 🧪 Thành phần
    instructions: "",      // 📋 Hướng dẫn sử dụng
  });

  // 🔔 STATE: Hiển thị thông báo
  const [notify, setNotify] = useState({
    visible: false,       // 👁️ Có hiển thị hay không
    message: "",          // 💬 Nội dung thông báo
    type: "success",      // ✅ success hoặc ❌ error
  });

  // 🗂️ STATE: Danh mục chính / phụ
  const [categories, setCategories] = useState([]); // 📚 Danh sách danh mục chính
  const [selectedCategoryID, setSelectedCategoryID] = useState(""); // 🏷️ ID danh mục đang chọn
  const [subCategories, setSubCategories] = useState([]);           // 📚 Danh sách danh mục con theo danh mục chính
  const [selectedSubCategoryID, setSelectedSubCategoryID] = useState(""); // 🏷️ ID danh mục con

  // 📸 STATE: Quản lý hình ảnh
  const [imageFile, setImageFile] = useState(null);       // 🖼️ File ảnh upload
  const [imagePreview, setImagePreview] = useState("");   // 👀 Ảnh xem trước
  const [fileName, setFileName] = useState("");           // 📝 Tên file ảnh

  // 🧪 STATE: Popup & tương tác UI
  const [showScanner, setShowScanner] = useState(false); // 📷 Bật/tắt popup quét barcode
  const [isDragging, setIsDragging] = useState(false);   // 🖱️ Có đang kéo thả ảnh không
  const [isSubmitting, setIsSubmitting] = useState(false); // ⏳ Đang gửi form không

  // ==================== 📥 LOAD DANH MỤC SẢN PHẨM ====================
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await request("GET", `${API_BASE}/api/user/products/loadCategory`);
        setCategories(res.data || []);
      } catch (error) {
        console.error("❌ Lỗi lấy danh mục:", error.message);
      }
    };
    fetchCategories();
  }, [request]);

  // ==================== 🔔 HÀM HIỂN THỊ THÔNG BÁO ====================
  const showNotification = (message, type = "success") => {
    setNotify({ visible: true, message, type });
  };

  // ==================== 🧾 RENDER MÃ VẠCH ====================
  useEffect(() => {
    const barcodeValue = (productData.barcode || "").trim();
    if (!barcodeSvgRef.current) return;

    if (!barcodeValue) {
      barcodeSvgRef.current.innerHTML = "";
      return;
    }

    try {
      JsBarcode(barcodeSvgRef.current, barcodeValue, {
        format: "CODE128",
        displayValue: false,
        width: 1.6,
        height: 58,
        margin: 0,
        background: "#f8fbff",
        lineColor: "#111",
      });
    } catch (err) {
      console.warn("Khong the tao barcode:", err.message);
      barcodeSvgRef.current.innerHTML = "";
    }
  }, [productData.barcode]);

  // ==================== ✍️ CẬP NHẬT STATE SẢN PHẨM ====================
  const handleChange = (key, value) => {
    setProductData((prev) => ({ ...prev, [key]: value }));
  };

  // ==================== 📂 CHỌN DANH MỤC → LOAD DANH MỤC CON ====================
  const handleCategoryChange = (e) => {
    const catID = e.target.value;
    setSelectedCategoryID(catID);
    setSelectedSubCategoryID(""); // Reset subCategory khi thay đổi danh mục
    const category = categories.find((c) => c.CategoryID === catID);
    setSubCategories(category?.SubCategories || []);
  };

  // ==================== 💰 FORMAT GIÁ TIỀN VND ====================
  const formatCurrency = (value) => {
    if (!value) return "";
    return Number(value).toLocaleString("vi-VN") + "đ";
  };

  // ==================== ✍️ XỬ LÝ KHI NHẬP GIÁ ====================
  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, ""); // Xóa ký tự không phải số
    handleChange("price", raw);
  };

  // ==================== 📤 GỬI FORM THÊM SẢN PHẨM ====================
  const handleSubmitAdd = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("ProductID", productData.productCode);
      formData.append("Barcode", productData.barcode);
      formData.append("ProductName", productData.name);
      formData.append("Price", productData.price);
      formData.append("Type", productData.type);
      formData.append("CategoryID", selectedCategoryID);
      formData.append("SubCategoryID", selectedSubCategoryID);
      formData.append("StockQuantity", productData.stockQuantity);
      formData.append("SupplierID", productData.supplierID);
      formData.append("IsHot", productData.isHot ? 1 : 0);
      formData.append("ProductDescription", productData.intro);
      formData.append("Usage", productData.usage);
      formData.append("Ingredients", productData.ingredients);
      formData.append("Instructions", productData.instructions);
      formData.append("Image", imageFile);

      // 🔧 Sinh mã DetailID ngẫu nhiên
      const detailID = `DTL_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      formData.append("DetailID", detailID);

      // 📡 Gửi lên API
      const res = await request("POST", `${API_BASE}/api/admin/products/add`, formData);

      if (res.success) {
        scrollToTop();
        showNotification("Thêm sản phẩm thành công!", "success");

        // 🔄 Reset lại toàn bộ form khi thêm sản phẩm thành công
        setProductData({
          productCode: "",
          barcode: "",
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

  // ==================== 🖼️ CHỌN ẢNH TỪ MÁY ====================
  const handleImageChange = (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setFileName(file.name);
      e.target.value = ""; // Cho phép chọn lại file cũ
    }
  };

  // ==================== 🖱️ XỬ LÝ DRAG & DROP ẢNH ====================
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setFileName(file.name);
      }
    } else if (e.dataTransfer.items?.[0]) {
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

  // ==================== 📷 BẬT POPUP QUÉT MÃ BARCODE ====================
  const handleScanBarcode = () => setShowScanner(true);
  const handleCloseScanner = () => setShowScanner(false);

  // ==================== 📦 KẾT QUẢ TỪ QUÉT MÃ ====================
  const handleBarcodeResult = async (barcode) => {
    try {
      const data = await request("GET", `${API_BASE}/api/admin/products/checkProductExistence?barcode=${barcode}`);
      if (data.exists && data.product) {
        alert("⚠️ Sản phẩm đã tồn tại!");
        setProductData({
          productCode: data.product.id || "",
          barcode: data.product.barcode || barcode,
          name: data.product.name || "",
          price: data.product.price || "",
          type: data.product.type || "",
          stockQuantity: data.product.stockQuantity || "",
          supplierID: data.product.supplierId || "",   // ✅ lưu ý: supplierId, không phải supplierID
          isHot: data.product.isHot === 1,
        
          // ✅ Lấy từ product.detail nếu có, nếu không thì để rỗng
          intro: data.product.detail?.intro || "",
          usage: data.product.detail?.usage || "",
          ingredients: data.product.detail?.ingredients || "",
          instructions: data.product.detail?.instructions || "",
        });
        
        setSelectedCategoryID(data.product.categoryId || "");
        setSelectedSubCategoryID(data.product.subcategoryId || "");

        const category = categories.find((c) => c.CategoryID === data.product.categoryId);
        setSubCategories(category?.SubCategories || []);
      } else {
        setProductData({
          productCode: "",
          barcode,
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
        alert("✅ Barcode chưa tồn tại. Bạn có thể tạo mới sản phẩm.");
      }
    } catch (err) {
      alert(err.message || "Lỗi kiểm tra sản phẩm!");
    }
    setShowScanner(false);
  };

  // ==================== 🔙 TRỞ VỀ TRANG TRƯỚC ====================
  const handleGoBack = () => navigate(-1);

  // 👉 Render toàn bộ giao diện đã có
  return (
    <div className="form-add-product-wrapper">
      {/* ==================== 📷 Popup quét mã vạch ==================== */}
      {showScanner && (
        <BarcodeScannerPopup
          onClose={handleCloseScanner}        // Đóng popup
          onScanSuccess={handleBarcodeResult} // Khi quét mã thành công
        />
      )}

      {/* ==================== 🔔 Popup Thông báo khi thêm sản phẩm ==================== */}
      {notify.visible && (
        <Notification
          message={notify.message}           // Nội dung thông báo
          type={notify.type}                 // success | error
          onClose={() => setNotify({ ...notify, visible: false })} // Khi bấm "Có"
          onConfirm={handleGoBack}                                    // Khi bấm "Không"
        />
      )}

      {/* ==================== 📦 Thanh tiêu đề & nút thao tác ==================== */}
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

      {/* ==================== 🖼️ Cột trái: Upload hình ảnh sản phẩm ==================== */}
      <div className="left-panel">
        <h3>Hình ảnh sản phẩm</h3>

        {/* Vùng preview ảnh drag-drop */}
        <div
          className={`image-preview-wrapper ${isDragging ? "dragging" : ""}`}
          style={{
            backgroundImage: imageFile ? `url(${imagePreview})` : "none", // Hiển thị ảnh preview
          }}
          onDragOver={handleDragOver}   // Khi kéo ảnh qua vùng drop
          onDragLeave={handleDragLeave} // Khi kéo ra khỏi vùng drop
          onDrop={handleDrop}           // Khi thả ảnh vào
        >
          {/* Khi chưa có ảnh thì hiện hướng dẫn */}
          {!imageFile && (
            <div className="image-overlay">Kéo ảnh vào hoặc chọn ảnh từ máy</div>
          )}
        </div>

        {/* Chọn ảnh từ file máy */}
        <div className="file-input-wrapper">
          <label htmlFor="fileUpload" className="custom-file-label">Chọn ảnh</label>
          <input
            type="file"
            id="fileUpload"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
          {/* Hiển thị tên file nếu có */}
          {fileName && <div className="file-name">{fileName}</div>}
        </div>

        <div className="barcode-display" aria-live="polite">
          <div className="barcode-label">Barcode</div>
          <div className={`barcode-graphic ${productData.barcode ? "has-value" : ""}`}>
            <svg ref={barcodeSvgRef} aria-label="Barcode graphic" />
          </div>
          <div className="barcode-value">
            {productData.barcode || "Chua co barcode"}
          </div>
        </div>
      </div>

      {/* ==================== 📝 Cột phải: Form nhập thông tin sản phẩm ==================== */}
      <div className="right-panel">
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();     // Ngăn reload trang
            handleSubmitAdd();      // Gửi form
          }}
        >
          {/* Nhóm: Mã và tên sản phẩm */}
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
            <div className="input-id w-25">
              <label>Barcode</label>
              <input
                type="text"
                value={productData.barcode}
                onChange={(e) => handleChange("barcode", e.target.value)}
                required
              />
            </div>
            <div className="input-name flex-fill">
              <label>Tên sản phẩm</label>
              <input
                type="text"
                value={productData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Nhóm: Giá, danh mục, danh mục con, tồn kho, nhà cung cấp */}
          <div className="form-group d-flex flex-wrap gap-2">
            <div className="input-price">
              <label>Giá</label>
              <input
                type="text"
                value={formatCurrency(productData.price)} // Hiển thị dạng 12.000đ
                onChange={handlePriceChange}
                required
              />
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

          {/* Mô tả chi tiết sản phẩm với trình soạn thảo */}
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
            <label>Thành phần</label>
            <ReactQuill
              theme="snow"
              value={productData.ingredients}
              onChange={(val) => handleChange("ingredients", val)}
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
            <label>Hướng dẫn sử dụng</label>
            <ReactQuill
              theme="snow"
              value={productData.instructions}
              onChange={(val) => handleChange("instructions", val)}
              modules={quillModules}
            />
          </div>

          {/* Nút gửi form */}
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
