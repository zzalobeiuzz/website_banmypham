import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../constants";
import useHttp from "../../../hooks/useHttp";
import lottie from "lottie-web";
import "./product_detail.scss";

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

const ProductDetail = () => {
  const { id } = useParams();
  const { request } = useHttp();
  const navigate = useNavigate();
  const loadingRef = useRef();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/user/products/detail/${encodeURIComponent(id)}`
        );
        const productData = res?.data || null;
        setProduct(productData);
      } catch (err) {
        console.error("❌ Không lấy được chi tiết sản phẩm:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, request]);

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

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const imageUrl = !product?.Image?.startsWith("http")
    ? UPLOAD_BASE + "/pictures/" + (product?.Image || "default.jpg")
    : product?.Image;

  const batchDetails = product?.batchDetails || [];
  const selectedBatch = batchDetails[0] || null;

  const formatDate = (value) => {
    if (!value) return "Không có";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Không có";
    return date.toLocaleDateString("vi-VN");
  };

  if (loading) {
    return (
      <div className="product-detail-loading-container">
        <div ref={loadingRef} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-container">
        <button className="back-button" onClick={() => navigate("/")}>
          ← Quay lại
        </button>
        <div className="not-found">Sản phẩm không tồn tại</div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <button className="back-button" onClick={() => navigate("/")}>
        ← Quay lại
      </button>

      <div className="product-detail-container">
        {/* Main Content */}
        <div className="product-detail-main">
          {/* Left Side - Image */}
          <div className="product-detail-image-section">
            <img src={imageUrl} alt={product.ProductName} className="product-image" />
          </div>

          {/* Right Side - Info */}
          <div className="product-detail-info-section">
            <h1 className="product-title">{product.ProductName}</h1>

            <div className="product-supplier">
              <span className="label">Nhà cung cấp:</span>
              <span className="value">{product.SupplierID || "N/A"}</span>
            </div>

            <div className="product-prices">
              {product.sale_price ? (
                <>
                  <div className="price-row">
                    <span className="pricing-label">Giá bán:</span>
                    <span className="sale-price">
                      {product.sale_price.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div className="price-row">
                    <span className="pricing-label">Giá gốc:</span>
                    <span className="original-price">
                      {product.Price.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div className="discount-badge">
                    Tiết kiệm: {((1 - product.sale_price / product.Price) * 100).toFixed(0)}%
                  </div>
                </>
              ) : (
                <div className="price-row">
                  <span className="pricing-label">Giá:</span>
                  <span className="sale-price">{product.Price.toLocaleString("vi-VN")}đ</span>
                </div>
              )}
            </div>

            <div className="product-stock">
              <span className="label">Tồn kho:</span>
              <span className={`stock-value ${product.StockQuantity > 0 ? "in-stock" : "out-stock"}`}>
                {product.StockQuantity > 0 ? `${product.StockQuantity} sản phẩm` : "Hết hàng"}
              </span>
            </div>

            {selectedBatch && (
              <div className="product-batch-info">
                <span className="label">Lô hàng:</span>
                <span className="value">{selectedBatch.batchId || "N/A"}</span>
                <span className="label">Hạn sử dụng:</span>
                <span className="value">{formatDate(selectedBatch.expiryDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="product-navigation">
          {productSections.map((section) => (
            <button
              key={section.id}
              className="nav-link"
              onClick={() => scrollToSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Detailed Sections */}
        <div className="product-detail-sections">
          {productSections.map((section) => (
            <div key={section.id} id={section.id} className={`detail-section ${section.className}`}>
              <h2 className="section-title">{section.label}</h2>
              <div className="section-content ql-editor">
                {product[section.field] ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: product[section.field],
                    }}
                  />
                ) : (
                  <p className="no-content">Không có thông tin</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
