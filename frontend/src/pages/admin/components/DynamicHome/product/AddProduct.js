// ==================== 🧠 IMPORT CÁC THƯ VIỆN VÀ COMPONENT ====================
import React, { useEffect, useMemo, useRef, useState } from "react";
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

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const toDateInputValue = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
};

const createEmptyLot = (barcode = "") => ({
  batchId: "",
  barcode: String(barcode || "").trim(),
  quantity: "",
  createdAt: new Date().toISOString().slice(0, 10),
  expiryDate: "",
});

const normalizeEditorValue = (value) => (typeof value === "string" ? value : "");

const RichTextField = ({ label, value, onChange, modules }) => {
  const wrapperRef = useRef(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const checkEditorVisibility = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const editorEl = wrapper.querySelector(".ql-container");
      if (!editorEl) {
        setShowFallback(true);
        return;
      }

      const style = window.getComputedStyle(editorEl);
      const isVisible =
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0" &&
        editorEl.offsetHeight > 40;

      setShowFallback(!isVisible);
    };

    const timerA = window.setTimeout(checkEditorVisibility, 0);
    const timerB = window.setTimeout(checkEditorVisibility, 150);
    const timerC = window.setTimeout(checkEditorVisibility, 400);
    const monitorInterval = window.setInterval(checkEditorVisibility, 1000);

    const wrapper = wrapperRef.current;
    let observer = null;
    if (wrapper && window.MutationObserver) {
      observer = new MutationObserver(checkEditorVisibility);
      observer.observe(wrapper, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
      });
    }

    window.addEventListener("resize", checkEditorVisibility);

    return () => {
      window.clearTimeout(timerA);
      window.clearTimeout(timerB);
      window.clearTimeout(timerC);
      window.clearInterval(monitorInterval);
      if (observer) observer.disconnect();
      window.removeEventListener("resize", checkEditorVisibility);
    };
  }, [value]);

  return (
    <div className="form-group rich-text-field" ref={wrapperRef}>
      <label>{label}</label>
      <ReactQuill
        className="rich-text-editor"
        theme="snow"
        value={normalizeEditorValue(value)}
        onChange={onChange}
        modules={modules}
      />
      {showFallback && (
        <textarea
          className="rich-text-fallback"
          value={normalizeEditorValue(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nhập nội dung tại đây"
          rows={8}
        />
      )}
    </div>
  );
};

const BarcodeDisplay = ({ value }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    const barcodeValue = String(value || "").trim();
    if (!svgRef.current) return;

    if (!barcodeValue) {
      svgRef.current.innerHTML = "";
      return;
    }

    try {
      JsBarcode(svgRef.current, barcodeValue, {
        format: "CODE128",
        displayValue: false,
        width: 1,
        height: 24,
        margin: 0,
        background: "#ffffff",
        lineColor: "#111111",
      });
    } catch (error) {
      svgRef.current.innerHTML = "";
    }
  }, [value]);

  return (
    <div className="barcode-graphic-inner">
      <svg ref={svgRef} aria-label="lot barcode" />
    </div>
  );
};

// ==================== 🧩 COMPONENT CHÍNH: AddProduct ====================
const AddProduct = () => {
  const navigate = useNavigate();
  const { request } = useHttp(); // 🌐 Gọi API
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
  const [isCurrentProductVisible, setIsCurrentProductVisible] = useState(true);
  const [existingProductBatches, setExistingProductBatches] = useState([]);
  const [lotDrafts, setLotDrafts] = useState([createEmptyLot()]);
  const [selectedPrintBarcode, setSelectedPrintBarcode] = useState("");
  const [allBatches, setAllBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);

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

  useEffect(() => {
    const fetchAllBatches = async () => {
      try {
        const res = await request("GET", `${API_BASE}/api/admin/batches`);
        const rows = Array.isArray(res?.data) ? res.data : [];
        setAllBatches(rows);
      } catch (error) {
        setAllBatches([]);
      }
    };

    fetchAllBatches();
  }, [request]);

  // ==================== 🔔 HÀM HIỂN THỊ THÔNG BÁO ====================
  const showNotification = (message, type = "success") => {
    setNotify({ visible: true, message, type });
  };

  // ==================== ✍️ CẬP NHẬT STATE SẢN PHẨM ====================
  const handleChange = (key, value) => {
    setProductData((prev) => ({ ...prev, [key]: value }));
  };

  const handleBarcodeInputChange = (value) => {
    handleChange("barcode", value);
    if (!isExistingProduct) {
      setLotDrafts((prev) => {
        if (!Array.isArray(prev) || prev.length === 0) return [createEmptyLot(value)];
        const next = [...prev];
        const first = next[0] || createEmptyLot();
        if (!String(first.barcode || "").trim()) {
          next[0] = { ...first, barcode: String(value || "").trim() };
        }
        return next;
      });
    }
  };

  const recalculateStockFromLots = (lots) => {
    return (Array.isArray(lots) ? lots : []).reduce(
      (sum, lot) => sum + Number(lot?.quantity || 0),
      0,
    );
  };

  const handleLotDraftChange = (index, field, value) => {
    setLotDrafts((prev) => {
      const next = [...prev];
      const current = next[index] || createEmptyLot();
      next[index] = {
        ...current,
        [field]:
          field === "quantity"
            ? String(value || "").replace(/[^\d]/g, "")
            : field === "batchId"
              ? String(value || "").trim()
              : value,
      };
      recalculateStockFromLots(next);
      return next;
    });
  };

  const addLotDraft = () => {
    setLotDrafts((prev) => [...prev, createEmptyLot()]);
  };

  const removeLotDraft = (index) => {
    setLotDrafts((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      const safeNext = next.length > 0 ? next : [createEmptyLot()];
      recalculateStockFromLots(safeNext);
      return safeNext;
    });
  };

  const printableLotOptions = useMemo(
    () => lotDrafts
      .map((lot) => {
        const barcode = String(lot?.barcode || "").trim();
        return {
          value: barcode,
          label: barcode,
        };
      })
      .filter((item) => item.value),
    [lotDrafts],
  );

  const allBatchOptions = useMemo(
    () => allBatches
      .map((batch) => {
        const id = String(batch?.ID || "").trim();
        return {
          value: id,
          createdAt: batch?.CreatedAt || null,
          note: String(batch?.Note || "").trim(),
        };
      })
      .filter((item) => item.value),
    [allBatches],
  );

  const filteredBatchOptions = useMemo(() => {
    const keyword = String(selectedBatchId || "").trim().toLowerCase();
    const sourceOptions = allBatchOptions;

    if (!keyword) return sourceOptions;

    return sourceOptions.filter((item) =>
      item.value.toLowerCase().includes(keyword)
      || item.note.toLowerCase().includes(keyword),
    );
  }, [allBatchOptions, selectedBatchId]);

  const handleBatchInputChange = (value) => {
    setSelectedBatchId(String(value || "").trim());
    setIsBatchDropdownOpen(true);
  };

  useEffect(() => {
    const productBarcode = String(productData.barcode || "").trim();
    const availableValues = Array.from(new Set([
      ...printableLotOptions.map((item) => item.value),
      productBarcode,
    ].filter(Boolean)));

    setSelectedPrintBarcode((prev) => {
      const current = String(prev || "").trim();
      if (current && availableValues.includes(current)) {
        return current;
      }
      if (!current && availableValues.length > 0) {
        return availableValues[0];
      }
      return current;
    });
  }, [printableLotOptions, productData.barcode]);

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
      barcode: fallbackBarcode || product.barcode || "",
      detailID: product.detailid || "",
      name: product.name || "",
      price: product.price || "",
      type: product.type || "",
      supplierID: product.supplierId || "",
      isHot: product.isHot === 1,
      intro: normalizeEditorValue(product.detail?.intro),
      usage: normalizeEditorValue(product.detail?.usage),
      ingredients: normalizeEditorValue(product.detail?.ingredients),
      instructions: normalizeEditorValue(product.detail?.instructions),
    });
    setExistingProductBatches(
      Array.isArray(product.batchDetails)
        ? product.batchDetails.map((batch) => ({
          batchId: batch.batchId || "",
          barcode: String(batch.barcode || "").trim(),
          quantity: Number(batch.quantity || 0),
          createdAt: batch.createdAt || null,
          expiryDate: batch.expiryDate || null,
        }))
        : [],
    );
    const mappedLots = Array.isArray(product.batchDetails) && product.batchDetails.length > 0
      ? product.batchDetails.map((batch) => ({
        batchId: String(batch.batchId || "").trim(),
        barcode: String(batch.barcode || "").trim(),
        quantity: String(Number(batch.quantity || 0)),
        createdAt: toDateInputValue(batch.createdAt),
        expiryDate: batch.expiryDate ? toDateInputValue(batch.expiryDate) : "",
      }))
      : [createEmptyLot(fallbackBarcode || product.barcode || "")];
    setLotDrafts(mappedLots);
    setSelectedBatchId("");
    setIsBatchDropdownOpen(false);
    recalculateStockFromLots(mappedLots);

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

  const resetDetailFieldsKeepIdentity = ({
    productCode = null,
    barcode = null,
    preserveDraft = true,
  } = {}) => {
    setProductData((prev) => ({
      productCode: productCode !== null ? productCode : prev.productCode,
      barcode: barcode !== null ? barcode : prev.barcode,
      detailID: preserveDraft ? prev.detailID : "",
      name: preserveDraft ? prev.name : "",
      price: preserveDraft ? prev.price : "",
      type: preserveDraft ? prev.type : "",
      supplierID: preserveDraft ? prev.supplierID : "",
      isHot: preserveDraft ? prev.isHot : false,
      intro: preserveDraft ? prev.intro : "",
      usage: preserveDraft ? prev.usage : "",
      ingredients: preserveDraft ? prev.ingredients : "",
      instructions: preserveDraft ? prev.instructions : "",
    }));

    if (!preserveDraft) {
      setSelectedCategoryID("");
      setSelectedSubCategoryID("");
      setSubCategories([]);
    }

    setIsExistingProduct(false);
    setIsCurrentProductVisible(true);
    setExistingProductBatches([]);
    setSelectedBatchId("");
    setIsBatchDropdownOpen(false);

    if (!preserveDraft) {
      const nextLots = [createEmptyLot(barcode !== null ? barcode : "")];
      setLotDrafts(nextLots);
      recalculateStockFromLots(nextLots);
      setImageFile(null);
      setImagePreview("");
      setFileName("");
    }
  };


  const checkExistingByIdentity = async ({
    barcode = "",
    productCode = "",
    showNotFoundMessage = false,
    source = "manual",
    changedField = "",
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
        setIsCurrentProductVisible(data.isVisible !== false);

        if (data.barcodeConflict) {
          showNotification("Barcode đã tồn tại ở sản phẩm khác. Vui lòng nhập barcode khác.", "error");
          fillExistingProductToForm(data.product, "");
          setProductData((prev) => ({
            ...prev,
            barcode: "",
          }));
          return;
        }

        if (data.isVisible === false) {
          showNotification("Sản phẩm này đang bị ẩn. Vui lòng bật hiển thị trước khi thao tác.", "error");
        } else if (source !== "blur") {
          showNotification("Đã tìm thấy sản phẩm theo thông tin vừa nhập.", "success");
        }

        // Đổ đầy đủ dữ liệu sản phẩm tồn tại lên form để chỉnh sửa.
        fillExistingProductToForm(data.product, trimmedBarcode);
      } else {
        setIsCurrentProductVisible(true);

        if (data.barcodeExists && trimmedBarcode) {
          showNotification("Barcode đã tồn tại. Vui lòng nhập barcode khác.", "error");
          setExistingProductBatches([]);
          setProductData((prev) => ({
            ...prev,
            barcode: "",
          }));
          return;
        }

        if (trimmedBarcode) {
          // Barcode chưa tồn tại: chuyển về tạo mới nhưng giữ nguyên các ô định danh đã nhập.
          if (changedField === "barcode") {
            resetDetailFieldsKeepIdentity({
              barcode: trimmedBarcode,
              productCode: null,
              preserveDraft: true,
            });
          } else {
            resetDetailFieldsKeepIdentity({
              productCode: trimmedProductCode || null,
              barcode: trimmedBarcode,
              preserveDraft: true,
            });
          }
          if (source !== "blur") {
            showNotification("Barcode chưa tồn tại. Bạn có thể tạo sản phẩm mới.", "success");
          }
          return;
        }

        // Không tìm thấy theo ProductID: giữ nguyên ID đã nhập để user nhập tiếp barcode.
        if (changedField === "productCode") {
          resetDetailFieldsKeepIdentity({
            productCode: trimmedProductCode,
            barcode: null,
            preserveDraft: true,
          });
        } else {
          resetDetailFieldsKeepIdentity({
            productCode: trimmedProductCode || null,
            barcode: trimmedBarcode || null,
            preserveDraft: true,
          });
        }
        if (showNotFoundMessage) {
          showNotification("Không tìm thấy sản phẩm. Bạn có thể tạo mới.", "success");
        }
      }
    } catch (err) {
      // Lỗi mạng/API.
      showNotification(err.message || "Lỗi kiểm tra sản phẩm!", "error");
    } finally {
      // Dù thành công hay thất bại đều mở khóa để lần lookup sau chạy được.
      isLookupRunningRef.current = false;
    }
  };

  // ==================== 📤 GỬI FORM THÊM SẢN PHẨM ====================
  const handleSubmitAdd = async () => {
    if (isSubmitting) return;

    if (isExistingProduct && !isCurrentProductVisible) {
      showNotification("Sản phẩm đang bị ẩn, không thể lưu từ màn hình này.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      const normalizedLotDrafts = lotDrafts
        .map((lot) => ({
          batchId: String(lot?.batchId || "").trim(),
          barcode: String(lot?.barcode || "").trim(),
          quantity: Number(lot?.quantity || 0),
          createdAt: lot?.createdAt || null,
          expiryDate: lot?.expiryDate || null,
        }))
        .filter((lot) => lot.quantity > 0 || lot.barcode);

      if (normalizedLotDrafts.length === 0) {
        showNotification("Vui lòng nhập ít nhất 1 lô hàng với Barcode và Số lượng.", "error");
        setIsSubmitting(false);
        return;
      }

      if (normalizedLotDrafts.some((lot) => !lot.batchId)) {
        showNotification("Vui lòng chọn mã lô hàng trước khi lưu.", "error");
        setIsSubmitting(false);
        return;
      }

      if (normalizedLotDrafts.some((lot) => !lot.barcode || Number(lot.quantity || 0) <= 0)) {
        showNotification("Mỗi lô hàng phải có Barcode và Số lượng > 0.", "error");
        setIsSubmitting(false);
        return;
      }

      formData.append("ProductID", productData.productCode);
      formData.append("Barcode", productData.barcode);
      formData.append("IsUpdateAfterScan", isExistingProduct ? "1" : "0");
      formData.append("ProductName", productData.name);
      formData.append("Price", productData.price);
      formData.append("Type", productData.type);
      formData.append("CategoryID", selectedCategoryID);
      formData.append("SubCategoryID", selectedSubCategoryID);
      formData.append("SupplierID", productData.supplierID);
      formData.append("IsHot", productData.isHot ? 1 : 0);
      formData.append("ProductDescription", productData.intro);
      formData.append("Usage", productData.usage);
      formData.append("Ingredients", productData.ingredients);
      formData.append("Instructions", productData.instructions);
      formData.append("BatchDetails", JSON.stringify(normalizedLotDrafts));
      if (!isExistingProduct) {
        formData.append("BatchID", String(selectedBatchId || "").trim());
      }
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
        setIsCurrentProductVisible(true);
        setExistingProductBatches([]);
        setLotDrafts([createEmptyLot()]);
        setSelectedPrintBarcode("");
        setSelectedBatchId("");
        setIsBatchDropdownOpen(false);
        setImageFile(null);
        setImagePreview("");
        setFileName("");
      } else {
        showNotification(res.message || "❌ Thêm sản phẩm thất bại!", "error");
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

  const handlePrintBarcode = (inputBarcode = "") => {
    const barcodeValue = String(inputBarcode || selectedPrintBarcode || productData.barcode || "").trim();
    if (!barcodeValue) {
      showNotification("Chưa có barcode để in", "error");
      return;
    }

    const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    try {
      JsBarcode(tempSvg, barcodeValue, {
        format: "CODE128",
        displayValue: false,
        width: 1.8,
        height: 70,
        margin: 0,
        background: "#ffffff",
        lineColor: "#111111",
      });
    } catch (error) {
      showNotification("Không thể tạo barcode để in", "error");
      return;
    }

    const barcodeSvg = tempSvg.outerHTML;

    const printWindow = window.open("", "_blank", "width=520,height=720");
    if (!printWindow) {
      showNotification("Trình duyệt đã chặn popup in. Hãy cho phép popup.", "error");
      return;
    }

    const productName = escapeHtml(productData.name || "Sản phẩm");
    const productCode = escapeHtml(productData.productCode || "-");
    const printedBarcode = escapeHtml(barcodeValue);

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>In barcode ${printedBarcode}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body {
              margin: 0;
              font-family: Arial, sans-serif;
              color: #111;
              background: #fff;
            }
            .ticket {
              width: 100%;
              max-width: 420px;
              margin: 20px auto;
              border: 1px dashed #9ca3af;
              border-radius: 8px;
              padding: 16px;
              box-sizing: border-box;
            }
            .title {
              font-size: 16px;
              font-weight: 700;
              margin-bottom: 4px;
            }
            .meta {
              font-size: 13px;
              color: #4b5563;
              margin-bottom: 12px;
            }
            .barcode-box {
              border: 1px solid #d1d5db;
              border-radius: 6px;
              padding: 10px;
              text-align: center;
            }
            .barcode-box svg {
              width: 100%;
              max-width: 320px;
              height: 70px;
            }
            .barcode-value {
              margin-top: 8px;
              letter-spacing: 1px;
              font-family: "Courier New", monospace;
              font-size: 16px;
              font-weight: 700;
            }
            .print-time {
              margin-top: 10px;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="title">${productName}</div>
            <div class="meta">Mã sản phẩm: ${productCode}</div>
            <div class="barcode-box">
              ${barcodeSvg}
              <div class="barcode-value">${printedBarcode}</div>
            </div>
            <div class="print-time">In lúc: ${escapeHtml(new Date().toLocaleString("vi-VN"))}</div>
          </div>
          <script>
            window.onload = function () {
              window.focus();
              window.print();
              setTimeout(function () { window.close(); }, 150);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
      productCode: productData.productCode,
      showNotFoundMessage: false,
      source: "scan",
      changedField: "barcode",
    });
    setShowScanner(false);
    skipBlurLookupRef.current = false;
  };

  const handleIdentityBlur = async (field, event) => {
    if (skipBlurLookupRef.current || showScanner) {
      return;
    }

    const nextFocusedElement = event?.relatedTarget;
    if (nextFocusedElement?.closest?.(".barcode-actions")) {
      return;
    }

    // Chỉ kiểm tra field mà user vừa blur, không reset field khác
    const fieldValue = field === "barcode" ? productData.barcode : productData.productCode;
    
    if (!fieldValue || !String(fieldValue).trim()) {
      return; // Nếu field này rỗng thì bỏ qua kiểm tra
    }

    const identityPayload =
      field === "barcode"
        ? { barcode: productData.barcode, productCode: productData.productCode }
        : { barcode: "", productCode: productData.productCode };

    await checkExistingByIdentity({
      ...identityPayload,
      showNotFoundMessage: false,
      source: "blur",
      changedField: field,
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

        <div className="barcode-display">
          <div className="barcode-label">Chọn barcode để in</div>
          <select
            value={selectedPrintBarcode}
            onChange={(e) => setSelectedPrintBarcode(e.target.value)}
          >
            <option value="">Chọn barcode</option>
            {printableLotOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
            {!printableLotOptions.length && String(productData.barcode || "").trim() && (
              <option value={String(productData.barcode || "").trim()}>
                Barcode sản phẩm - {String(productData.barcode || "").trim()}
              </option>
            )}
          </select>

          <div className={`barcode-graphic ${selectedPrintBarcode ? "has-value" : ""}`}>
            <BarcodeDisplay value={selectedPrintBarcode} />
          </div>

          <div className="barcode-value">{selectedPrintBarcode || "Chưa chọn mã"}</div>

          <button
            type="button"
            className="btn-print-inline"
            onClick={() => handlePrintBarcode(selectedPrintBarcode)}
            disabled={!selectedPrintBarcode}
          >
            In mã đã chọn
          </button>
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
                onBlur={(e) => handleIdentityBlur("productCode", e)}
                required
              />
            </div>
            <div className="input-id w-25">
              <label>Barcode</label>
              <input
                type="text"
                value={productData.barcode}
                onChange={(e) => handleBarcodeInputChange(e.target.value)}
                onBlur={(e) => handleIdentityBlur("barcode", e)}
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

            <div className="input-supplier">
              <label>Nhà cung cấp</label>
              <input
                type="text"
                value={productData.supplierID}
                onChange={(e) => handleChange("supplierID", e.target.value)}
              />
            </div>
          </div>

          <div className="form-group lot-editor-block">
            <div className="lot-editor-header">
              <label>Lô hàng</label>
              <div className="lot-editor-header__right">
                {existingProductBatches.length > 0 && (
                  <span className="lot-editor-existing-count">Đã có {existingProductBatches.length} lô</span>
                )}
                <button type="button" className="btn-add-lot" onClick={addLotDraft}>+ Thêm lô</button>
              </div>
            </div>

            <div className="lot-selector-row">
              <span>Mã lô hàng:</span>
              <div className="lot-selector-autocomplete">
                <input
                  type="text"
                  value={selectedBatchId}
                  onChange={(e) => handleBatchInputChange(e.target.value)}
                  onFocus={() => setIsBatchDropdownOpen(true)}
                  onBlur={() => {
                    window.setTimeout(() => setIsBatchDropdownOpen(false), 120);
                  }}
                  placeholder={isExistingProduct ? "Nhập hoặc chọn mã lô" : "Nhập hoặc chọn mã lô hàng"}
                  className="lot-selector-filter"
                />

                {isBatchDropdownOpen && filteredBatchOptions.length > 0 && (
                  <div className="lot-selector-dropdown">
                    {filteredBatchOptions.slice(0, 8).map((item) => (
                      <button
                        key={`lot_picker_${item.value}`}
                        type="button"
                        className="lot-selector-option"
                        onMouseDown={() => {
                          setSelectedBatchId(item.value);
                          setLotDrafts((prev) => {
                            const next = Array.isArray(prev) ? [...prev] : [createEmptyLot()];
                            const firstEmptyIndex = next.findIndex(
                              (lot) => !String(lot?.batchId || "").trim(),
                            );
                            if (firstEmptyIndex >= 0) {
                              next[firstEmptyIndex] = {
                                ...(next[firstEmptyIndex] || createEmptyLot()),
                                batchId: item.value,
                              };
                            }
                            return next;
                          });
                          setIsBatchDropdownOpen(false);
                        }}
                      >
                        {item.value}
                      </button>
                    ))}
                  </div>
                )}

                {isExistingProduct && (
                  <div className="lot-selector-hint">Mã lô độc lập với barcode. Một mã lô có thể chứa nhiều sản phẩm.</div>
                )}
              </div>
            </div>

            <div className="lot-editor-list">
              {lotDrafts.map((lot, index) => (
                <div className="lot-editor-row" key={`lot_draft_${index}`}>
                  <div className="lot-editor-field lot-editor-field--batch-id">
                    <span>Mã lô</span>
                    <input
                      type="text"
                      value={String(lot.batchId || "").trim()}
                      onChange={(e) => handleLotDraftChange(index, "batchId", e.target.value)}
                      placeholder="Nhập mã lô"
                    />
                  </div>
                  <div className="lot-editor-field">
                    <span>Barcode lô</span>
                    <input
                      type="text"
                      value={lot.barcode}
                      onChange={(e) => handleLotDraftChange(index, "barcode", e.target.value)}
                      placeholder="Nhập barcode lô"
                    />
                  </div>
                  <div className="lot-editor-field lot-editor-field--qty">
                    <span>Số lượng sp</span>
                    <input
                      type="number"
                      min="0"
                      value={lot.quantity}
                      onChange={(e) => handleLotDraftChange(index, "quantity", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="lot-editor-field lot-editor-field--date">
                    <span>Ngày nhập</span>
                    <input
                      type="date"
                      value={lot.createdAt}
                      onChange={(e) => handleLotDraftChange(index, "createdAt", e.target.value)}
                    />
                  </div>
                  <div className="lot-editor-field lot-editor-field--date">
                    <span>Ngày hết hạn</span>
                    <input
                      type="date"
                      value={lot.expiryDate || ""}
                      onChange={(e) => handleLotDraftChange(index, "expiryDate", e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-remove-lot"
                    onClick={() => removeLotDraft(index)}
                    disabled={lotDrafts.length <= 1}
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Mô tả chi tiết sản phẩm với trình soạn thảo */}
          <RichTextField
            label="Mô tả (Giới thiệu)"
            value={productData.intro}
            onChange={(val) => handleChange("intro", val)}
            modules={quillModules}
          />

          <RichTextField
            label="Thành phần"
            value={productData.ingredients}
            onChange={(val) => handleChange("ingredients", val)}
            modules={quillModules}
          />

          <RichTextField
            label="Công dụng"
            value={productData.usage}
            onChange={(val) => handleChange("usage", val)}
            modules={quillModules}
          />

          <RichTextField
            label="Hướng dẫn sử dụng"
            value={productData.instructions}
            onChange={(val) => handleChange("instructions", val)}
            modules={quillModules}
          />

        </form>
      </div>
    </div>
  );

};

export default AddProduct;
