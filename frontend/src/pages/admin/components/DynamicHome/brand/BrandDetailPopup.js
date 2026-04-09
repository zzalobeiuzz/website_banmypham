import React, { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import AdminLoadingScreen from "../../shared/AdminLoadingScreen";
import useMinimumLoading from "../../useMinimumLoading";
import ProductAssignPicker from "../shared/ProductAssignPicker";

// Chuẩn hóa trạng thái thương hiệu về kiểu boolean để render UI.
const isBrandActive = (status) =>
  status === 1 || 
  status === "1" ||
  String(status).toLowerCase() === "active" ||
  String(status).toLowerCase() === "true";

// Kiểm tra sản phẩm có đang hiển thị hay không (lọc bỏ sản phẩm bị ẩn).
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

  // Hiện nút cuộn lên đầu khi nội dung popup được cuộn xuống.
  const [showScrollTop, setShowScrollTop] = useState(false);
  // Danh sách tất cả sản phẩm đang thuộc thương hiệu hiện tại.
  const [brandProducts, setBrandProducts] = useState([]);
  // Danh sách preview (một phần nhỏ từ brandProducts) để hiển thị nhanh trên popup.
  const [previewProducts, setPreviewProducts] = useState([]);
  // Danh sách sản phẩm gợi ý để thêm vào thương hiệu.
  const [suggestProducts, setSuggestProducts] = useState([]);
  // Mảng ProductID đã chọn trong bảng gợi ý.
  const [selectedSuggestProductIds, setSelectedSuggestProductIds] = useState([]);
  // Bật/tắt vùng ProductAssignPicker trong chế độ chỉnh sửa.
  const [showSuggestPicker, setShowSuggestPicker] = useState(false);
  // Giá trị ô tìm theo mã/barcode trong bảng gợi ý.
  const [searchSuggestCode, setSearchSuggestCode] = useState("");
  // Giá trị ô tìm theo tên sản phẩm trong bảng gợi ý.
  const [searchSuggestName, setSearchSuggestName] = useState("");
  // Trạng thái đang tải dữ liệu sản phẩm từ API.
  const [loadingProducts, setLoadingProducts] = useState(false);
  const showLoadingProducts = useMinimumLoading(loadingProducts, 500);
  // Trạng thái popup đang ở chế độ chỉnh sửa hay chỉ xem.
  const [isEditing, setIsEditing] = useState(false);
  // Trạng thái kéo-thả logo để đổi style vùng upload.
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  // File logo mới người dùng chọn từ máy.
  const [logoFile, setLogoFile] = useState(null);
  // URL preview logo (từ file local hoặc URL nhập vào).
  const [logoPreview, setLogoPreview] = useState("");
  // Dữ liệu form thông tin thương hiệu đang hiển thị/chỉnh sửa.
  const [form, setForm] = useState({
    idBrand: "",
    Brand: "",
    description: "",
    status: "1",
    logo_url: "",
  });

  // Khi đổi brand: reset form + trạng thái edit/suggest theo dữ liệu brand mới.
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

  // Tải danh sách sản phẩm, tách thành 2 nhóm: thuộc brand hiện tại và sản phẩm gợi ý để thêm.
  useEffect(() => {
    let mounted = true;

    // Chuẩn hóa text để so sánh id/tên không phân biệt hoa thường.
    const normalize = (value) =>
      String(value || "")
        .trim()
        .toLowerCase();

    // Xáo trộn để hiển thị danh sách gợi ý/preview đa dạng hơn.
    const shuffle = (arr) => {
      const cloned = [...arr];
      for (let i = cloned.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
      }
      return cloned;
    };

    // Lấy toàn bộ sản phẩm từ API rồi lọc theo brand hiện tại.
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

  // Theo dõi cuộn trong popup để hiện nút "lên đầu" khi người dùng cuộn xuống sâu.
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

  // Cập nhật từng field trong form chỉnh sửa.
  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Nhận file logo từ input, kiểm tra đúng kiểu ảnh rồi cập nhật preview.
  const handleLogoFile = (file) => {
    if (!(file instanceof File)) return;
    if (!String(file.type || "").startsWith("image/")) return;

    setLogoFile(file);
    setForm((prev) => ({ ...prev, logo_url: "" }));
    setLogoPreview(URL.createObjectURL(file));
  };

  // Xử lý kéo-thả logo: hỗ trợ cả file ảnh và URL ảnh.
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

  // Hủy chỉnh sửa: đưa form và vùng gợi ý về trạng thái ban đầu theo brand hiện tại.
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

  // Chọn/bỏ chọn sản phẩm trong danh sách gợi ý.
  const toggleSuggestProduct = (productId) => {
    const normalized = String(productId || "").trim();
    if (!normalized) return;

    setSelectedSuggestProductIds((prev) =>
      prev.includes(normalized)
        ? prev.filter((id) => id !== normalized)
        : [...prev, normalized],
    );
  };

  // Lọc danh sách gợi ý theo ô tìm kiếm mã/barcode và tên sản phẩm.
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

  // Lưu thay đổi brand và danh sách sản phẩm đã chọn để gán vào brand.
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

  // Cuộn popup về đầu trang.
  const handleScrollToTop = () => {
    const detailBody = detailModalBodyRef.current;
    if (detailBody) {
      detailBody.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Chuẩn hóa đường dẫn ảnh sản phẩm để luôn render được ảnh hợp lệ.
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
                {showLoadingProducts ? (
                  <AdminLoadingScreen message="Đang tải sản phẩm..." compact />
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
                          <ProductAssignPicker
                            products={filteredSuggestProducts}
                            selectedIds={selectedSuggestProductIds}
                            // Ngữ cảnh thương hiệu: chọn nhiều sản phẩm, lọc theo mã/tên.
                            onToggleProduct={toggleSuggestProduct}
                            searchCode={searchSuggestCode}
                            searchName={searchSuggestName}
                            onSearchCodeChange={setSearchSuggestCode}
                            onSearchNameChange={setSearchSuggestName}
                            contextHeader="Thương hiệu hiện tại"
                            getContextValue={(item) => item?.SupplierID || item?.supplierId || "N/A"}
                            emptyText="Không tìm thấy sản phẩm phù hợp."
                            resolveImageUrl={resolveProductImage}
                            fallbackImageUrl={`${UPLOAD_BASE}/pictures/no_image.jpg`}
                          />
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
