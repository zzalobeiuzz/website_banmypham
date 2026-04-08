import lottie from "lottie-web";
import React, { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import JsBarcode from "jsbarcode";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
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
  const loadingRef = useRef();

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedImageName, setSelectedImageName] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [editableBatches, setEditableBatches] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

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
    if (loadingRef.current && loading) {
      const anim = lottie.loadAnimation({
        container: loadingRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/animations/Trail loading.json",
      });
      return () => anim.destroy();
    }
  }, [loading]);

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
  };

  const handleCancelEdit = () => {
    if (!product) {
      setIsEdit(false);
      return;
    }

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
        batchDetails: editableBatches.map((batch) => ({
          batchId: batch.batchId,
          barcode: String(batch.barcode || "").trim(),
          quantity: Number(batch.quantity || 0),
          expiryDate: batch.expiryDate || null,
        })),
      };

      const res = await request(
        "PUT",
        `${API_BASE}/api/admin/products/updateProductDetail`,
        payload
      );

      if (!res?.success) {
        window.alert(res?.message || "Không thể cập nhật chi tiết sản phẩm");
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
        StockQuantity: editableStock,
        batchDetails: editableBatches,
      }));

      setSelectedBatchId(editableBatches?.[0]?.batchId || null);
      setIsEdit(false);
      window.alert("Cập nhật sản phẩm thành công");
    } catch (error) {
      console.error("Lỗi cập nhật chi tiết sản phẩm:", error);
      window.alert("Không thể cập nhật chi tiết sản phẩm");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintBatchBarcode = (batch) => {
    const barcodeValue = String(batch?.barcode || "").trim();
    if (!barcodeValue) {
      window.alert("Lô hàng này chưa có barcode để in.");
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
      window.alert("Không thể tạo barcode để in.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=520,height=720");
    if (!printWindow) {
      window.alert("Trình duyệt đã chặn popup in. Hãy cho phép popup.");
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
      {loading && (
        <div className="product-detail__loading">
          <div ref={loadingRef} className="product-detail__loading-animation" />
          <p>Đang tải thông tin sản phẩm...</p>
        </div>
      )}

      {!loading && (
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
                  <>
                    <p className="stock">
                      <strong>Tồn kho:</strong> {editableStock}
                    </p>
                    <div className="lot-panel is-edit">
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
