import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import JsBarcode from "jsbarcode";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import AdminLoadingScreen from "../../shared/AdminLoadingScreen";
import Notification from "../../shared/Notification";
import useMinimumLoading from "../../useMinimumLoading";
import "./style.scss";

const productSections = [
  {
    label: "Mô tả sản phẩm",
    field: "ProductDescription",
    id: "description",
    className: "product-description",
  },
  {
    label: "Thành phần",
    field: "Ingredient",
    id: "ingredients",
    className: "product-ingredients",
  },
  {
    label: "Công dụng",
    field: "Usage",
    id: "usage",
    className: "product-usage",
  },
  {
    label: "Hướng dẫn sử dụng",
    field: "HowToUse",
    id: "instructions",
    className: "product-instructions",
  },
];

const createEditableBatch = () => {
  const now = new Date();
  return {
    batchId: "",
    barcode: "",
    quantity: 0,
    expiryDate: "",
    createdAt: now.toISOString(),
    isNew: true,
  };
};

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const getSaleFieldsFromProduct = (product = {}) => {
  const salePrice = Number(product?.sale_price || 0);
  const saleEventId = product?.SaleEventID ? String(product.SaleEventID) : "";
  const hasSale = salePrice > 0;

  return {
    saleMode: hasSale ? (saleEventId ? "event" : "independent") : "none",
    salePrice: hasSale ? String(Math.round(salePrice)) : "",
    saleEventId,
    saleStartDate: toDateInputValue(product?.sale_start_date || product?.start_date),
    saleEndDate: toDateInputValue(product?.sale_end_date || product?.end_date),
    saleProgramName: product?.ProgramName || product?.SaleEventTitle || "",
  };
};

const LotBarcode = ({ value }) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    const barcodeValue = String(value || "").trim();
    if (!barcodeRef.current) return;

    if (!barcodeValue) {
      barcodeRef.current.innerHTML = "";
      return;
    }

    try {
      JsBarcode(barcodeRef.current, barcodeValue, {
        format: "CODE128",
        displayValue: false,
        width: 1,
        height: 28,
        margin: 0,
        background: "#ffffff",
        lineColor: "#111111",
      });
    } catch (error) {
      console.warn("Khong the render barcode lot:", error.message);
      barcodeRef.current.innerHTML = "";
    }
  }, [value]);

  if (!String(value || "").trim()) {
    return <span className="lot-item__barcode-empty">Khong co barcode</span>;
  }

  return (
    <div className="lot-item__barcode" aria-label="Lot barcode">
      <svg ref={barcodeRef} />
      <span className="lot-item__barcode-text">{String(value)}</span>
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const { request } = useHttp();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const showLoading = useMinimumLoading(loading, 500);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedImageName, setSelectedImageName] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [editableBatches, setEditableBatches] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [saleEvents, setSaleEvents] = useState([]);
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notify, setNotify] = useState({ open: false, status: "info", message: "" });

  const [editFields, setEditFields] = useState({
    ProductName: "",
    Price: "",
    ProductDescription: "",
    Ingredient: "",
    Usage: "",
    HowToUse: "",
    StockQuantity: "",
    Lot: "",
    SupplierID: "",
    Image: null,
    saleMode: "none",
    salePrice: "",
    saleEventId: "",
    saleStartDate: "",
    saleEndDate: "",
    saleProgramName: "",
  });

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/admin/products/productDetail?code=${id}`
        );
        const productData = res?.data || null;
        const saleFields = getSaleFieldsFromProduct(productData);
        setProduct(productData);
        setEditFields({
          ProductName: productData?.ProductName || "",
          Price: productData?.Price || "",
          ProductDescription: productData?.ProductDescription || "",
          Ingredient: productData?.Ingredient || "",
          Usage: productData?.Usage || "",
          HowToUse: productData?.HowToUse || "",
          StockQuantity: productData?.StockQuantity || "",
          Lot: productData?.Lot || "",
          SupplierID: productData?.SupplierID || "",
          Image: null,
          CategoryID: productData?.CategoryID || "",
          SubCategoryID: productData?.SubCategoryID || "",
          ...saleFields,
        });

        const firstBatchId = productData?.batchDetails?.[0]?.batchId || null;
        setSelectedBatchId(firstBatchId);
        setEditableBatches(
          (productData?.batchDetails || []).map((batch) => ({
            batchId: batch.batchId || "",
            barcode: batch.barcode || "",
            quantity: Number(batch.quantity || 0),
            expiryDate: batch.expiryDate
              ? new Date(batch.expiryDate).toISOString().slice(0, 10)
              : "",
            createdAt: batch.createdAt || null,
          }))
        );
      } catch (err) {
        console.error("❌ Không lấy được chi tiết sản phẩm:", err);
        setProduct(null);
        setEditableBatches([]);
        setSelectedBatchId(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, request]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/user/products/loadCategory`
        );
        setCategories(res.data || []);
      } catch (error) {
        console.error("❌ Lỗi lấy danh mục:", error.message);
      }
    };
    fetchCategories();
  }, [request]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await request("GET", `${API_BASE}/api/admin/brand`);
        setBrands(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
        setBrands([]);
      }
    };

    fetchBrands();
  }, [request]);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await request("GET", `${API_BASE}/api/admin/batches`);
        setAllBatches(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
        console.error("Khong lay duoc danh sach lo hang:", error.message);
        setAllBatches([]);
      }
    };

    fetchBatches();
  }, [request]);

  useEffect(() => {
    const fetchSaleEvents = async () => {
      try {
        const res = await request("GET", `${API_BASE}/api/admin/sale-events`);
        setSaleEvents(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
        console.error("Khong lay duoc danh sach su kien sale:", error.message);
        setSaleEvents([]);
      }
    };

    fetchSaleEvents();
  }, [request]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleInputChange = (field, value) => {
    setEditFields((prev) => ({ ...prev, [field]: value }));
  };

  const formatPriceWithDots = (value) => {
    const digits = String(value ?? "").replace(/\D/g, "");
    if (!digits) return "";
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handlePriceChange = (value) => {
    const digits = String(value ?? "").replace(/\D/g, "");
    handleInputChange("Price", digits);
  };

  const handleSalePriceChange = (value) => {
    const digits = String(value ?? "").replace(/\D/g, "");
    handleInputChange("salePrice", digits);
  };

  const handleSaleModeChange = (mode) => {
    setEditFields((prev) => ({
      ...prev,
      saleMode: mode,
      saleEventId: mode === "event" ? prev.saleEventId : "",
      saleProgramName: mode === "event" ? prev.saleProgramName : "",
      saleStartDate: mode === "none" ? "" : prev.saleStartDate,
      saleEndDate: mode === "none" ? "" : prev.saleEndDate,
      salePrice: mode === "none" ? "" : prev.salePrice,
    }));
  };

  const handleSaleEventChange = (eventId) => {
    const selectedEvent = saleEvents.find((item) => String(item.id || "") === String(eventId || ""));
    setEditFields((prev) => ({
      ...prev,
      saleEventId: eventId,
      saleProgramName: selectedEvent?.title || "",
      saleStartDate: toDateInputValue(selectedEvent?.start_date),
      saleEndDate: toDateInputValue(selectedEvent?.end_date),
    }));
  };

  const showPopup = ({ status = "info", message = "" }) => {
    setNotify({ open: true, status, message });
  };

  const closePopup = () => {
    setNotify((prev) => ({ ...prev, open: false }));
  };
  const handleImageDrop = (e) => {
    e.preventDefault();
    if (!isEdit) return;

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImageName(file.name);
      setEditFields((prev) => ({ ...prev, Image: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e) => {
    if (isEdit) e.preventDefault(); // Cho phép thả
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImageName(file.name);
      setEditFields((prev) => ({ ...prev, Image: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const imageUrl = !product?.Image?.startsWith("http")
    ? UPLOAD_BASE + "/pictures/" + (product?.Image || "default.jpg")
    : product.Image;

  const batchDetails = product?.batchDetails || [];
  const selectedBatch =
    batchDetails.find((item) => item.batchId === selectedBatchId) ||
    batchDetails[0] ||
    null;

  const formatDate = (value) => {
    if (!value) return "Không có";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Không có";
    return date.toLocaleDateString("vi-VN");
  };

  const getLotDisplayLabel = (batch, index) => {
    const rawBatchId = String(batch?.batchId || "").trim();
    const isFallbackRow = /^ROW_\d+$/i.test(rawBatchId);

    if (!rawBatchId || isFallbackRow) {
      const createdAtLabel = formatDate(batch?.createdAt);
      return createdAtLabel !== "Không có"
        ? `Lô hàng: ${createdAtLabel}`
        : `Lô hàng: ${index + 1}`;
    }

    return `Lô hàng: ${rawBatchId}`;
  };

  const activeValue = product?.IsActive ?? product?.isActive;
  const isProductActive =
    activeValue === undefined ||
    activeValue === null ||
    activeValue === true ||
    activeValue === 1 ||
    String(activeValue).toLowerCase() === "true";

  const editableStock = editableBatches.reduce(
    (sum, batch) => sum + Number(batch.quantity || 0),
    0
  );

  const selectedEditableBatchIndex = editableBatches.findIndex(
    (item) => item.batchId === selectedBatchId
  );

  const currentBrandName = (() => {
    const supplierId = String(product?.SupplierID || editFields?.SupplierID || "").trim();
    if (!supplierId) return "Chưa gán thương hiệu";

    const matched = brands.find(
      (item) =>
        String(item?.idBrand || "").trim() === supplierId ||
        String(item?.Brand || item?.name || "").trim().toLowerCase() === supplierId.toLowerCase()
    );

    return matched?.Brand || matched?.name || supplierId;
  })();

  const selectedEditableBatch =
    selectedEditableBatchIndex >= 0
      ? editableBatches[selectedEditableBatchIndex]
      : editableBatches[0] || null;

  const selectedSaleEvent = useMemo(
    () => saleEvents.find((event) => String(event.id || "") === String(editFields.saleEventId || "")),
    [saleEvents, editFields.saleEventId]
  );

  const currentSaleMode = String(editFields.saleMode || "none");
  const currentSalePrice = Number(product?.sale_price || 0);
  const hasCurrentSale = currentSalePrice > 0;
  const currentSaleLabel = product?.SaleEventTitle || product?.ProgramName || (product?.SaleEventID ? "Sale theo event" : "Sale độc lập");
  const saleDateLabel = (() => {
    const start = product?.sale_start_date || product?.start_date;
    const end = product?.sale_end_date || product?.end_date;
    if (!start && !end) return "Không giới hạn thời gian";
    return `${formatDate(start)} - ${formatDate(end)}`;
  })();

  const allBatchOptions = useMemo(
    () =>
      (Array.isArray(allBatches) ? allBatches : [])
        .map((batch) => {
          const value = String(batch?.ID || "").trim();
          return {
            value,
            createdAt: batch?.CreatedAt || null,
            note: String(batch?.Note || "").trim(),
          };
        })
        .filter((item) => item.value),
    [allBatches],
  );

  const filteredBatchOptions = useMemo(() => {
    const keyword = String(selectedEditableBatch?.batchId || "").trim().toLowerCase();
    if (!keyword) return allBatchOptions;

    return allBatchOptions.filter((item) =>
      item.value.toLowerCase().includes(keyword) ||
      item.note.toLowerCase().includes(keyword),
    );
  }, [allBatchOptions, selectedEditableBatch?.batchId]);

  const handleBatchFieldChange = (index, field, value) => {
    setEditableBatches((prev) =>
      prev.map((batch, idx) => {
        if (idx !== index) return batch;
        if (field === "quantity") {
          return { ...batch, quantity: Number(value || 0) };
        }
        return { ...batch, [field]: value };
      })
    );

    if (field === "batchId" && index === selectedEditableBatchIndex) {
      setSelectedBatchId(value);
    }
  };

  const handleAddEditableBatch = () => {
    const nextBatch = createEditableBatch();
    setEditableBatches((prev) => [...prev, nextBatch]);
    setSelectedBatchId("");
    setIsBatchDropdownOpen(true);
  };

  const handleSelectBatchOption = (batchId) => {
    const targetIndex = selectedEditableBatchIndex >= 0 ? selectedEditableBatchIndex : 0;
    handleBatchFieldChange(targetIndex, "batchId", batchId);
    setSelectedBatchId(batchId);
    setIsBatchDropdownOpen(false);
  };

  const handleCancelEdit = () => {
    if (!product) {
      setIsEdit(false);
      return;
    }

    const saleFields = getSaleFieldsFromProduct(product);
    setEditFields({
      ProductName: product.ProductName || "",
      Price: product.Price || "",
      ProductDescription: product.ProductDescription || "",
      Ingredient: product.Ingredient || "",
      Usage: product.Usage || "",
      HowToUse: product.HowToUse || "",
      StockQuantity: product.StockQuantity || "",
      Lot: product.Lot || "",
      SupplierID: product.SupplierID || "",
      Image: null,
      CategoryID: product.CategoryID || "",
      SubCategoryID: product.SubCategoryID || "",
      ...saleFields,
    });

    const resetBatches = (product?.batchDetails || []).map((batch) => ({
      batchId: batch.batchId || "",
      barcode: batch.barcode || "",
      quantity: Number(batch.quantity || 0),
      expiryDate: batch.expiryDate
        ? new Date(batch.expiryDate).toISOString().slice(0, 10)
        : "",
      createdAt: batch.createdAt || null,
    }));

    setEditableBatches(resetBatches);
    setSelectedBatchId(resetBatches?.[0]?.batchId || null);
    setPreviewImage(null);
    setSelectedImageName("");
    setIsEdit(false);
  };

  const handleSaveProductDetail = async () => {
    if (!product || isSaving) return;

    try {
      setIsSaving(true);
      const normalizedBatches = editableBatches.map((batch) => ({
        ...batch,
        batchId: String(batch.batchId || "").trim(),
        barcode: String(batch.barcode || "").trim(),
        quantity: Number(batch.quantity || 0),
        expiryDate: batch.expiryDate || null,
      }));
      const invalidBatch = normalizedBatches.find(
        (batch) => !batch.batchId || !batch.barcode || Number(batch.quantity || 0) <= 0
      );
      if (invalidBatch) {
        showPopup({ status: "error", message: "Vui lòng nhập đầy đủ mã lô, barcode và số lượng > 0 cho từng lô." });
        return;
      }

      const duplicatedBarcode = normalizedBatches.find((batch, index) =>
        normalizedBatches.findIndex((item) => item.barcode === batch.barcode) !== index
      );
      if (duplicatedBarcode) {
        showPopup({ status: "error", message: `Barcode ${duplicatedBarcode.barcode} đang bị trùng trong danh sách lô.` });
        return;
      }

      const saleMode = String(editFields.saleMode || "none");
      const salePrice = Number(editFields.salePrice || 0);
      const originalPrice = Number(editFields.Price || 0);

      if (saleMode !== "none") {
        if (!salePrice || salePrice <= 0) {
          showPopup({ status: "error", message: "Vui lòng nhập giá sale lớn hơn 0." });
          return;
        }
        if (originalPrice > 0 && salePrice >= originalPrice) {
          showPopup({ status: "error", message: "Giá sale phải nhỏ hơn giá bán." });
          return;
        }
        if (saleMode === "event" && !editFields.saleEventId) {
          showPopup({ status: "error", message: "Vui lòng chọn sự kiện sale." });
          return;
        }
        if (saleMode === "independent" && editFields.saleStartDate && editFields.saleEndDate) {
          const startDate = new Date(editFields.saleStartDate);
          const endDate = new Date(editFields.saleEndDate);
          if (startDate > endDate) {
            showPopup({ status: "error", message: "Ngày bắt đầu sale phải nhỏ hơn hoặc bằng ngày kết thúc." });
            return;
          }
        }
      }

      const payload = {
        ProductID: product.ProductID,
        DetailID: product.DetailID,
        ProductName: editFields.ProductName,
        Price: Number(editFields.Price || 0),
        SupplierID: editFields.SupplierID || null,
        CategoryID: editFields.CategoryID || null,
        SubCategoryID: editFields.SubCategoryID || null,
        ProductDescription: editFields.ProductDescription,
        Ingredient: editFields.Ingredient,
        Usage: editFields.Usage,
        HowToUse: editFields.HowToUse,
        batchDetails: normalizedBatches,
        sale: {
          enabled: saleMode !== "none",
          saleMode,
          salePrice,
          saleEventId: saleMode === "event" ? editFields.saleEventId || null : null,
          programName: saleMode === "event" ? editFields.saleProgramName || selectedSaleEvent?.title || "" : "",
          startDate: saleMode === "event" ? selectedSaleEvent?.start_date || editFields.saleStartDate || null : editFields.saleStartDate || null,
          endDate: saleMode === "event" ? selectedSaleEvent?.end_date || editFields.saleEndDate || null : editFields.saleEndDate || null,
        },
      };

      const res = await request(
        "PUT",
        `${API_BASE}/api/admin/products/updateProductDetail`,
        payload
      );

      if (!res?.success) {
        showPopup({ status: "error", message: res?.message || "Không thể cập nhật chi tiết sản phẩm" });
        return;
      }

      setProduct((prev) => ({
        ...prev,
        ProductName: editFields.ProductName,
        Price: Number(editFields.Price || 0),
        SupplierID: editFields.SupplierID || null,
        CategoryID: editFields.CategoryID || null,
        SubCategoryID: editFields.SubCategoryID || null,
        ProductDescription: editFields.ProductDescription,
        Ingredient: editFields.Ingredient,
        Usage: editFields.Usage,
        HowToUse: editFields.HowToUse,
        StockQuantity: normalizedBatches.reduce((sum, batch) => sum + Number(batch.quantity || 0), 0),
        batchDetails: normalizedBatches,
        sale_price: saleMode === "none" ? null : salePrice,
        sale_start_date: saleMode === "none" ? null : payload.sale.startDate,
        sale_end_date: saleMode === "none" ? null : payload.sale.endDate,
        SaleEventID: saleMode === "event" ? editFields.saleEventId || null : null,
        ProgramName: saleMode === "event" ? payload.sale.programName : null,
        SaleEventTitle: saleMode === "event" ? selectedSaleEvent?.title || payload.sale.programName : null,
      }));

      setEditableBatches(normalizedBatches);
      setSelectedBatchId(normalizedBatches?.[0]?.batchId || null);
      setIsEdit(false);
      showPopup({ status: "success", message: "Cập nhật sản phẩm thành công" });
    } catch (error) {
      console.error("Lỗi cập nhật chi tiết sản phẩm:", error);
      showPopup({ status: "error", message: "Không thể cập nhật chi tiết sản phẩm" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintBatchBarcode = (batch) => {
    const barcodeValue = String(batch?.barcode || "").trim();
    if (!barcodeValue) {
      showPopup({ status: "warning", message: "Lô hàng này chưa có barcode để in." });
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
      console.error("Khong the tao barcode de in:", error);
      showPopup({ status: "error", message: "Không thể tạo barcode để in." });
      return;
    }

    const printWindow = window.open("", "_blank", "width=520,height=720");
    if (!printWindow) {
      showPopup({ status: "warning", message: "Trình duyệt đã chặn popup in. Hãy cho phép popup." });
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>In barcode</title>
          <style>
            @page { size: auto; margin: 6mm; }
            body {
              margin: 0;
              background: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .barcode-only {
              padding: 6px;
            }
            .barcode-only svg {
              width: 100%;
              max-width: 360px;
              height: 90px;
            }
          </style>
        </head>
        <body>
          <div class="barcode-only">
            ${tempSvg.outerHTML}
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

  return (
    <div className="product-detail__container">
      <Notification
        open={notify.open}
        status={notify.status}
        message={notify.message}
        onClose={closePopup}
      />
      {showLoading && (
        <AdminLoadingScreen message="Đang tải thông tin sản phẩm..." />
      )}

      {!showLoading && (
        <>
          <div className="product-detail__actions">
            <button className="btn-back" onClick={() => navigate(-1)}>
              ⬅ Quay lại
            </button>
            {product && (
              <div className="btn-group">
                <button
                  className="btn-edit"
                  onClick={() => (isEdit ? handleSaveProductDetail() : setIsEdit(true))}
                  disabled={isSaving}
                >
                  {isSaving ? "Đang lưu..." : isEdit ? "💾 Lưu" : "✏️ Sửa"}
                </button>
                {isEdit && (
                  <button
                    className="btn-cancel"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    ✖ Hủy
                  </button>
                )}
                <button className="btn-delete">🗑️ Xóa</button>
              </div>
            )}
          </div>

          <div className="product-detail__breadcrumb">
            <span>Danh mục: </span>

            {isEdit ? (
              <>
                <div className="category-selects">
                  <select
                    value={editFields.CategoryID}
                    onChange={(e) => {
                      handleInputChange("CategoryID", e.target.value);
                      handleInputChange("SubCategoryID", "");
                    }}
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((cat) => (
                      <option key={cat.CategoryID} value={cat.CategoryID}>
                        {cat.CategoryName}
                      </option>
                    ))}
                  </select>

                  {editFields.CategoryID && (
                    <>
                      <span className="breadcrumb-separator">{">"}</span>
                      <select
                        value={editFields.SubCategoryID}
                        onChange={(e) =>
                          handleInputChange("SubCategoryID", e.target.value)
                        }
                      >
                        <option value="">-- Chọn danh mục con --</option>
                        {categories
                          .find(
                            (cat) => cat.CategoryID === editFields.CategoryID
                          )
                          ?.SubCategories?.map((sub) => (
                            <option
                              key={sub.SubCategoryID}
                              value={sub.SubCategoryID}
                            >
                              {sub.SubCategoryName}
                            </option>
                          ))}
                      </select>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <span>{product.CategoryName}</span>
                {product.SubCategoryID && (
                  <>
                    <span className="breadcrumb-separator">{">"}</span>
                    <span>{product.SubCategoryName}</span>
                  </>
                )}
              </>
            )}
          </div>

          {!isProductActive && (
            <div className="product-detail__inactive">
              Sản phẩm đang ở trạng thái không hoạt động nên không hiển thị chi tiết.
            </div>
          )}

          {isProductActive && (
          <div className="product-detail__wrapper show">
            <div className="product-detail__body">
              <div
                className="product-detail__image"
                onDrop={handleImageDrop}
                onDragOver={handleDragOver}
              >
                <img
                  src={previewImage || imageUrl}
                  alt={editFields.ProductName}
                  onClick={() =>
                    isEdit && document.getElementById("imageInput").click()
                  }
                  style={{ cursor: isEdit ? "pointer" : "default" }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `${UPLOAD_BASE}/pictures/no_image.jpg`;
                  }}
                />

                {isEdit && (
                  <div className="upload-wrapper">
                    <input
                      type="file"
                      id="imageInput"
                      style={{ display: "none" }}
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <label htmlFor="imageInput" className="btn-select-image">
                      📁 Chọn ảnh
                    </label>
                    {selectedImageName && (
                      <div className="image-name">{selectedImageName}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="product-detail__info">
                {isEdit ? (
                  <input
                    className="productName-input"
                    value={editFields.ProductName}
                    onChange={(e) =>
                      handleInputChange("ProductName", e.target.value)
                    }
                    placeholder="Tên sản phẩm"
                  />
                ) : (
                  <h3>{product.ProductName}</h3>
                )}

                <div className="id-block">
                  <span className="product-id">
                    Mã sản phẩm: {product.ProductID}
                  </span>

                  <div className="rating">
                    <i className="fa fa-star" />
                    <i className="fa fa-star" />
                    <i className="fa fa-star" />
                    <i className="fa fa-star" />
                    <i className="fa fa-star-half-o" />
                    <span className="rating-count">0 đánh giá</span>
                  </div>
                </div>

                {isEdit ? (
                  <div className="price price-edit">
                    <strong>Giá bán:</strong>
                    <input
                      type="text"
                      inputMode="numeric"
                      min="0"
                      value={formatPriceWithDots(editFields.Price)}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      placeholder="Nhập giá bán"
                    />
                    <span className="price-currency">đ</span>
                  </div>
                ) : (
                  <span className="price">
                    {Number(product.Price)?.toLocaleString("vi-VN") + " đ"}
                    <span> (Đã bao gồm VAT)</span>
                  </span>
                )}

                {isEdit ? (
                  <div className="product-brand-field">
                    <strong>Thương hiệu:</strong>
                    <select
                      value={editFields.SupplierID || ""}
                      onChange={(e) => handleInputChange("SupplierID", e.target.value)}
                    >
                      <option value="">-- Chọn thương hiệu --</option>
                      {brands.map((item) => (
                        <option key={item.idBrand} value={item.idBrand}>
                          {item.Brand || item.name || item.idBrand}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="brand-row">
                    <strong>Thương hiệu:</strong> {currentBrandName}
                  </p>
                )}

                {isEdit ? (
                  <div className="sale-edit-panel">
                    <div className="sale-edit-panel__head">
                      <div>
                        <strong>Khuyến mãi</strong>
                        <span>Thiết lập sale riêng cho sản phẩm này</span>
                      </div>
                    </div>

                    <div className="sale-mode-tabs" role="group" aria-label="Chọn kiểu sale">
                      <button
                        type="button"
                        className={currentSaleMode === "none" ? "is-active" : ""}
                        onClick={() => handleSaleModeChange("none")}
                      >
                        Không sale
                      </button>
                      <button
                        type="button"
                        className={currentSaleMode === "independent" ? "is-active" : ""}
                        onClick={() => handleSaleModeChange("independent")}
                      >
                        Sale độc lập
                      </button>
                      <button
                        type="button"
                        className={currentSaleMode === "event" ? "is-active" : ""}
                        onClick={() => handleSaleModeChange("event")}
                      >
                        Theo event
                      </button>
                    </div>

                    {currentSaleMode !== "none" && (
                      <div className="sale-edit-grid">
                        <label className="sale-edit-field">
                          <span>Giá sale</span>
                          <div className="sale-money-input">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatPriceWithDots(editFields.salePrice)}
                              onChange={(e) => handleSalePriceChange(e.target.value)}
                              placeholder="Nhập giá sale"
                            />
                            <em>đ</em>
                          </div>
                        </label>

                        {currentSaleMode === "event" ? (
                          <label className="sale-edit-field sale-edit-field--wide">
                            <span>Sự kiện sale</span>
                            <select
                              value={editFields.saleEventId || ""}
                              onChange={(e) => handleSaleEventChange(e.target.value)}
                            >
                              <option value="">-- Chọn sự kiện --</option>
                              {saleEvents.map((event) => (
                                <option key={event.id} value={event.id}>
                                  {event.title || event.code || `Event ${event.id}`}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : (
                          <>
                            <label className="sale-edit-field">
                              <span>Ngày bắt đầu</span>
                              <input
                                type="date"
                                value={editFields.saleStartDate || ""}
                                onChange={(e) => handleInputChange("saleStartDate", e.target.value)}
                              />
                            </label>
                            <label className="sale-edit-field">
                              <span>Ngày kết thúc</span>
                              <input
                                type="date"
                                value={editFields.saleEndDate || ""}
                                onChange={(e) => handleInputChange("saleEndDate", e.target.value)}
                              />
                            </label>
                          </>
                        )}

                        {currentSaleMode === "event" && selectedSaleEvent && (
                          <div className="sale-event-preview">
                            <span>{selectedSaleEvent.title}</span>
                            <small>{formatDate(selectedSaleEvent.start_date)} - {formatDate(selectedSaleEvent.end_date)}</small>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`sale-view-panel ${hasCurrentSale ? "has-sale" : ""}`}>
                    <strong>Khuyến mãi:</strong>
                    {hasCurrentSale ? (
                      <>
                        <span>{Number(currentSalePrice).toLocaleString("vi-VN")} đ</span>
                        <small>{currentSaleLabel} · {saleDateLabel}</small>
                      </>
                    ) : (
                      <span>Chưa áp dụng sale</span>
                    )}
                  </div>
                )}

                {isEdit ? (
                  <>
                    <p className="stock">
                      <strong>Tồn kho:</strong> {editableStock}
                    </p>
                    <div className="lot-panel is-edit">
                      <div className="lot-edit-toolbar">
                        <button
                          type="button"
                          className="lot-edit-add"
                          onClick={handleAddEditableBatch}
                        >
                          + Thêm lô
                        </button>
                      </div>
                      {editableBatches.length === 0 ? (
                        <p className="lot-empty">Không có dữ liệu lô hàng</p>
                      ) : (
                        <>
                          <div className="lot-edit-list">
                            {editableBatches.map((batch, index) => {
                              const isSelected =
                                (selectedEditableBatch && selectedEditableBatch.batchId === batch.batchId) ||
                                (!selectedEditableBatch && index === 0);
                              return (
                                <button
                                  type="button"
                                  className={`lot-edit-select ${isSelected ? "is-selected" : ""}`}
                                  key={`${batch.batchId}_${index}`}
                                  onClick={() => setSelectedBatchId(batch.batchId)}
                                >
                                  <span>{getLotDisplayLabel(batch, index)}</span>
                                  <small>Ngày nhập: {formatDate(batch.createdAt)}</small>
                                </button>
                              );
                            })}
                          </div>

                          {selectedEditableBatch && (
                            <div className="lot-edit-form">
                              <div className="lot-edit-title">
                                Đang chỉnh: {getLotDisplayLabel(selectedEditableBatch, selectedEditableBatchIndex >= 0 ? selectedEditableBatchIndex : 0)}
                              </div>
                              <div className="lot-edit-import-date">
                                Ngày nhập lô: {formatDate(selectedEditableBatch.createdAt)}
                              </div>

                              <div className="lot-edit-row-inline">
                                <div className="lot-edit-field">
                                  <span className="lot-edit-field__label">Mã lô</span>
                                  <input
                                    type="text"
                                    value={selectedEditableBatch.batchId}
                                    onFocus={() => setIsBatchDropdownOpen(true)}
                                    onBlur={() => {
                                      window.setTimeout(() => setIsBatchDropdownOpen(false), 120);
                                    }}
                                    onChange={(e) => {
                                      handleBatchFieldChange(
                                        selectedEditableBatchIndex >= 0 ? selectedEditableBatchIndex : 0,
                                        "batchId",
                                        e.target.value
                                      );
                                      setIsBatchDropdownOpen(true);
                                    }}
                                    placeholder="Nhập hoặc chọn mã lô"
                                  />
                                  {isBatchDropdownOpen && filteredBatchOptions.length > 0 && (
                                    <div className="lot-edit-batch-dropdown">
                                      {filteredBatchOptions.slice(0, 8).map((item) => (
                                        <button
                                          key={`edit_lot_picker_${item.value}`}
                                          type="button"
                                          className="lot-edit-batch-option"
                                          onMouseDown={() => handleSelectBatchOption(item.value)}
                                        >
                                          <span>{item.value}</span>
                                          {item.note && <small>{item.note}</small>}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="lot-edit-field">
                                  <span className="lot-edit-field__label">Barcode lô</span>
                                  <input
                                    type="text"
                                    value={selectedEditableBatch.barcode}
                                    onChange={(e) =>
                                      handleBatchFieldChange(
                                        selectedEditableBatchIndex >= 0 ? selectedEditableBatchIndex : 0,
                                        "barcode",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Nhập barcode"
                                  />
                                </div>

                                <div className="lot-edit-field">
                                  <span className="lot-edit-field__label">Số lượng trong lô</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={selectedEditableBatch.quantity}
                                    onChange={(e) =>
                                      handleBatchFieldChange(
                                        selectedEditableBatchIndex >= 0 ? selectedEditableBatchIndex : 0,
                                        "quantity",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Nhập số lượng"
                                  />
                                </div>

                                <div className="lot-edit-field">
                                  <span className="lot-edit-field__label">Hạn sử dụng</span>
                                  <input
                                    type="date"
                                    value={selectedEditableBatch.expiryDate || ""}
                                    onChange={(e) =>
                                      handleBatchFieldChange(
                                        selectedEditableBatchIndex >= 0 ? selectedEditableBatchIndex : 0,
                                        "expiryDate",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="stock">
                      <strong>Tồn kho:</strong> {product.StockQuantity}
                    </p>
                    <div className="lot-panel">
                      {batchDetails.length === 0 && (
                        <p className="lot-empty">Không có dữ liệu lô hàng</p>
                      )}

                      {batchDetails.length > 0 && (
                        <div className="lot-content">
                          <div className="lot-list">
                            {batchDetails.map((batch, index) => {
                              const isActive =
                                (selectedBatch && selectedBatch.batchId === batch.batchId) ||
                                (!selectedBatch && batch.batchId === batchDetails[0].batchId);
                              const lotLabel = getLotDisplayLabel(batch, index);
                              return (
                                <div
                                  key={`${batch.batchId}_${batch.barcode}`}
                                  className={`lot-item-row ${isActive ? "is-active" : ""}`}
                                >
                                  <button
                                    type="button"
                                    className="lot-item"
                                    onClick={() => setSelectedBatchId(batch.batchId)}
                                  >
                                    <span className="lot-item__id">{lotLabel}</span>
                                    <span className="lot-item__import-date">Ngày nhập: {formatDate(batch.createdAt)}</span>
                                    <span className="lot-item__meta">
                                      <LotBarcode value={batch.barcode} />
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-lot-print"
                                    onClick={() => handlePrintBatchBarcode(batch)}
                                    disabled={!String(batch.barcode || "").trim()}
                                    title="In barcode lô hàng"
                                  >
                                    In mã
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          <div className="lot-detail">
                            <p>
                              <strong>Ngày nhập:</strong> {selectedBatch ? formatDate(selectedBatch.createdAt) : "Không có"}
                            </p>
                            <p>
                              <strong>Số lượng:</strong> {selectedBatch?.quantity ?? 0}
                            </p>
                            <p>
                              <strong>Hạn sử dụng:</strong> {selectedBatch ? formatDate(selectedBatch.expiryDate) : "Không có"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          )}

          {isProductActive && (
          <div className="product-info-nav">
            {productSections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
              >
                {section.label}
              </button>
            ))}
          </div>
          )}

          {isProductActive && (
          <div className="product-info-group">
            {productSections.map(({ label, field, id, className }) => (
              <div
                className={`product-info-section ${className}`}
                id={id}
                key={field}
              >
                <span className="product-info-section__label">{label}</span>
                {isEdit ? (
                  <ReactQuill
                    value={editFields[field]}
                    onChange={(value) => handleInputChange(field, value)}
                  />
                ) : (
                  <div
                    className="content"
                    dangerouslySetInnerHTML={{ __html: product[field] }}
                  />
                )}
              </div>
            ))}
          </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductDetail;
