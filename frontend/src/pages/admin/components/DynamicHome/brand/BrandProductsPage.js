import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import ToolBar from "../../ToolBar";
import Notification from "../../Notification";

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

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

const BrandProductsPage = () => {
  const { request } = useHttp();
  const navigate = useNavigate();
  const { idBrand } = useParams();

  const [brand, setBrand] = useState(null);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [searchCode, setSearchCode] = useState("");
  const [searchName, setSearchName] = useState("");
  const [savingAssign, setSavingAssign] = useState(false);
  const [notify, setNotify] = useState({ visible: false, message: "", type: "success" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [brandRes, productsRes] = await Promise.all([
          request("GET", `${API_BASE}/api/admin/brand`),
          request("GET", `${API_BASE}/api/user/products/loadAllProducts`),
        ]);

        if (!mounted) return;

        const brands = Array.isArray(brandRes?.data) ? brandRes.data : [];
        const allProducts = Array.isArray(productsRes?.data) ? productsRes.data : [];

        const matchedBrand = brands.find(
          (item) => normalize(item.idBrand) === normalize(idBrand),
        );

        const brandId = normalize(matchedBrand?.idBrand || idBrand);
        const brandName = normalize(matchedBrand?.Brand || matchedBrand?.name || "");

        const activeProducts = allProducts.filter((item) => isProductVisible(item));

        const filtered = activeProducts.filter((item) => {
          const supplier = normalize(item?.SupplierID || item?.supplierId || item?.Brand || item?.brand);
          return supplier && (supplier === brandId || supplier === brandName);
        });

        setBrand(matchedBrand || { idBrand, Brand: idBrand });
        setAllProducts(activeProducts);
        setProducts(filtered);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || "Không thể tải sản phẩm theo thương hiệu.");
        setProducts([]);
        setAllProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [idBrand, request]);

  const title = useMemo(() => {
    if (!brand) return "Thương hiệu";
    return `${brand.Brand || brand.name || brand.idBrand}`;
  }, [brand]);

  const brandIdValue = String(brand?.idBrand || idBrand || "").trim();
  const brandIdNormalized = normalize(brandIdValue);
  const brandNameNormalized = normalize(brand?.Brand || brand?.name || "");

  const suggestProducts = useMemo(
    () =>
      allProducts.filter((item) => {
        const productId = String(item?.ProductID || item?.id || "").trim();
        if (!productId) return false;

        const supplier = normalize(item?.SupplierID || item?.supplierId || item?.Brand || item?.brand);
        return !(supplier && (supplier === brandIdNormalized || supplier === brandNameNormalized));
      }),
    [allProducts, brandIdNormalized, brandNameNormalized],
  );

  const filteredSuggestProducts = useMemo(() => {
    const codeQuery = normalize(searchCode);
    const nameQuery = normalize(searchName);

    return suggestProducts.filter((item) => {
      const productId = normalize(item?.ProductID || item?.id);
      const barcode = normalize(item?.Barcode || item?.barcode);
      const productName = normalize(item?.ProductName || item?.name);

      const matchedCode = !codeQuery || productId.includes(codeQuery) || barcode.includes(codeQuery);
      const matchedName = !nameQuery || productName.includes(nameQuery);

      return matchedCode && matchedName;
    });
  }, [searchCode, searchName, suggestProducts]);

  const closeNotification = () => {
    setNotify((prev) => ({ ...prev, visible: false }));
  };

  const toggleProduct = (productId) => {
    const normalized = String(productId || "").trim();
    if (!normalized) return;

    setSelectedProductIds((prev) =>
      prev.includes(normalized)
        ? prev.filter((id) => id !== normalized)
        : [...prev, normalized],
    );
  };

  const assignSelectedProducts = async () => {
    if (selectedProductIds.length === 0 || !brandIdValue) return;

    try {
      setSavingAssign(true);

      const payload = selectedProductIds.map((productId) => ({
        ProductID: productId,
        SupplierID: brandIdValue,
      }));

      await request("PUT", `${API_BASE}/api/admin/products/updateProducts`, payload);

      setAllProducts((prev) =>
        prev.map((item) => {
          const pid = String(item?.ProductID || item?.id || "").trim();
          if (!selectedProductIds.includes(pid)) return item;
          return {
            ...item,
            SupplierID: brandIdValue,
          };
        }),
      );

      setProducts((prev) => {
        const merged = [...prev];
        selectedProductIds.forEach((id) => {
          const fromAll = allProducts.find(
            (item) => String(item?.ProductID || item?.id || "").trim() === id,
          );
          if (!fromAll) return;
          if (!merged.some((p) => String(p?.ProductID || p?.id || "").trim() === id)) {
            merged.push({ ...fromAll, SupplierID: brandIdValue });
          }
        });
        return merged;
      });

      setNotify({
        visible: true,
        message: "Đã thêm sản phẩm vào thương hiệu thành công.",
        type: "success",
      });

      setSelectedProductIds([]);
      setSearchCode("");
      setSearchName("");
      setShowPicker(false);
    } catch (err) {
      setNotify({
        visible: true,
        message: err?.message || "Không thể thêm sản phẩm vào thương hiệu.",
        type: "error",
      });
    } finally {
      setSavingAssign(false);
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

  const openProductDetail = (item) => {
    const pid = encodeURIComponent(String(item?.ProductID || item?.id || "").trim());
    if (!pid) return;
    navigate(`/admin/product/detail/${pid}`);
  };

  return (
    <div className="brand-page">
      <ToolBar title={title} />

      {notify.visible && (
        <Notification
          message={notify.message}
          type={notify.type}
          onClose={closeNotification}
        />
      )}

      <div className="brand-page__body">
        <div className="brand-page__actions brand-page__actions--split">
          <div className="brand-page__actions-left">
            <button
              type="button"
              className="brand-btn-back-icon"
              onClick={() => navigate(-1)}
              aria-label="Quay lại"
              title="Quay lại"
            >
              ← Quay lại
            </button>
          </div>

          <div className="brand-page__actions-right">
            <button
              type="button"
              className="brand-btn-products"
              onClick={() => setShowPicker((prev) => !prev)}
              aria-label={showPicker ? "Ẩn chọn sản phẩm" : "Chọn sản phẩm thêm vào thương hiệu"}
              title={showPicker ? "Ẩn chọn sản phẩm" : "Chọn sản phẩm thêm vào thương hiệu"}
            >
              +
            </button>
            {showPicker && (
              <button
                type="button"
                className="brand-btn-submit"
                disabled={savingAssign || selectedProductIds.length === 0}
                onClick={assignSelectedProducts}
              >
                {savingAssign ? "Đang thêm..." : `Thêm ${selectedProductIds.length} sản phẩm`}
              </button>
            )}
          </div>
        </div>

        {showPicker && (
          <div className="brand-suggest-products">
            <div className="brand-suggest-products__hint">
              Chọn sản phẩm để gán vào thương hiệu {brand?.Brand || brand?.name || brandIdValue}.
            </div>

            <div className="brand-suggest-products__filters">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Tìm theo ID/Barcode"
              />
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
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
                      <td colSpan={5}>Không còn sản phẩm phù hợp để thêm.</td>
                    </tr>
                  ) : (
                    filteredSuggestProducts.map((item) => {
                      const pid = String(item?.ProductID || item?.id || "").trim();
                      return (
                        <tr key={pid || item?.ProductName}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedProductIds.includes(pid)}
                              onChange={() => toggleProduct(pid)}
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
          </div>
        )}

        {loading ? (
          <div className="brand-page__state">Đang tải sản phẩm...</div>
        ) : error ? (
          <div className="brand-page__state brand-page__state--error">{error}</div>
        ) : products.length === 0 ? (
          <div className="brand-page__state">Không có sản phẩm thuộc thương hiệu này.</div>
        ) : (
          <div className="brand-related-products__grid brand-related-products__grid--page">
            {products.map((item) => (
              <button
                type="button"
                className="brand-related-product-card brand-related-product-card--clickable"
                key={item.ProductID || item.id || item.ProductName}
                onClick={() => openProductDetail(item)}
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
                  <div className="brand-related-product-card__name">{item.ProductName || "Sản phẩm"}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandProductsPage;
