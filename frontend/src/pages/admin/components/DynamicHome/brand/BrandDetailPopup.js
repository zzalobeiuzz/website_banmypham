import React, { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";

const isBrandActive = (status) =>
  status === 1 ||
  status === "1" ||
  String(status).toLowerCase() === "active" ||
  String(status).toLowerCase() === "true";

const isProductVisible = (item) => {
  const value = item?.IsHidden ?? item?.isHidden;
  return (
    value === undefined ||
    value === null ||
    value === 0 ||
    value === "0" ||
    value === false ||
    String(value).toLowerCase() === "false"
  );
};

const BrandDetailPopup = ({
  brand,
  onClose,
  resolveBrandLogoUrl,
  quillModules,
  onSave,
  saving,
  onViewAllProducts,
  onViewProductDetail,
}) => {
  const { request } = useHttp();
  const detailModalBodyRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [brandProducts, setBrandProducts] = useState([]);
  const [previewProducts, setPreviewProducts] = useState([]);
  const [suggestProducts, setSuggestProducts] = useState([]);
  const [selectedSuggestProductIds, setSelectedSuggestProductIds] = useState([]);
  const [showSuggestPicker, setShowSuggestPicker] = useState(false);
  const [searchSuggestCode, setSearchSuggestCode] = useState("");
  const [searchSuggestName, setSearchSuggestName] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [form, setForm] = useState({
    idBrand: "",
    Brand: "",
    description: "",
    status: "1",
    logo_url: "",
  });

  useEffect(() => {
    if (!brand) return;

    setIsEditing(false);
    setIsDraggingLogo(false);
    setLogoFile(null);

    const normalizedStatus = isBrandActive(brand.status) ? "1" : "0";
    const normalizedLogoUrl = String(brand.logo_url || "").trim();

    setForm({
      idBrand: String(brand.idBrand || ""),
      Brand: String(brand.Brand || brand.name || ""),
      description: String(brand.description || ""),
      status: normalizedStatus,
      logo_url: normalizedLogoUrl,
    });

    setSelectedSuggestProductIds([]);
    setShowSuggestPicker(false);
    setSearchSuggestCode("");
    setSearchSuggestName("");

    setLogoPreview(resolveBrandLogoUrl(normalizedLogoUrl));
  }, [brand, resolveBrandLogoUrl]);

  useEffect(() => {
    let mounted = true;

    const normalize = (value) =>
      String(value || "")
        .trim()
        .toLowerCase();

    const shuffle = (arr) => {
      const cloned = [...arr];
      for (let i = cloned.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
      }
      return cloned;
    };

    const fetchBrandProducts = async () => {
      if (!brand) return;
      try {
        setLoadingProducts(true);
        const res = await request("GET", `${API_BASE}/api/user/products/loadAllProducts`);
        if (!mounted) return;

        const rows = Array.isArray(res?.data) ? res.data : [];
        const brandId = normalize(brand.idBrand);
        const brandName = normalize(brand.Brand || brand.name);

        const activeRows = rows.filter((item) => isProductVisible(item));

        const filtered = activeRows.filter((item) => {
          const supplier = normalize(item?.SupplierID || item?.supplierId || item?.Brand || item?.brand);
          return supplier && (supplier === brandId || supplier === brandName);
        });

        const suggest = activeRows.filter((item) => {
          const productId = String(item?.ProductID || item?.id || "").trim();
          if (!productId) return false;

          const supplier = normalize(item?.SupplierID || item?.supplierId || item?.Brand || item?.brand);
          return !(supplier && (supplier === brandId || supplier === brandName));
        });

        setBrandProducts(filtered);
        setPreviewProducts(shuffle(filtered).slice(0, 4));
        setSuggestProducts(shuffle(suggest).slice(0, 12));
      } catch (err) {
        if (!mounted) return;
        setBrandProducts([]);
        setPreviewProducts([]);
        setSuggestProducts([]);
      } finally {
        if (mounted) setLoadingProducts(false);
      }
    };

    fetchBrandProducts();

    return () => {
      mounted = false;
    };
  }, [brand, request]);

  useEffect(() => {
    if (!brand) {
      setShowScrollTop(false);
      return;
    }

    const detailBody = detailModalBodyRef.current;
    if (!detailBody) {
      setShowScrollTop(false);
      return;
    }

    const handleDetailScroll = () => {
      setShowScrollTop(detailBody.scrollTop > 120);
    };

    detailBody.addEventListener("scroll", handleDetailScroll, { passive: true });
    handleDetailScroll();

    return () => {
      detailBody.removeEventListener("scroll", handleDetailScroll);
    };
  }, [brand]);

  if (!brand) return null;

  const logoUrl = logoPreview || resolveBrandLogoUrl(form.logo_url);
  const active = isBrandActive(form.status);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoFile = (file) => {
    if (!(file instanceof File)) return;
    if (!String(file.type || "").startsWith("image/")) return;

    setLogoFile(file);
    setForm((prev) => ({ ...prev, logo_url: "" }));
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleLogoDrop = (e) => {
    e.preventDefault();
    setIsDraggingLogo(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleLogoFile(files[0]);
      return;
    }

    const droppedUrl =
      e.dataTransfer?.getData("text/uri-list") ||
      e.dataTransfer?.getData("text/plain") ||
      "";

    if (/^https?:\/\//i.test(String(droppedUrl).trim())) {
      const nextUrl = String(droppedUrl).trim();
      setLogoFile(null);
      setForm((prev) => ({ ...prev, logo_url: nextUrl }));
      setLogoPreview(nextUrl);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsDraggingLogo(false);
    setLogoFile(null);
    const normalizedStatus = isBrandActive(brand.status) ? "1" : "0";
    const normalizedLogoUrl = String(brand.logo_url || "").trim();

    setForm({
      idBrand: String(brand.idBrand || ""),
      Brand: String(brand.Brand || brand.name || ""),
      description: String(brand.description || ""),
      status: normalizedStatus,
      logo_url: normalizedLogoUrl,
    });
    setSelectedSuggestProductIds([]);
    setShowSuggestPicker(false);
    setSearchSuggestCode("");
    setSearchSuggestName("");
    setLogoPreview(resolveBrandLogoUrl(normalizedLogoUrl));
  };

  const toggleSuggestProduct = (productId) => {
    const normalized = String(productId || "").trim();
    if (!normalized) return;

    setSelectedSuggestProductIds((prev) =>
      prev.includes(normalized)
        ? prev.filter((id) => id !== normalized)
        : [...prev, normalized],
    );
  };

  const filteredSuggestProducts = suggestProducts.filter((item) => {
    const codeQuery = String(searchSuggestCode || "")
      .trim()
      .toLowerCase();
    const nameQuery = String(searchSuggestName || "")
      .trim()
      .toLowerCase();

    const productId = String(item?.ProductID || item?.id || "")
      .trim()
      .toLowerCase();
    const barcode = String(item?.Barcode || item?.barcode || "")
      .trim()
      .toLowerCase();
    const productName = String(item?.ProductName || item?.name || "")
      .trim()
      .toLowerCase();

    const matchedCode = !codeQuery || productId.includes(codeQuery) || barcode.includes(codeQuery);
    const matchedName = !nameQuery || productName.includes(nameQuery);

    return matchedCode && matchedName;
  });

  const handleSave = async () => {
    if (typeof onSave !== "function") return;

    const ok = await onSave({
      idBrand: form.idBrand,
      Brand: form.Brand,
      description: form.description,
      status: form.status,
      logo_url: form.logo_url,
      logoFile,
      assignProductIds: selectedSuggestProductIds,
    });

    if (ok) {
      setIsEditing(false);
      setLogoFile(null);
      setSelectedSuggestProductIds([]);
      setShowSuggestPicker(false);
      setSearchSuggestCode("");
      setSearchSuggestName("");
    }
  };

  const handleScrollToTop = () => {
    const detailBody = detailModalBodyRef.current;
    if (detailBody) {
      detailBody.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const resolveProductImage = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return `${UPLOAD_BASE}/pictures/no_image.jpg`;
    if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
    if (raw.startsWith("/uploads/")) return `${API_BASE}${raw}`;
    if (raw.startsWith("/")) return `${UPLOAD_BASE}${raw}`;
    return `${UPLOAD_BASE}/pictures/${raw}`;
  };

  return (
    <div className="brand-detail-modal" onClick={onClose}>
      <div className="brand-detail-modal__content" onClick={(e) => e.stopPropagation()}>
        <div className="brand-detail-modal__header">
          <h3>Chi tiết thương hiệu</h3>
          <div className="brand-detail-modal__header-actions">
            {!isEditing && (
              <button
                type="button"
                className="brand-btn-detail-edit"
                onClick={() => setIsEditing(true)}
                aria-label="Chỉnh sửa"
                title="Chỉnh sửa"
              >
                ✎
              </button>
            )}
            <button type="button" className="brand-detail-modal__close" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        {showScrollTop && (
          <button
            type="button"
            className="brand-detail-scroll-top"
            onClick={handleScrollToTop}
            aria-label="Lên đầu popup"
            title="Lên đầu popup"
          >
            ↑
          </button>
        )}

        <div ref={detailModalBodyRef} className="brand-detail-modal__body">
          <div className="brand-detail-form">
            <div className="brand-detail-top">
              <div className="brand-detail-logo-wrap">
                <div className="brand-detail-logo-box">
                  {logoUrl ? (
                    <img className="brand-detail-logo-img" src={logoUrl} alt={form.idBrand || "brand"} />
                  ) : (
                    <div className="brand-detail-logo-empty">Không có logo</div>
                  )}
                </div>

                {isEditing && (
                  <div
                    className={`brand-detail-logo-upload ${isDraggingLogo ? "dragging" : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingLogo(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingLogo(false);
                    }}
                    onDrop={handleLogoDrop}
                  >
                    <span>Kéo ảnh vào đây hoặc chọn từ máy</span>
                    <input
                      className="image-logo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoFile(e.target.files?.[0])}
                    />
                  </div>
                )}
              </div>

              <div className="brand-detail-info-wrap">
                <div className="brand-detail-info-item">
                  <label>ID Brand</label>
                  <input
                    className="brand-detail-input"
                    type="text"
                    value={form.idBrand}
                    disabled
                    readOnly
                  />
                </div>

                <div className="brand-detail-info-item">
                  <label>Tên thương hiệu</label>
                  <input
                    className="brand-detail-input"
                    type="text"
                    value={form.Brand}
                    onChange={(e) => handleChange("Brand", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="brand-detail-info-item">
                  <label>Trạng thái</label>
                  {isEditing ? (
                    <select
                      className="brand-detail-input"
                      value={form.status}
                      onChange={(e) => handleChange("status", e.target.value)}
                    >
                      <option value="1">Hoạt động</option>
                      <option value="0">Không hoạt động</option>
                    </select>
                  ) : (
                    <div className="brand-detail-value">
                      <span className={`brand-status ${active ? "active" : "inactive"}`}>
                        {active ? "Hoạt động" : "Không hoạt động"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="brand-detail-bottom">
              <label>Mô tả</label>
              <div className="brand-detail-modal__description">
                {isEditing ? (
                  <ReactQuill
                    theme="snow"
                    modules={quillModules}
                    value={form.description}
                    onChange={(value) => handleChange("description", value)}
                    placeholder="Nhập mô tả thương hiệu..."
                  />
                ) : form.description ? (
                  <div
                    className="brand-detail-modal__html"
                    dangerouslySetInnerHTML={{ __html: form.description }}
                  />
                ) : (
                  <p>Không có mô tả.</p>
                )}
              </div>
            </div>

            <div className="brand-detail-bottom">
              <label>Sản phẩm thuộc thương hiệu</label>
              <div className="brand-related-products">
                {loadingProducts ? (
                  <div className="brand-related-products__state">Đang tải sản phẩm...</div>
                ) : previewProducts.length === 0 ? (
                  <div className="brand-related-products__state">Chưa có sản phẩm thuộc thương hiệu này.</div>
                ) : (
                  <>
                    <div className="brand-related-products__grid">
                      {previewProducts.map((item) => (
                        <button
                          type="button"
                          className="brand-related-product-card brand-related-product-card--clickable"
                          key={item.ProductID || item.id || item.ProductName}
                          onClick={() => onViewProductDetail?.(item)}
                          title="Xem chi tiết sản phẩm"
                        >
                          <img
                            src={resolveProductImage(item.Image || item.image)}
                            alt={item.ProductName || "product"}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = `${UPLOAD_BASE}/pictures/no_image.jpg`;
                            }}
                          />
                          <div className="brand-related-product-card__meta">
                            <div className="brand-related-product-card__id">
                              ID: {item.ProductID || item.id || "N/A"}
                            </div>
                            <div className="brand-related-product-card__name">
                              {item.ProductName || "Sản phẩm"}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="brand-related-products__actions">
                      <button
                        type="button"
                        className="brand-btn-view-all-products"
                        onClick={() => onViewAllProducts?.(brand)}
                      >
                        Xem thêm ({brandProducts.length})
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="brand-detail-bottom">
                <label>Gợi ý thêm sản phẩm vào thương hiệu</label>
                <div className="brand-suggest-products">
                  <div className="brand-suggest-products__top-actions">
                    <button
                      type="button"
                      className="brand-btn-toggle-suggest"
                      onClick={() => setShowSuggestPicker((prev) => !prev)}
                      title={showSuggestPicker ? "Ẩn danh sách thêm sản phẩm" : "Thêm sản phẩm"}
                      aria-label={showSuggestPicker ? "Ẩn danh sách thêm sản phẩm" : "Thêm sản phẩm"}
                    >
                      +
                    </button>
                    {selectedSuggestProductIds.length > 0 && (
                      <span className="brand-suggest-products__selected-count">
                        Đã chọn: {selectedSuggestProductIds.length}
                      </span>
                    )}
                  </div>

                  {showSuggestPicker && (
                    <>
                      {suggestProducts.length === 0 ? (
                        <div className="brand-related-products__state">Không còn sản phẩm gợi ý.</div>
                      ) : (
                        <>
                          <div className="brand-suggest-products__hint">
                            Chọn sản phẩm muốn thêm vào thương hiệu này. Khi lưu, các sản phẩm được chọn sẽ chuyển sang thương hiệu hiện tại.
                          </div>
                          <div className="brand-suggest-products__filters">
                            <input
                              type="text"
                              value={searchSuggestCode}
                              onChange={(e) => setSearchSuggestCode(e.target.value)}
                              placeholder="Tìm theo ID/Barcode"
                            />
                            <input
                              type="text"
                              value={searchSuggestName}
                              onChange={(e) => setSearchSuggestName(e.target.value)}
                              placeholder="Tìm theo tên sản phẩm"
                            />
                          </div>
                          <div className="brand-suggest-products__table-wrap">
                            <table className="brand-suggest-products__table">
                              <thead>
                                <tr>
                                  <th>Chọn</th>
                                  <th>Mã sản phẩm</th>
                                  <th>Barcode</th>
                                  <th>Tên sản phẩm</th>
                                  <th>Thương hiệu hiện tại</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredSuggestProducts.length === 0 ? (
                                  <tr>
                                    <td colSpan={5}>Không tìm thấy sản phẩm phù hợp.</td>
                                  </tr>
                                ) : (
                                  filteredSuggestProducts.map((item) => {
                                    const pid = String(item?.ProductID || item?.id || "").trim();
                                    return (
                                      <tr key={pid || item?.ProductName}>
                                        <td>
                                          <input
                                            type="checkbox"
                                            checked={selectedSuggestProductIds.includes(pid)}
                                            onChange={() => toggleSuggestProduct(pid)}
                                          />
                                        </td>
                                        <td>{pid || "N/A"}</td>
                                        <td>{item?.Barcode || item?.barcode || "N/A"}</td>
                                        <td>{item?.ProductName || "N/A"}</td>
                                        <td>{item?.SupplierID || item?.supplierId || "N/A"}</td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="brand-detail-modal__actions">
              {isEditing && (
                <>
                  <button type="button" className="brand-btn-detail-cancel" onClick={handleCancelEdit}>
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="brand-btn-submit"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </>
              )}

              <button type="button" className="brand-btn-detail-close" onClick={onClose}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandDetailPopup;
