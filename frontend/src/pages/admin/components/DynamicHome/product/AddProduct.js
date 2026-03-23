// ==================== 🧠 IMPORT CÁC THƯ VIỆN VÀ COMPONENT ====================
import React, { useEffect, useRef, useState } from "react";
import ReactQuill, { Quill } from "react-quill"; // 📝 Trình soạn thảo văn bản
import "react-quill/dist/quill.snow.css";
import JsBarcode from "jsbarcode";
import { useNavigate } from "react-router-dom"; // 🔙 Điều hướng khi người dùng bấm Quay lại
import { API_BASE, UPLOAD_BASE } from "../../../../../constants"; // 🌍 Địa chỉ API gốc
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

const resolveProductImageUrl = (imageValue) => {
  if (!imageValue) return "";
  const raw = String(imageValue).trim();
  if (!raw) return "";

  // Nếu DB đã lưu URL đầy đủ hoặc base64 thì dùng thẳng.
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:image/")) {
    return raw;
  }

  // Nếu DB lưu đường dẫn bắt đầu bằng /uploads thì nối domain API.
  if (raw.startsWith("/uploads/")) {
    return `${API_BASE}${raw}`;
  }

  // Mặc định xem là tên file trong thư mục pictures.
  return `${UPLOAD_BASE}/pictures/${raw}`;
};

// ==================== 🧩 COMPONENT CHÍNH: AddProduct ====================
const AddProduct = () => {
  const navigate = useNavigate();
  const { request } = useHttp(); // 🌐 Gọi API
  const barcodeSvgRef = useRef(null);
  const isLookupRunningRef = useRef(false);
  const lastLookupKeyRef = useRef("");
  const skipBlurLookupRef = useRef(false);
  const scannerOpenedAtRef = useRef(0);

  // 🧾 STATE: Dữ liệu sản phẩm đang được nhập
  const [productData, setProductData] = useState({
    productCode: "",       // 🔢 Mã sản phẩm
    barcode: "",           // 📶 Barcode sản phẩm
    detailID: "",          // 🧾 Mã chi tiết sản phẩm
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
  const [isExistingProduct, setIsExistingProduct] = useState(false); // 🧷 Đang thao tác update sản phẩm đã có

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

  const fillExistingProductToForm = (product, fallbackBarcode = "") => {
    setIsExistingProduct(true);
    setProductData({
      productCode: product.id || "",
      barcode: product.barcode || fallbackBarcode,
      detailID: product.detailid || "",
      name: product.name || "",
      price: product.price || "",
      type: product.type || "",
      stockQuantity: product.stockQuantity || "",
      supplierID: product.supplierId || "",
      isHot: product.isHot === 1,
      intro: product.detail?.intro || "",
      usage: product.detail?.usage || "",
      ingredients: product.detail?.ingredients || "",
      instructions: product.detail?.instructions || "",
    });

    setSelectedCategoryID(product.categoryId || "");
    setSelectedSubCategoryID(product.subcategoryId || "");

    const category = categories.find((c) => c.CategoryID === product.categoryId);
    setSubCategories(category?.SubCategories || []);

    // Hiển thị ảnh hiện có của sản phẩm khi load từ DB
    const existingImage = product.image || "";
    const resolvedImageUrl = resolveProductImageUrl(existingImage);
    setImageFile(null);
    setImagePreview(resolvedImageUrl);
    setFileName(existingImage || "");
  };

  const resetFormForNewInput = ({ productCode = "", barcode = "" }) => {
    setProductData({
      productCode,
      barcode,
      detailID: "",
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
    setIsExistingProduct(false);
    setImageFile(null);
    setImagePreview("");
    setFileName("");
  };


  const checkExistingByIdentity = async ({
    barcode = "",
    productCode = "",
    showNotFoundMessage = false,
    source = "manual",
  }) => {
    // Chuẩn hóa input: bỏ khoảng trắng đầu/cuối để tránh query sai.
    const trimmedBarcode = (barcode || "").trim();
    const trimmedProductCode = (productCode || "").trim();

    // Nếu cả 2 rỗng thì không cần kiểm tra.
    if (!trimmedBarcode && !trimmedProductCode) return;

    // Khóa định danh của lần lookup hiện tại.
    // Dùng để chặn gọi lặp do blur liên tiếp nhưng dữ liệu không đổi.
    const lookupKey = `${trimmedProductCode}::${trimmedBarcode}`;
    if (source === "blur" && lookupKey === lastLookupKeyRef.current) {
      return;
    }

    // Nếu đang có request lookup chạy thì bỏ qua request mới
    // để tránh race condition và popup/đổ form chồng chéo.
    if (isLookupRunningRef.current) {
      return;
    }

    // Đánh dấu bắt đầu request và lưu key gần nhất.
    isLookupRunningRef.current = true;
    lastLookupKeyRef.current = lookupKey;

    try {
      // Ghép query động: có barcode thì gửi barcode, có productId thì gửi productId.
      const query = new URLSearchParams();
      if (trimmedBarcode) query.set("barcode", trimmedBarcode);
      if (trimmedProductCode) query.set("productId", trimmedProductCode);

      // Gọi API kiểm tra tồn tại theo định danh đã nhập/quét.
      const data = await request(
        "GET",
        `${API_BASE}/api/admin/products/checkProductExistence?${query.toString()}`,
      );
      console.log("Kết quả kiểm tra tồn tại:", data.product);

      if (data.exists && data.product) {
        // Khi trigger từ blur thì không alert để tránh spam popup.
        // Khi trigger từ scan/manual vẫn hiển thị cảnh báo để user biết trạng thái.
        if (source !== "blur") {
          if (data.reactivated) {
            alert("✅ Sản phẩm đang ẩn đã được hiển thị lại.");
          } else {
            alert("⚠️ Sản phẩm đã tồn tại!");
          }
        }

        // Đổ đầy đủ dữ liệu sản phẩm tồn tại lên form để chỉnh sửa.
        fillExistingProductToForm(data.product, trimmedBarcode);
      } else {
        // Không tìm thấy: chuyển về mode tạo mới nhưng vẫn giữ ID/Barcode vừa nhập.
        resetFormForNewInput({ productCode: trimmedProductCode, barcode: trimmedBarcode });
        if (showNotFoundMessage) {
          alert("✅ Không tìm thấy sản phẩm. Bạn có thể tạo mới.");
        }
      }
    } catch (err) {
      // Lỗi mạng/API.
      alert(err.message || "Lỗi kiểm tra sản phẩm!");
    } finally {
      // Dù thành công hay thất bại đều mở khóa để lần lookup sau chạy được.
      isLookupRunningRef.current = false;
    }
  };

  // ==================== 📤 GỬI FORM THÊM SẢN PHẨM ====================
  const handleSubmitAdd = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("ProductID", productData.productCode);
      formData.append("Barcode", productData.barcode);
      formData.append("IsUpdateAfterScan", isExistingProduct ? "1" : "0");
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
      if (imageFile instanceof File) {
        formData.append("Image", imageFile);
      }

      // 🔧 Dùng DetailID cũ nếu update, ngược lại sinh mới khi thêm
      const detailID =
        productData.detailID ||
        `DTL_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
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
          detailID: "",
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
        setIsExistingProduct(false);
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
  const handlePrepareOpenScanner = () => {
    // mousedown xảy ra trước blur, nên cần khóa ở đây để không trigger lookup dữ liệu cũ
    skipBlurLookupRef.current = true;
  };

  const handleScanBarcode = () => {
    scannerOpenedAtRef.current = Date.now();
    setShowScanner(true);
  };
  const handleCloseScanner = () => {
    setShowScanner(false);
    skipBlurLookupRef.current = false;
  };

  // ==================== 📦 KẾT QUẢ TỪ QUÉT MÃ ====================
  const handleBarcodeResult = async (barcode) => {
    const normalizedBarcode = String(barcode || "").trim();
    if (!normalizedBarcode) {
      setShowScanner(false);
      skipBlurLookupRef.current = false;
      return;
    }

    // Tránh trường hợp scanner vừa mở đã bắt lại đúng mã cũ trong khung hình
    const openedRecently = Date.now() - scannerOpenedAtRef.current < 1500;
    if (openedRecently && normalizedBarcode === String(productData.barcode || "").trim()) {
      return;
    }

    await checkExistingByIdentity({
      barcode: normalizedBarcode,
      showNotFoundMessage: false,
      source: "scan",
    });
    setShowScanner(false);
    skipBlurLookupRef.current = false;
  };

  const handleIdentityBlur = async (event) => {
    if (skipBlurLookupRef.current || showScanner) {
      return;
    }

    const nextFocusedElement = event?.relatedTarget;
    if (nextFocusedElement?.closest?.(".barcode-actions")) {
      return;
    }

    await checkExistingByIdentity({
      barcode: productData.barcode,
      productCode: productData.productCode,
      showNotFoundMessage: false,
      source: "blur",
    });
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
          <div className="action-buttons">
            <button
              type="button"
              className="btn-scan"
              onMouseDown={handlePrepareOpenScanner}
              onClick={handleScanBarcode}
            >
              Quét mã
            </button>
            <button
              type="submit"
              form="add-product-form"
              className="btn-save"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang lưu..." : isExistingProduct ? "Lưu cập nhật" : "Lưu"}
            </button>
          </div>
        </div>
      </div>

      <div className="left-panel">
        <h3>Hình ảnh sản phẩm</h3>

        {/* Vùng preview ảnh drag-drop */}
        <div
          className={`image-preview-wrapper ${isDragging ? "dragging" : ""}`}
          onDragOver={handleDragOver}   // Khi kéo ảnh qua vùng drop
          onDragLeave={handleDragLeave} // Khi kéo ra khỏi vùng drop
          onDrop={handleDrop}           // Khi thả ảnh vào
        >
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Ảnh sản phẩm"
              className="preview-image"
            />
          )}

          {/* Khi chưa có ảnh thì hiện hướng dẫn */}
          {!imagePreview && (
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
          id="add-product-form"
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
                onBlur={handleIdentityBlur}
                required
              />
            </div>
            <div className="input-id w-25">
              <label>Barcode</label>
              <input
                type="text"
                value={productData.barcode}
                onChange={(e) => handleChange("barcode", e.target.value)}
                onBlur={handleIdentityBlur}
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

        </form>
      </div>
    </div>
  );

};

export default AddProduct;
