import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";

const initialForm = {
  code: "",
  title: "",
  description: "",
  start_date: "",
  end_date: "",
  total_products_count: 0,
  status: 1,
  metadata: "",
  bannerFile: null,
  bannerImageUrl: "",
};

const acceptTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/avif"];

const formatDateForInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const getDroppedUrl = (dataTransfer) => {
  const uriList = dataTransfer?.getData("text/uri-list");
  const plainText = dataTransfer?.getData("text/plain");
  const html = dataTransfer?.getData("text/html");
  const htmlSrc = String(html || "").match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
  const value = String(uriList || plainText || htmlSrc || "").split(/\r?\n/).find((line) => /^https?:\/\//i.test(line.trim()));
  return value ? value.trim() : "";
};

const resolveProductImageUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return `${UPLOAD_BASE}/pictures/no_image.jpg`;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:image/")) return raw;
  if (raw.startsWith("/uploads/")) return `${API_BASE}${raw}`;
  if (raw.startsWith("uploads/")) return `${API_BASE}/${raw}`;
  return `${UPLOAD_BASE}/pictures/${raw}`;
};

const resolveBannerImageUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:image/")) return raw;
  if (raw.startsWith("/uploads/")) return `${API_BASE}${raw}`;
  if (raw.includes("/")) return `${API_BASE}/${raw.replace(/^\/+/, "")}`;
  return `${API_BASE}/uploads/assets/pictures/BannerImage/${raw}`;
};

const formatMoney = (value) => `${(Number(value) || 0).toLocaleString("vi-VN")}đ`;

const parseMoney = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? Number(digits) : 0;
};

const getHomeBannerMetadata = (value) => {
  if (value === "main") {
    return {
      showOnHome: true,
      homeBannerSection: "main",
      homeBannerPosition: "center",
    };
  }

  if (value === "side_top") {
    return {
      showOnHome: true,
      homeBannerSection: "side",
      homeBannerPosition: "top",
    };
  }

  if (value === "side_bottom") {
    return {
      showOnHome: true,
      homeBannerSection: "side",
      homeBannerPosition: "bottom",
    };
  }

  return null;
};

const getHomeBannerPositionFromMetadata = (value) => {
  try {
    const metadata = typeof value === "string" ? JSON.parse(value || "{}") : value;
    if (metadata?.homeBannerSection === "main") return "main";
    if (metadata?.homeBannerSection === "side" && metadata?.homeBannerPosition === "top") return "side_top";
    if (metadata?.homeBannerSection === "side" && metadata?.homeBannerPosition === "bottom") return "side_bottom";
  } catch {
    return "";
  }
  return "";
};

const CreateDiscountEventModal = ({ open, onClose, onSaved, showPopup, event = null }) => {
  const { request } = useHttp();
  const inputRef = useRef(null);
  const descriptionRef = useRef(null);
  const previewUrlRef = useRef("");
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [products, setProducts] = useState([]);
  const [productKeyword, setProductKeyword] = useState("");
  const [saleProducts, setSaleProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [unavailableProductIds, setUnavailableProductIds] = useState(new Set());
  const [activeSection, setActiveSection] = useState("info");
  const isEditMode = Boolean(event?.id);

  useEffect(() => {
    if (!open) return undefined;

    setForm(
      event
        ? {
            code: String(event.code || ""),
            title: String(event.title || ""),
            description: String(event.description || ""),
            start_date: formatDateForInput(event.start_date),
            end_date: formatDateForInput(event.end_date),
            total_products_count: Number(event.total_products_count || 0),
            status: Number(event.status) === 1 ? 1 : 0,
            metadata: getHomeBannerPositionFromMetadata(event.metadata),
            bannerFile: null,
            bannerImageUrl: "",
          }
        : initialForm,
    );
    setSaleProducts(
      Array.isArray(event?.sale_products)
        ? event.sale_products.map((item) => ({
            product_id: String(item?.product_id || ""),
            product_name: String(item?.ProductName || item?.product_name || ""),
            image: item?.Image || item?.image || "",
            original_price: Number(item?.Price || item?.original_price || 0),
            sale_price: Number(item?.sale_price || 0),
          })).filter((item) => item.product_id)
        : [],
    );
    setProductKeyword("");
    setUnavailableProductIds(new Set());
    setActiveSection("info");

    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = "";
      }
    };
  }, [event, open]);

  useEffect(() => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    requestAnimationFrame(() => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  }, [activeSection, form.description, open]);

  useEffect(() => {
    if (!open) return;

    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const res = await request("GET", `${API_BASE}/api/user/products/loadAllProducts`);
        setProducts(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
        setProducts([]);
        showPopup?.({ status: "error", message: error?.message || "Không thể tải danh sách sản phẩm." });
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, [open, request, showPopup]);

  useEffect(() => {
    if (!open) return;

    const loadUnavailableProducts = async () => {
      try {
        const params = new URLSearchParams();
        if (form.start_date) params.set("start_date", form.start_date);
        if (form.end_date) params.set("end_date", form.end_date);
        if (event?.id) params.set("excludeSaleEventId", event.id);
        const suffix = params.toString() ? `?${params.toString()}` : "";
        const res = await request("GET", `${API_BASE}/api/admin/sale-events/unavailable-products${suffix}`);
        const rows = Array.isArray(res?.data) ? res.data : [];
        setUnavailableProductIds(new Set(rows.map((row) => String(row?.product_id || "").trim()).filter(Boolean)));
      } catch (error) {
        setUnavailableProductIds(new Set());
      }
    };

    loadUnavailableProducts();
  }, [event?.id, form.start_date, form.end_date, open, request]);

  const selectedProductIds = useMemo(
    () => new Set(saleProducts.map((item) => String(item.product_id || ""))),
    [saleProducts],
  );

  useEffect(() => {
    if (!open || unavailableProductIds.size === 0) return;

    setSaleProducts((prev) => {
      const next = prev.filter((item) => !unavailableProductIds.has(String(item.product_id || "")));
      if (next.length !== prev.length) {
        showPopup?.({
          status: "warning",
          message: "Đã bỏ sản phẩm đang sale ở chương trình khác khỏi sự kiện này.",
        });
      }
      return next;
    });
  }, [open, showPopup, unavailableProductIds]);

  const filteredProducts = useMemo(() => {
    const keyword = String(productKeyword || "").trim().toLowerCase();
    return products
      .filter((product) => {
        const productId = String(product?.ProductID || "");
        if (!productId || selectedProductIds.has(productId)) return false;
        if (unavailableProductIds.has(productId)) return false;
        if (!keyword) return true;
        const productName = String(product?.ProductName || "").toLowerCase();
        return productId.toLowerCase().includes(keyword) || productName.includes(keyword);
      })
      .slice(0, 8);
  }, [productKeyword, products, selectedProductIds, unavailableProductIds]);

  const bannerPreview = useMemo(() => {
    if (form.bannerFile) {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = URL.createObjectURL(form.bannerFile);
      return previewUrlRef.current;
    }
    if (form.bannerImageUrl) return String(form.bannerImageUrl || "").trim();
    return isEditMode ? resolveBannerImageUrl(event?.banner_image) : "";
  }, [event?.banner_image, form.bannerFile, form.bannerImageUrl, isEditMode]);

  const setFile = (file) => {
    if (!file) return;
    if (file.type && !acceptTypes.includes(file.type)) {
      showPopup?.({ status: "error", message: "Ảnh không hợp lệ. Chỉ nhận JPG, PNG, WEBP, GIF, AVIF." });
      return;
    }
    setForm((prev) => ({ ...prev, bannerFile: file, bannerImageUrl: "" }));
  };

  const setBannerUrl = (value) => {
    setForm((prev) => ({ ...prev, bannerImageUrl: value, bannerFile: null }));
  };

  const onInputChange = (key) => (e) => {
    const value = e?.target?.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onDescriptionChange = (e) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
    setForm((prev) => ({ ...prev, description: textarea.value }));
  };

  const onPickFile = () => inputRef.current?.click();

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      setFile(file);
      return;
    }

    const droppedUrl = getDroppedUrl(e.dataTransfer);
    if (droppedUrl) {
      setBannerUrl(droppedUrl);
      return;
    }

    showPopup?.({ status: "error", message: "Vui lòng kéo file ảnh hoặc URL ảnh hợp lệ." });
  };

  const addSaleProduct = (product) => {
    const productId = String(product?.ProductID || "").trim();
    if (!productId || selectedProductIds.has(productId)) return;
    if (unavailableProductIds.has(productId)) {
      showPopup?.({ status: "warning", message: "Sản phẩm này đang sale ở chương trình khác trong khoảng thời gian đã chọn." });
      return;
    }

    setSaleProducts((prev) => [
      ...prev,
      {
        product_id: productId,
        product_name: String(product?.ProductName || ""),
        image: product?.Image || "",
        original_price: Number(product?.Price || 0),
        sale_price: Number(product?.sale_price || product?.Price || 0),
      },
    ]);
    setProductKeyword("");
  };

  const updateSaleProductPrice = (productId, value) => {
    const price = parseMoney(value);
    setSaleProducts((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, sale_price: price }
          : item,
      ),
    );
  };

  const removeSaleProduct = (productId) => {
    setSaleProducts((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const validate = () => {
    if (!String(form.title || "").trim()) return "Tiêu đề sự kiện không được để trống.";
    if (!isEditMode && !form.bannerFile && !String(form.bannerImageUrl || "").trim()) {
      return "Vui lòng chọn ảnh từ máy hoặc nhập URL ảnh banner.";
    }
    if (form.bannerImageUrl && !/^https?:\/\//i.test(String(form.bannerImageUrl).trim())) {
      return "URL ảnh banner phải bắt đầu bằng http hoặc https.";
    }
    if (form.start_date && form.end_date && new Date(form.start_date) > new Date(form.end_date)) {
      return "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.";
    }
    if (saleProducts.length === 0) return "Vui lòng chọn ít nhất một sản phẩm sale.";
    if (saleProducts.some((item) => !item.product_id || !Number(item.sale_price))) {
      return "Vui lòng nhập giá sale lớn hơn 0 cho tất cả sản phẩm.";
    }
    if (saleProducts.some((item) => Number(item.original_price || 0) > 0 && Number(item.sale_price || 0) >= Number(item.original_price || 0))) {
      return "Giá sale phải nhỏ hơn giá gốc.";
    }
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      showPopup?.({ status: "error", message: err });
      return;
    }

    const payload = new FormData();
    payload.append("code", String(form.code || "").trim());
    payload.append("title", String(form.title || "").trim());
    payload.append("description", String(form.description || "").trim());
    payload.append("start_date", form.start_date || "");
    payload.append("end_date", form.end_date || "");
    payload.append("status", String(Number(form.status) === 1 ? 1 : 0));
    payload.append("total_products_count", String(saleProducts.length));
    const metadata = getHomeBannerMetadata(form.metadata);
    payload.append("metadata", metadata ? JSON.stringify(metadata) : "");
    payload.append(
      "saleProducts",
      JSON.stringify(saleProducts.map((item) => ({
        product_id: item.product_id,
        sale_price: Number(item.sale_price || 0),
      }))),
    );
    if (form.bannerFile) payload.append("bannerFile", form.bannerFile);
    if (form.bannerImageUrl) payload.append("bannerImageUrl", String(form.bannerImageUrl).trim());

    try {
      setSubmitting(true);
      const url = isEditMode
        ? `${API_BASE}/api/admin/sale-events/${encodeURIComponent(String(event.id))}`
        : `${API_BASE}/api/admin/sale-events`;
      const res = await request(isEditMode ? "PUT" : "POST", url, payload);
      if (!res?.success) {
        showPopup?.({ status: "error", message: res?.message || "Không thể lưu sự kiện giảm giá." });
        return;
      }

      showPopup?.({ status: "success", message: isEditMode ? "Cập nhật sự kiện giảm giá thành công." : "Tạo sự kiện giảm giá thành công." });
      onSaved?.(res.data || null);
      onClose?.();
      setForm(initialForm);
      setSaleProducts([]);
    } catch (error) {
      showPopup?.({ status: "error", message: error?.message || "Không thể lưu sự kiện giảm giá." });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal show sale-event-modal" tabIndex={-1} style={{ display: "block", background: "rgba(15,23,42,0.55)" }}>
      <div className="modal-dialog modal-xl sale-event-modal__dialog">
        <form className="modal-content sale-event-modal__content" onSubmit={submit}>
          <div className="modal-header sale-event-modal__header">
            <div>
              <div className="sale-event-modal__eyebrow">Sale Event Admin</div>
              <h5 className="modal-title">{isEditMode ? "Sửa sự kiện giảm giá" : "Tạo sự kiện giảm giá"}</h5>
            </div>
            <button type="button" className="sale-event-modal__close" aria-label="Đóng" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="modal-body sale-event-modal__body">
            <div className="sale-event-banner-top">
              <div
                className={`sale-event-upload ${isDragging ? "is-dragging" : ""}`}
                onClick={onPickFile}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => setFile(e.target.files?.[0])}
                />

                {bannerPreview ? (
                  <img className="sale-event-upload__preview" src={bannerPreview} alt="banner preview" />
                ) : (
                  <div className="sale-event-upload__empty">
                    <div className="sale-event-upload__icon">+</div>
                    <div className="sale-event-upload__title">Kéo ảnh vào đây</div>
                    <div className="sale-event-upload__text">Chọn file từ máy hoặc kéo ảnh từ web</div>
                  </div>
                )}
              </div>

            </div>

            <div className="sale-event-modal__tabs" role="tablist" aria-label="Nội dung sự kiện">
              <button
                type="button"
                className={activeSection === "info" ? "is-active" : ""}
                onClick={() => setActiveSection("info")}
              >
                Thông tin
              </button>
              <button
                type="button"
                className={activeSection === "products" ? "is-active" : ""}
                onClick={() => setActiveSection("products")}
              >
                Sản phẩm sale
                <span>{saleProducts.length}</span>
              </button>
            </div>

            {activeSection === "info" && (
              <div className="sale-event-modal__panel">
                <div className="sale-event-section">
                  <div className="sale-event-section__header">
                    <h6>Thông tin sự kiện</h6>
                    <span>Tên, thời gian và cách hiển thị chương trình</span>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">Mã sự kiện</label>
                      <input className="form-control" value={form.code} onChange={onInputChange("code")} placeholder="SUMMER-2026" />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label">Tiêu đề</label>
                      <input className="form-control" value={form.title} onChange={onInputChange("title")} placeholder="Summer Beauty Flash Sale" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Mô tả</label>
                      <textarea
                        ref={descriptionRef}
                        className="form-control sale-event-modal__description"
                        rows={1}
                        value={form.description}
                        onChange={onDescriptionChange}
                        placeholder="Mô tả ngắn về chương trình..."
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Ngày bắt đầu</label>
                      <input type="datetime-local" className="form-control" value={form.start_date} onChange={onInputChange("start_date")} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Ngày kết thúc</label>
                      <input type="datetime-local" className="form-control" value={form.end_date} onChange={onInputChange("end_date")} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Số sản phẩm sale</label>
                      <input type="number" className="form-control" value={saleProducts.length} readOnly />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Trạng thái</label>
                      <select className="form-select" value={form.status} onChange={onInputChange("status")}>
                        <option value={1}>Hoạt động</option>
                        <option value={0}>Tắt</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Vị trí banner</label>
                      <select className="form-select" value={form.metadata} onChange={onInputChange("metadata")}>
                        <option value="">Không hiện trang chủ</option>
                        <option value="main">Main - ở giữa</option>
                        <option value="side_top">Side - phía trên</option>
                        <option value="side_bottom">Side - phía dưới</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "products" && (
            <div className="sale-event-products sale-event-section sale-event-modal__panel">
              <div className="sale-event-products__header">
                <div>
                  <h6>Sản phẩm sale</h6>
                  <span>{saleProducts.length} sản phẩm được chọn</span>
                </div>
                <div className="sale-event-products__search">
                  <input
                    type="text"
                    className="form-control"
                    value={productKeyword}
                    onChange={(e) => setProductKeyword(e.target.value)}
                    placeholder="Tìm theo mã hoặc tên sản phẩm..."
                  />
                  {String(productKeyword || "").trim() && (
                    <div className="sale-event-products__dropdown">
                      {loadingProducts ? (
                        <div className="sale-event-products__empty">Đang tải sản phẩm...</div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="sale-event-products__empty">Không có sản phẩm phù hợp.</div>
                      ) : (
                        filteredProducts.map((product) => {
                          const productId = String(product?.ProductID || "");
                          return (
                            <button
                              type="button"
                              key={productId}
                              className="sale-event-products__option"
                              onClick={() => addSaleProduct(product)}
                            >
                              <img src={resolveProductImageUrl(product?.Image)} alt={String(product?.ProductName || productId)} />
                              <span>
                                <strong>{productId}</strong>
                                <small>{product?.ProductName || "Không có tên"}</small>
                              </span>
                              <em>{formatMoney(product?.Price)}</em>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="sale-event-products__table">
                {saleProducts.length === 0 ? (
                  <div className="sale-event-products__empty-row">Chưa chọn sản phẩm sale.</div>
                ) : (
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Giá gốc</th>
                        <th>Giá sale</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleProducts.map((item) => (
                        <tr key={item.product_id}>
                          <td>
                            <div className="sale-event-products__selected">
                              <img src={resolveProductImageUrl(item.image)} alt={item.product_name || item.product_id} />
                              <span>
                                <strong>{item.product_id}</strong>
                                <small>{item.product_name || "Không có tên"}</small>
                              </span>
                            </div>
                          </td>
                          <td>{formatMoney(item.original_price)}</td>
                          <td>
                            <input
                              className={`form-control form-control-sm ${Number(item.original_price || 0) > 0 && Number(item.sale_price || 0) >= Number(item.original_price || 0) ? "is-invalid" : ""}`}
                              inputMode="numeric"
                              value={formatMoney(item.sale_price)}
                              onChange={(e) => updateSaleProductPrice(item.product_id, e.target.value)}
                            />
                            {Number(item.original_price || 0) > 0 && Number(item.sale_price || 0) >= Number(item.original_price || 0) ? (
                              <div className="invalid-feedback d-block">Phải nhỏ hơn giá gốc</div>
                            ) : null}
                          </td>
                          <td className="text-end">
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeSaleProduct(item.product_id)}>
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            )}
          </div>

          <div className="modal-footer sale-event-modal__footer">
            <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Đang lưu..." : isEditMode ? "Lưu thay đổi" : "Tạo sự kiện"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDiscountEventModal;
