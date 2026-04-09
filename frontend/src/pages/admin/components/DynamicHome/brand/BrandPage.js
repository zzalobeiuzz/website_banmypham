import React, { useEffect, useState } from "react";
import "react-quill/dist/quill.snow.css";
import { useNavigate } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import Notification from "../../shared/Notification";
import useHttp from "../../../../../hooks/useHttp";
import ToolBar from "../../ToolBar";
import AdminLoadingScreen from "../../shared/AdminLoadingScreen";
import useMinimumLoading from "../../useMinimumLoading";
import BrandCreatePopup from "./BrandCreatePopup";
import BrandDetailPopup from "./BrandDetailPopup";
import "./style.scss";

const quillModules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "clean"],
  ],
};

const resolveBrandLogoUrl = (value) => {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  if (raw.startsWith("/uploads/")) return `${API_BASE}${raw}`;
  if (raw.startsWith("/")) return `${UPLOAD_BASE}${raw}`;
  return `${UPLOAD_BASE}/icons/${raw}`;
};

const BrandPage = () => {
  const navigate = useNavigate();
  const { request } = useHttp();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const showLoading = useMinimumLoading(loading, 500);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [notify, setNotify] = useState({
    visible: false,
    message: "",
    type: "success",
  });
  const [detailBrand, setDetailBrand] = useState(null);
  const [updatingDetail, setUpdatingDetail] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [createForm, setCreateForm] = useState({
    idBrand: "",
    Brand: "",
    description: "",
    status: "1",
    logo_url: "",
  });

  useEffect(() => {
    let mounted = true;

    const fetchBrands = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await request("GET", `${API_BASE}/api/admin/brand`);
        if (!mounted) return;
        setBrands(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || "Không thể tải danh sách thương hiệu.");
        setBrands([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchBrands();

    return () => {
      mounted = false;
    };
  }, [request]);

  useEffect(() => {
    const scrollContainer = document.querySelector(".dynamic-content");
    const scrollTarget = scrollContainer || window;

    const handleScroll = () => {
      const top = scrollContainer
        ? scrollContainer.scrollTop
        : window.scrollY || document.documentElement.scrollTop || 0;
      setShowScrollTop(top > 220);
    };

    scrollTarget.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      scrollTarget.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleBrandLogoFile = (file) => {
    if (!(file instanceof File)) return;
    if (!String(file.type || "").startsWith("image/")) {
      setError("Vui lòng chọn file ảnh hợp lệ.");
      return;
    }

    setLogoFile(file);
    setCreateForm((prev) => ({ ...prev, logo_url: "" }));
    setLogoPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleLogoDrop = (e) => {
    e.preventDefault();
    setIsDraggingLogo(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleBrandLogoFile(files[0]);
      return;
    }

    const droppedUrl =
      e.dataTransfer?.getData("text/uri-list") ||
      e.dataTransfer?.getData("text/plain") ||
      "";

    if (/^https?:\/\//i.test(String(droppedUrl).trim())) {
      setLogoFile(null);
      setCreateForm((prev) => ({
        ...prev,
        logo_url: String(droppedUrl).trim(),
      }));
      setLogoPreview(String(droppedUrl).trim());
      setError("");
    }
  };

  const showNotification = (message, type = "success") => {
    setNotify({
      visible: true,
      message,
      type,
    });
  };

  const closeNotification = () => {
    setNotify((prev) => ({ ...prev, visible: false }));
  };

  const openBrandDetail = (brand) => {
    setDetailBrand(brand || null);
  };

  const goToBrandProducts = (brand) => {
    const id = encodeURIComponent(brand?.idBrand || "");
    if (!id) return;
    navigate(`/admin/brand/${id}/products`);
  };

  const closeBrandDetail = () => {
    setDetailBrand(null);
  };

  const handleUpdateBrand = async (payload) => {
    try {
      setUpdatingDetail(true);

      const formData = new FormData();
      formData.append("idBrand", payload.idBrand);
      formData.append("Brand", payload.Brand || "");
      formData.append("description", payload.description || "");
      formData.append("status", payload.status || "1");
      formData.append("logo_url", payload.logo_url || "");

      if (payload.logoFile instanceof File) {
        formData.append("logoFile", payload.logoFile);
      }

      const res = await request(
        "PUT",
        `${API_BASE}/api/admin/brand/${encodeURIComponent(payload.idBrand)}`,
        formData,
      );

      const assignIds = Array.isArray(payload.assignProductIds)
        ? payload.assignProductIds
            .map((id) => String(id || "").trim())
            .filter(Boolean)
        : [];

      if (assignIds.length > 0) {
        const assignPayload = assignIds.map((productId) => ({
          ProductID: productId,
          SupplierID: String(payload.idBrand),
        }));

        await request(
          "PUT",
          `${API_BASE}/api/admin/products/updateProducts`,
          assignPayload,
        );
      }

      const updated = res?.data;
      if (updated) {
        setBrands((prev) =>
          prev.map((item) =>
            String(item.idBrand) === String(updated.idBrand) ? { ...item, ...updated } : item,
          ),
        );
        setDetailBrand(updated);
      }

      showNotification("Cập nhật thương hiệu thành công.", "success");
      return true;
    } catch (err) {
      showNotification(err?.message || "Không thể cập nhật thương hiệu.", "error");
      return false;
    } finally {
      setUpdatingDetail(false);
    }
  };

  const handleCreateFormChange = (key, value) => {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (creating) return;

    try {
      setCreating(true);
      setError("");

      const payload = {
        idBrand: createForm.idBrand,
        Brand: createForm.Brand,
        description: createForm.description,
        status: createForm.status,
      };

      const formData = new FormData();
      formData.append("idBrand", payload.idBrand);
      formData.append("Brand", payload.Brand);
      formData.append("description", payload.description || "");
      formData.append("status", payload.status || "1");
      formData.append("logo_url", createForm.logo_url || "");
      if (logoFile instanceof File) {
        formData.append("logoFile", logoFile);
      }

      const res = await request(
        "POST",
        `${API_BASE}/api/admin/brand`,
        formData,
      );
      const created = res?.data;

      if (created) {
        setBrands((prev) => [created, ...prev]);
      }

      showNotification("Tạo thương hiệu thành công.", "success");

      setCreateForm({
        idBrand: "",
        Brand: "",
        description: "",
        status: "1",
        logo_url: "",
      });
      setLogoFile(null);
      setLogoPreview("");
      setShowCreateForm(false);
    } catch (err) {
      showNotification(err?.message || "Không thể tạo thương hiệu.", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleScrollToTop = () => {
    const scrollContainer = document.querySelector(".dynamic-content");
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="brand-page">
      <ToolBar title="Quản lý thương hiệu" />

      {notify.visible && (
        <Notification
          message={notify.message}
          type={notify.type}
          onClose={closeNotification}
        />
      )}

      <BrandDetailPopup
        brand={detailBrand}
        onClose={closeBrandDetail}
        resolveBrandLogoUrl={resolveBrandLogoUrl}
        quillModules={quillModules}
        onSave={handleUpdateBrand}
        saving={updatingDetail}
        onViewAllProducts={(brand) => {
          const id = encodeURIComponent(brand?.idBrand || "");
          if (!id) return;
          closeBrandDetail();
          navigate(`/admin/brand/${id}/products`);
        }}
        onViewProductDetail={(product) => {
          const pid = encodeURIComponent(String(product?.ProductID || product?.id || "").trim());
          if (!pid) return;
          closeBrandDetail();
          navigate(`/admin/product/detail/${pid}`);
        }}
      />

      <div className="brand-page__body">
        <div className="brand-page__actions">
          <button
            type="button"
            className="brand-btn-create"
            onClick={() => setShowCreateForm((prev) => !prev)}
            aria-label={showCreateForm ? "Đóng form" : "Tạo mới thương hiệu"}
            title={showCreateForm ? "Đóng form" : "Tạo mới thương hiệu"}
          >
            {showCreateForm ? "✕" : "＋"}
          </button>
        </div>

        <BrandCreatePopup
          visible={showCreateForm}
          creating={creating}
          createForm={createForm}
          isDraggingLogo={isDraggingLogo}
          logoPreview={logoPreview}
          quillModules={quillModules}
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreateSubmit}
          onChangeForm={handleCreateFormChange}
          onLogoDragOver={(e) => {
            e.preventDefault();
            setIsDraggingLogo(true);
          }}
          onLogoDragLeave={(e) => {
            e.preventDefault();
            setIsDraggingLogo(false);
          }}
          onLogoDrop={handleLogoDrop}
          onLogoFileChange={handleBrandLogoFile}
        />

        {showLoading ? (
          <AdminLoadingScreen message="Đang tải thương hiệu..." />
        ) : error ? (
          <div className="brand-page__state brand-page__state--error">
            {error}
          </div>
        ) : brands.length === 0 ? (
          <div className="brand-page__state">Không có thương hiệu nào.</div>
        ) : (
          <div className="brand-table-wrap">
            <table className="brand-table">
              <thead>
                <tr>
                  <th>ID Brand</th>
                  <th>Logo</th>
                  <th>Brand</th>
                  <th>Status</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => {
                  const logoUrl = resolveBrandLogoUrl(brand.logo_url);
                  const isActive =
                    brand.status === 1 ||
                    brand.status === "1" ||
                    String(brand.status).toLowerCase() === "active" ||
                    String(brand.status).toLowerCase() === "true";

                  return (
                    <tr key={brand.idBrand}>
                      <td>{brand.idBrand ?? "N/A"}</td>
                      <td>
                        {logoUrl ? (
                          <img
                            className="brand-table__logo"
                            src={logoUrl}
                            alt={brand.idBrand || "brand"}
                            loading="lazy"
                          />
                        ) : (
                          <span className="brand-table__logo-empty">
                            Không có logo
                          </span>
                        )}
                      </td>
                      <td>{brand.Brand ?? brand.name ?? "N/A"}</td>
                      <td>
                        <span
                          className={`brand-status ${isActive ? "active" : "inactive"}`}
                        >
                          {isActive ? "Hoạt động" : "Không hoạt động"}
                        </span>
                      </td>
                      <td>
                        <div className="brand-table__actions">
                          <button
                            type="button"
                            className="brand-btn-detail"
                            onClick={() => openBrandDetail(brand)}
                          >
                            Xem chi tiết
                          </button>
                          <button
                            type="button"
                            className="brand-btn-products"
                            onClick={() => goToBrandProducts(brand)}
                            aria-label="Xem sản phẩm"
                            title="Xem sản phẩm"
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showScrollTop && (
        <button
          type="button"
          className="brand-scroll-top"
          onClick={handleScrollToTop}
          aria-label="Lên đầu trang"
          title="Lên đầu trang"
        >
          ↑
        </button>
      )}
    </div>
  );
};

export default BrandPage;
