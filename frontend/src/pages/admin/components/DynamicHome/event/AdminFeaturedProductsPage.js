import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaBoxOpen, FaFire, FaPercent, FaPlus, FaSearch, FaTags, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import "./AdminFeaturedProductsPage.scss";

const pageConfig = {
  hot: {
    title: "Sản phẩm hot",
    eyebrow: "Hot products",
    description: "Danh sách sản phẩm đang được đánh dấu nổi bật trên hệ thống.",
    endpoint: "/api/user/products/hot",
    accent: "#ef4444",
    soft: "rgba(239, 68, 68, 0.12)",
    icon: FaFire,
  },
  sale: {
    title: "Sản phẩm sale",
    eyebrow: "Sale products",
    description: "Theo dõi các sản phẩm đang có giá khuyến mãi và thời gian sale.",
    endpoint: "/api/user/products/sale",
    accent: "#0f766e",
    soft: "rgba(15, 118, 110, 0.12)",
    icon: FaPercent,
  },
};

const formatNumber = (value) => new Intl.NumberFormat("vi-VN").format(Number(value || 0));
const formatMoney = (value) => `${formatNumber(value)}đ`;
const normalizeMoneyInput = (value) => String(value || "").replace(/[^\d]/g, "");
const formatMoneyInput = (value) => {
  const normalized = normalizeMoneyInput(value);
  return normalized ? formatNumber(normalized) : "";
};

const resolveProductImage = (image) => {
  const raw = String(image || "").trim();
  if (!raw) return `${UPLOAD_BASE}/pictures/no_image.jpg`;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  if (raw.startsWith("/uploads")) return `${API_BASE}${raw}`;

  const normalized = raw
    .replace(/^\/+/, "")
    .replace(/^uploads\/?assets\/?pictures\/?/i, "")
    .replace(/^pictures\/?/i, "");

  return `${UPLOAD_BASE}/pictures/${normalized}`;
};

const getProductsFromResponse = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.products)) return res.products;
  return [];
};

const initialSaleForm = {
  productId: "",
  salePrice: "",
  saleMode: "independent",
  saleEventId: "",
  programName: "",
  startDate: "",
  endDate: "",
};

const AdminFeaturedProductsPage = ({ type = "hot" }) => {
  const config = pageConfig[type] || pageConfig.hot;
  const Icon = config.icon;
  const navigate = useNavigate();
  const { request } = useHttp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [bestSellingProducts, setBestSellingProducts] = useState([]);
  const [saleEvents, setSaleEvents] = useState([]);
  const [saleFormOpen, setSaleFormOpen] = useState(false);
  const [hotFormOpen, setHotFormOpen] = useState(false);
  const [saleForm, setSaleForm] = useState(initialSaleForm);
  const [savingSale, setSavingSale] = useState(false);
  const [savingHot, setSavingHot] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [selectedHotProductIds, setSelectedHotProductIds] = useState([]);
  const productPickerRef = useRef(null);

  const loadFeaturedProducts = useCallback(() => {
    setLoading(true);
    setError("");

    return request("GET", `${API_BASE}${config.endpoint}`)
      .then((res) => {
        setProducts(getProductsFromResponse(res));
      })
      .catch((err) => {
        setError(err?.message || `Không thể tải ${config.title.toLowerCase()}.`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [config.endpoint, config.title, request]);

  useEffect(() => {
    let mounted = true;

    loadFeaturedProducts().finally(() => {
      if (!mounted) return;
    });

    return () => {
      mounted = false;
    };
  }, [loadFeaturedProducts]);

  useEffect(() => {
    if (type !== "sale" && type !== "hot") return;
    let mounted = true;

    const requests = [
      request("GET", `${API_BASE}/api/user/products/loadAllProducts`).catch(() => []),
    ];

    if (type === "sale") {
      requests.push(request("GET", `${API_BASE}/api/admin/sale-events`).catch(() => ({ data: [] })));
    }

    if (type === "hot") {
      requests.push(request("GET", `${API_BASE}/api/user/products/best-selling-products`).catch(() => []));
    }

    Promise.all(requests).then(([productRes, secondRes]) => {
      if (!mounted) return;
      setAllProducts(getProductsFromResponse(productRes));
      if (type === "sale") setSaleEvents(getProductsFromResponse(secondRes));
      if (type === "hot") setBestSellingProducts(getProductsFromResponse(secondRes));
    });

    return () => {
      mounted = false;
    };
  }, [request, type]);

  useEffect(() => {
    if (!productDropdownOpen) return undefined;

    const handlePointerDown = (event) => {
      if (productPickerRef.current?.contains(event.target)) return;
      setProductDropdownOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [productDropdownOpen]);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter((product) => {
      const haystack = [
        product.ProductID,
        product.ProductName,
        product.CategoryName,
        product.Brand,
        product.SubCategoryName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [products, search]);

  const stats = useMemo(() => {
    const saleProducts = products.filter((product) => Number(product.sale_price || 0) > 0);
    const totalStock = products.reduce((sum, product) => sum + Number(product.StockQuantity || 0), 0);
    const averageDiscount = saleProducts.length
      ? saleProducts.reduce((sum, product) => sum + Number(product.discountPercent || 0), 0) / saleProducts.length
      : 0;

    return {
      total: products.length,
      saleCount: saleProducts.length,
      totalStock,
      averageDiscount,
    };
  }, [products]);

  const openProductDetail = (productId) => {
    if (!productId) return;
    navigate(`/admin/product/detail/${encodeURIComponent(String(productId))}`);
  };

  const selectedProduct = useMemo(
    () => allProducts.find((product) => String(product.ProductID || product.id || "") === String(saleForm.productId || "")),
    [allProducts, saleForm.productId],
  );

  const selectedHotProductIdSet = useMemo(
    () => new Set(selectedHotProductIds.map((id) => String(id))),
    [selectedHotProductIds],
  );

  const selectedHotProducts = useMemo(() => {
    const productMap = new Map();
    allProducts.forEach((product) => {
      const productId = String(product.ProductID || product.id || "").trim();
      if (productId) productMap.set(productId, product);
    });
    bestSellingProducts.forEach((product) => {
      const productId = String(product.ProductID || product.id || "").trim();
      if (productId && !productMap.has(productId)) productMap.set(productId, product);
    });
    return selectedHotProductIds
      .map((productId) => productMap.get(String(productId)))
      .filter(Boolean);
  }, [allProducts, bestSellingProducts, selectedHotProductIds]);

  const productOptions = useMemo(() => {
    const activeProductIds = new Set(
      products
        .map((product) => String(product.ProductID || product.id || "").trim())
        .filter(Boolean),
    );
    const keyword = productSearch.trim().toLowerCase();
    const suggestionIds = new Set(bestSellingProducts.map((product) => String(product.ProductID || product.id || "").trim()));
    const productMap = new Map(allProducts.map((product) => [String(product.ProductID || product.id || "").trim(), product]));
    bestSellingProducts.forEach((product) => {
      const productId = String(product.ProductID || product.id || "").trim();
      if (productId && !productMap.has(productId)) productMap.set(productId, product);
    });
    const mergedProducts = Array.from(productMap.values());
    const availableProducts = mergedProducts.filter((product) => {
      const productId = String(product.ProductID || product.id || "").trim();
      if (!productId) return false;
      if (activeProductIds.has(productId)) return false;
      if (type === "sale") return Number(product.sale_price || 0) <= 0;
      return Number(product.isHot ?? product.IsHot ?? 0) !== 1;
    }).sort((a, b) => {
      const aSuggested = suggestionIds.has(String(a.ProductID || a.id || "").trim()) ? 1 : 0;
      const bSuggested = suggestionIds.has(String(b.ProductID || b.id || "").trim()) ? 1 : 0;
      if (aSuggested !== bSuggested) return bSuggested - aSuggested;
      return Number(b.SoldQuantity || 0) - Number(a.SoldQuantity || 0);
    });
    const source = keyword
      ? availableProducts.filter((product) => {
          const haystack = [
            product.ProductID,
            product.ProductName,
            product.CategoryName,
            product.Brand,
            product.SubCategoryName,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(keyword);
        })
      : availableProducts;

    return source.slice(0, 40);
  }, [allProducts, bestSellingProducts, productSearch, products, type]);

  const selectedEvent = useMemo(
    () => saleEvents.find((event) => String(event.id || "") === String(saleForm.saleEventId || "")),
    [saleEvents, saleForm.saleEventId],
  );

  const updateSaleForm = (field, value) => {
    setSaleForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "saleMode" && value === "event") {
        next.programName = "";
      }
      if (field === "saleEventId") {
        const event = saleEvents.find((item) => String(item.id || "") === String(value || ""));
        next.startDate = event?.start_date ? String(event.start_date).slice(0, 10) : "";
        next.endDate = event?.end_date ? String(event.end_date).slice(0, 10) : "";
      }
      return next;
    });
  };

  const selectSaleProduct = (product) => {
    const productId = product?.ProductID || product?.id || "";
    if (type === "hot") {
      setSelectedHotProductIds((prev) => {
        const normalizedProductId = String(productId);
        return prev.includes(normalizedProductId)
          ? prev.filter((id) => id !== normalizedProductId)
          : [...prev, normalizedProductId];
      });
      return;
    }
    updateSaleForm("productId", productId);
    setProductSearch(product?.ProductName || String(productId));
    setProductDropdownOpen(false);
  };

  const submitProductSale = async (event) => {
    event.preventDefault();
    setFormMessage("");

    const originalPrice = Number(selectedProduct?.Price || 0);
    const salePrice = Number(saleForm.salePrice || 0);

    if (!saleForm.productId) {
      setFormMessage("Vui lòng chọn sản phẩm.");
      return;
    }
    if (!salePrice || salePrice <= 0) {
      setFormMessage("Giá sale phải lớn hơn 0.");
      return;
    }
    if (originalPrice > 0 && salePrice >= originalPrice) {
      setFormMessage("Giá sale phải nhỏ hơn giá gốc.");
      return;
    }
    if (saleForm.saleMode === "event" && !saleForm.saleEventId) {
      setFormMessage("Vui lòng chọn sự kiện sale.");
      return;
    }

    setSavingSale(true);
    try {
      await request("POST", `${API_BASE}/api/admin/sale-events/product-sale`, {
        productId: saleForm.productId,
        salePrice,
        saleMode: saleForm.saleMode,
        saleEventId: saleForm.saleEventId || null,
        programName: saleForm.programName,
        startDate: saleForm.startDate || null,
        endDate: saleForm.endDate || null,
      });
      setSaleForm(initialSaleForm);
      setProductSearch("");
      setSaleFormOpen(false);
      await loadFeaturedProducts();
    } catch (err) {
      setFormMessage(err?.message || "Không thể thêm sản phẩm sale.");
    } finally {
      setSavingSale(false);
    }
  };

  const submitHotProduct = async (event) => {
    event.preventDefault();
    setFormMessage("");

    if (selectedHotProductIds.length === 0) {
      setFormMessage("Vui lòng chọn sản phẩm.");
      return;
    }

    setSavingHot(true);
    try {
      await request("PUT", `${API_BASE}/api/admin/products/updateProducts`, [
        ...selectedHotProductIds.map((productId) => ({
          ProductID: productId,
          IsHot: 1,
        })),
      ]);
      setSaleForm(initialSaleForm);
      setProductSearch("");
      setSelectedHotProductIds([]);
      setHotFormOpen(false);
      await loadFeaturedProducts();
    } catch (err) {
      setFormMessage(err?.message || "Không thể thêm sản phẩm hot.");
    } finally {
      setSavingHot(false);
    }
  };

  const removeFeaturedProduct = async (event, product) => {
    event.preventDefault();
    event.stopPropagation();

    const productId = product?.ProductID || product?.id;
    const productName = product?.ProductName || productId;

    const ok = window.confirm(
      type === "hot"
        ? `Xóa "${productName}" khỏi danh sách sản phẩm hot?`
        : `Xóa "${productName}" khỏi danh sách sản phẩm sale?`,
    );
    if (!ok) return;

    try {
      if (type === "hot") {
        await request("PUT", `${API_BASE}/api/admin/products/updateProducts`, [
          {
            ProductID: productId,
            IsHot: 0,
          },
        ]);
      } else {
        const productSaleId = product?.ProductSaleID || product?.productSaleId || product?.product_sale_id;
        if (!productSaleId) {
          throw new Error("Không tìm thấy mã dòng sale của sản phẩm.");
        }
        await request("DELETE", `${API_BASE}/api/admin/sale-events/product-sale/${encodeURIComponent(String(productSaleId))}`);
      }

      await loadFeaturedProducts();
    } catch (err) {
      window.alert(err?.message || "Không thể xóa sản phẩm.");
    }
  };

  const closeProductModal = () => {
    setSaleForm(initialSaleForm);
    setProductSearch("");
    setSelectedHotProductIds([]);
    setProductDropdownOpen(false);
    setFormMessage("");
    setSaleFormOpen(false);
    setHotFormOpen(false);
  };

  return (
    <main
      className="admin-featured-products-page"
      style={{ "--featured-accent": config.accent, "--featured-soft": config.soft }}
    >
      <section className="admin-featured-products-hero">
        <div>
          <span>{config.eyebrow}</span>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </div>
        <div className="admin-featured-products-hero__icon">
          <Icon />
        </div>
      </section>

      <section className="admin-featured-products-toolbar">
        <div className="admin-featured-products-search">
          <FaSearch />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo mã, tên, danh mục..."
          />
        </div>
        <div className="admin-featured-products-count">
          Hiển thị <strong>{formatNumber(filteredProducts.length)}</strong> / {formatNumber(products.length)}
        </div>
        {type === "sale" ? (
          <button type="button" className="admin-featured-products-add-btn" onClick={() => setSaleFormOpen(true)}>
            <FaPlus />
            Thêm sản phẩm sale
          </button>
        ) : null}
        {type === "hot" ? (
          <button type="button" className="admin-featured-products-add-btn" onClick={() => setHotFormOpen(true)}>
            <FaPlus />
            Thêm sản phẩm hot
          </button>
        ) : null}
      </section>

      <section className="admin-featured-products-stats">
        <article>
          <FaBoxOpen />
          <span>Tổng sản phẩm</span>
          <strong>{formatNumber(stats.total)}</strong>
        </article>
        <article>
          <FaTags />
          <span>Tồn kho</span>
          <strong>{formatNumber(stats.totalStock)}</strong>
        </article>
        <article>
          <FaPercent />
          <span>Đang có giá sale</span>
          <strong>{formatNumber(stats.saleCount)}</strong>
        </article>
        <article>
          <Icon />
          <span>Giảm trung bình</span>
          <strong>{stats.averageDiscount ? `${Math.round(stats.averageDiscount)}%` : "0%"}</strong>
        </article>
      </section>

      <section className="admin-featured-products-table-card">
        {loading ? (
          <div className="admin-featured-products-state">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="admin-featured-products-state is-error">{error}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="admin-featured-products-state">Không có sản phẩm phù hợp.</div>
        ) : (
          <div className="admin-featured-products-grid">
            {filteredProducts.map((product) => {
              const productId = product.ProductID || product.id;
              const salePrice = Number(product.sale_price || 0);
              const price = Number(product.Price || 0);
              const hasSale = salePrice > 0;
              const eventTitle = product.SaleEventTitle || product.ProgramName || "";

              return (
                <button
                  type="button"
                  className="admin-featured-product-card"
                  key={productId}
                  onClick={() => openProductDetail(productId)}
                >
                  <span
                    role="button"
                    tabIndex={0}
                    className="admin-featured-product-card__delete"
                    title={type === "hot" ? "Xóa khỏi sản phẩm hot" : "Xóa khỏi sản phẩm sale"}
                    aria-label={type === "hot" ? "Xóa khỏi sản phẩm hot" : "Xóa khỏi sản phẩm sale"}
                    onClick={(event) => removeFeaturedProduct(event, product)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        removeFeaturedProduct(event, product);
                      }
                    }}
                  >
                    <FaTrash />
                  </span>
                  <div className="admin-featured-product-card__image">
                    <img
                      src={resolveProductImage(product.Image)}
                      alt={product.ProductName || "Sản phẩm"}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src = `${UPLOAD_BASE}/pictures/no_image.jpg`;
                      }}
                    />
                    {type === "hot" ? <span className="hot-badge">Hot</span> : null}
                    {hasSale ? <span className="sale-badge">-{Number(product.discountPercent || 0)}%</span> : null}
                  </div>
                  <div className="admin-featured-product-card__body">
                    <span className="product-code">Mã: {productId}</span>
                    <h2 title={product.ProductName}>{product.ProductName || "Chưa có tên"}</h2>
                    <p>{product.CategoryName || product.SubCategoryName || "Chưa có danh mục"}</p>
                    <div className="admin-featured-product-card__price">
                      <strong>{formatMoney(hasSale ? salePrice : price)}</strong>
                      {hasSale ? <span>{formatMoney(price)}</span> : null}
                    </div>
                    <div className="admin-featured-product-card__meta">
                      <span>Tồn kho: {formatNumber(product.StockQuantity)}</span>
                      {product.end_date ? <span>Hết hạn: {new Date(product.end_date).toLocaleDateString("vi-VN")}</span> : null}
                    </div>
                    {eventTitle ? (
                      <div className="admin-featured-product-card__event" title={eventTitle}>
                        <span>Sự kiện</span>
                        <strong>{eventTitle}</strong>
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {(type === "sale" && saleFormOpen) || (type === "hot" && hotFormOpen) ? (
        <div className="admin-product-sale-modal" role="dialog" aria-modal="true">
          <form className="admin-product-sale-modal__content" onSubmit={type === "hot" ? submitHotProduct : submitProductSale}>
            <div className="admin-product-sale-modal__header">
              <div>
                <span>{type === "hot" ? "Thiết lập hot" : "Thiết lập sale"}</span>
                <h2>{type === "hot" ? "Chọn sản phẩm hot" : "Chọn sản phẩm để sale"}</h2>
              </div>
              <button type="button" onClick={closeProductModal} aria-label="Đóng">
                ×
              </button>
            </div>

            <div className={`admin-product-sale-form ${type === "hot" ? "admin-product-sale-form--hot" : ""}`}>
              <div className="admin-product-sale-picker" ref={productPickerRef}>
                <span>Sản phẩm</span>
                <div className="admin-product-sale-picker__control">
                  <FaSearch />
                  <input
                    type="text"
                    value={productSearch}
                    onFocus={() => setProductDropdownOpen(true)}
                    onChange={(event) => {
                      setProductSearch(event.target.value);
                      setProductDropdownOpen(true);
                      if (type === "sale") updateSaleForm("productId", "");
                    }}
                    placeholder={type === "hot" ? "Tìm sản phẩm bán chạy để đặt hot..." : "Tìm theo mã hoặc tên sản phẩm..."}
                  />
                </div>
                {type === "hot" && selectedHotProducts.length > 0 ? (
                  <div className="admin-product-sale-picker__selected-list">
                    {selectedHotProducts.map((product) => {
                      const productId = String(product.ProductID || product.id || "");
                      return (
                        <button type="button" key={productId} onClick={() => selectSaleProduct(product)}>
                          <img src={resolveProductImage(product.Image)} alt={product.ProductName || "Sản phẩm"} />
                          <span>{product.ProductName || productId}</span>
                          <strong>×</strong>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                {type === "sale" && selectedProduct ? (
                  <div className="admin-product-sale-picker__selected">
                    <img src={resolveProductImage(selectedProduct.Image)} alt={selectedProduct.ProductName || "Sản phẩm"} />
                    <div>
                      <strong>{selectedProduct.ProductName}</strong>
                      <span>Mã: {selectedProduct.ProductID || selectedProduct.id} - {formatMoney(selectedProduct.Price)}</span>
                    </div>
                  </div>
                ) : null}
                {productDropdownOpen ? (
                  <div className={`admin-product-sale-picker__dropdown ${type === "hot" ? "admin-product-sale-picker__dropdown--hot" : ""}`}>
                    {productOptions.length === 0 ? (
                      <div className="admin-product-sale-picker__empty">
                        {type === "hot" ? "Không có sản phẩm chưa hot phù hợp." : "Không có sản phẩm chưa sale phù hợp."}
                      </div>
                    ) : (
                      productOptions.map((product) => {
                        const productId = product.ProductID || product.id;
                        const isSelected = selectedHotProductIdSet.has(String(productId));
                        return (
                          <button
                            type="button"
                            key={productId}
                            className={isSelected ? "is-selected" : ""}
                            onClick={() => selectSaleProduct(product)}
                          >
                            <img src={resolveProductImage(product.Image)} alt={product.ProductName || "Sản phẩm"} loading="lazy" />
                            <div>
                              <strong>{product.ProductName || "Chưa có tên"}</strong>
                              <span>
                                Mã: {productId} - {formatMoney(product.Price)}
                                {Number(product.SoldQuantity || 0) > 0 ? ` - Đã bán: ${formatNumber(product.SoldQuantity)}` : ""}
                              </span>
                            </div>
                            {type === "hot" ? <em>{isSelected ? "Đã chọn" : "Chọn"}</em> : null}
                          </button>
                        );
                      })
                    )}
                  </div>
                ) : null}
              </div>

              {type === "sale" ? (
                <>
                  <label>
                    <span>Giá gốc</span>
                    <input value={selectedProduct ? formatMoney(selectedProduct.Price) : ""} readOnly placeholder="Chọn sản phẩm trước" />
                  </label>

                  <label>
                    <span>Giá sale</span>
                    <div className="admin-money-input">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatMoneyInput(saleForm.salePrice)}
                        onChange={(event) => updateSaleForm("salePrice", normalizeMoneyInput(event.target.value))}
                        placeholder="Nhập giá sale"
                      />
                      <span>đ</span>
                    </div>
                  </label>

                  <div className="admin-product-sale-mode">
                    <button
                      type="button"
                      className={saleForm.saleMode === "independent" ? "is-active" : ""}
                      onClick={() => updateSaleForm("saleMode", "independent")}
                    >
                      Sale độc lập
                    </button>
                    <button
                      type="button"
                      className={saleForm.saleMode === "event" ? "is-active" : ""}
                      onClick={() => updateSaleForm("saleMode", "event")}
                    >
                      Sale theo event
                    </button>
                  </div>

                  {saleForm.saleMode === "event" ? (
                    <label className="admin-product-sale-form__wide">
                      <span>Sự kiện</span>
                      <select value={saleForm.saleEventId} onChange={(event) => updateSaleForm("saleEventId", event.target.value)}>
                        <option value="">Chọn sự kiện</option>
                        {saleEvents.map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  <label>
                    <span>Ngày bắt đầu</span>
                    <input
                      type="date"
                      value={saleForm.startDate}
                      readOnly={saleForm.saleMode === "event"}
                      onChange={(event) => updateSaleForm("startDate", event.target.value)}
                    />
                  </label>

                  <label>
                    <span>Ngày kết thúc</span>
                    <input
                      type="date"
                      value={saleForm.endDate}
                      readOnly={saleForm.saleMode === "event"}
                      onChange={(event) => updateSaleForm("endDate", event.target.value)}
                    />
                  </label>

                  {saleForm.saleMode === "event" && selectedEvent ? (
                    <div className="admin-product-sale-event-note">
                      Sản phẩm sẽ dùng thời gian của event: <strong>{selectedEvent.title}</strong>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="admin-product-sale-event-note">
                  Danh sách gợi ý ưu tiên sản phẩm có số lượng bán ra lớn. Sản phẩm đã hot sẽ không hiện trong danh sách chọn.
                </div>
              )}
            </div>

            {formMessage ? <div className="admin-product-sale-message">{formMessage}</div> : null}

            <div className="admin-product-sale-modal__footer">
              <button type="button" onClick={closeProductModal}>
                Hủy
              </button>
              <button type="submit" disabled={type === "hot" ? savingHot : savingSale}>
                {type === "hot"
                  ? savingHot ? "Đang lưu..." : "Lưu sản phẩm hot"
                  : savingSale ? "Đang lưu..." : "Lưu sản phẩm sale"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
};

export default AdminFeaturedProductsPage;
