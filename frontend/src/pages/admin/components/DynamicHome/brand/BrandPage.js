import React, { useEffect, useState } from "react";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import ToolBar from "../../ToolBar";
import "./style.scss";

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
  const { request } = useHttp();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="brand-page">
      <ToolBar title="Quản lý thương hiệu" />

      <div className="brand-page__body">
        {loading ? (
          <div className="brand-page__state">Đang tải thương hiệu...</div>
        ) : error ? (
          <div className="brand-page__state brand-page__state--error">{error}</div>
        ) : brands.length === 0 ? (
          <div className="brand-page__state">Không có thương hiệu nào.</div>
        ) : (
          <div className="brand-table-wrap">
            <table className="brand-table">
              <thead>
                <tr>
                  <th>ID Brand</th>
                  <th>Logo</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Logo URL</th>
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
                          <img className="brand-table__logo" src={logoUrl} alt={brand.idBrand || "brand"} loading="lazy" />
                        ) : (
                          <span className="brand-table__logo-empty">Không có logo</span>
                        )}
                      </td>
                      <td className="brand-table__description">{brand.description || "N/A"}</td>
                      <td>
                        <span className={`brand-status ${isActive ? "active" : "inactive"}`}>
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="brand-table__logo-url">{brand.logo_url || "N/A"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandPage;