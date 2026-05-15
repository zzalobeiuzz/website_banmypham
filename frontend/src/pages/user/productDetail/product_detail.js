import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../constants";
import useHttp from "../../../hooks/useHttp";
import lottie from "lottie-web";
import "./product_detail.scss";
import { useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";

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
  const location = useLocation();
  const from = location.state?.from;
  const { id } = useParams();
  const { request } = useHttp();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const loadingRef = useRef();
  const productImageRef = useRef(null);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [overflowingSections, setOverflowingSections] = useState({});
  const sectionRefs = useRef({});

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/user/products/detail/${encodeURIComponent(id)}`,
        );
        const productData = res?.data || null;
        console.log("Fetched product detail:", productData);
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

  // Check for overflowing content after product loads
  useEffect(() => {
    if (!product) return;

    // Use setTimeout to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      const newOverflowingState = {};
      productSections.forEach((section) => {
        const contentEl = sectionRefs.current[section.id];
        if (contentEl) {
          newOverflowingState[section.id] = contentEl.scrollHeight > 300;
        }
      });
      setOverflowingSections(newOverflowingState);
    }, 100);

    return () => clearTimeout(timer);
  }, [product]);

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const animateImageToCart = (sourceImage) => {
    if (!sourceImage) return;

    const cartIcon =
      document.querySelector(".shopping-cart-icon-wrap img") ||
      document.querySelector(".shopping-cart-icon-wrap");
    if (!cartIcon) return;

    const sourceRect = sourceImage.getBoundingClientRect();
    const targetRect = cartIcon.getBoundingClientRect();

    if (!sourceRect.width || !sourceRect.height) return;

    const clone = sourceImage.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.left = `${sourceRect.left}px`;
    clone.style.top = `${sourceRect.top}px`;
    clone.style.width = `${sourceRect.width}px`;
    clone.style.height = `${sourceRect.height}px`;
    clone.style.objectFit = "cover";
    clone.style.borderRadius = "12px";
    clone.style.zIndex = "9999";
    clone.style.pointerEvents = "none";
    clone.style.transition =
      "transform 650ms cubic-bezier(0.22, 1, 0.36, 1), opacity 650ms ease";
    clone.style.transformOrigin = "center center";

    document.body.appendChild(clone);

    const fromCenterX = sourceRect.left + sourceRect.width / 2;
    const fromCenterY = sourceRect.top + sourceRect.height / 2;
    const toCenterX = targetRect.left + targetRect.width / 2;
    const toCenterY = targetRect.top + targetRect.height / 2;
    const deltaX = toCenterX - fromCenterX;
    const deltaY = toCenterY - fromCenterY;

    window.requestAnimationFrame(() => {
      clone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.12)`;
      clone.style.opacity = "0.25";
    });

    const cleanup = () => {
      if (clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }
    };

    clone.addEventListener("transitionend", cleanup, { once: true });
    setTimeout(cleanup, 800);
  };

  const handleAddToCart = () => {
    if (!product?.ProductID) return;

    // Chặn trường hợp quantity > tồn kho
    if (quantity > product.StockQuantity) {
      window.alert("Số lượng vượt quá tồn kho.");
      return;
    }

    const added = addToCart(
      String(product.ProductID),
      quantity,
      product.StockQuantity,
    );

    if (!added) {
      window.alert(
        "Sản phẩm đã hết hàng hoặc không thể thêm vượt quá tồn kho.",
      );
      return;
    }

    // vẫn bay vào giỏ
    animateImageToCart(productImageRef.current);
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
        <button
          className="back-button"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/");
            }
          }}
        >
          ← Quay lại
        </button>
        <div className="not-found">Sản phẩm không tồn tại</div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <button
        className="back-button"
        onClick={() => {
          if (from) {
            navigate(from);
          } else if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate("/");
          }
        }}
      >
        ← Quay lại
      </button>

      <div className="product-detail-container">
        {/* Main Content */}

        <div className="product-detail-main">
          {/* LEFT */}
          <div className="product-detail-left">
            <div className="product-image-box">
              <img
                ref={productImageRef}
                src={imageUrl}
                alt={product.ProductName}
                className="product-image"
              />
            </div>

            <div className="product-thumbnail-list">
              <div className="thumb active">
                <img src={imageUrl} alt="" />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="product-detail-right">
            <div className="product-brand">
              {product.CategoryName || "DR.G"}
            </div>

            <h1 className="product-title">{product.ProductName}</h1>

            <div className="product-meta">
              <span>Mã sản phẩm: {product.ProductID}</span>

              <span
                className={
                  Number(product.StockQuantity) > 0 ? "in-stock" : "out-stock"
                }
              >
                <span className="dot">•Trạng thái: </span>
                {Number(product.StockQuantity) > 0 ? "Còn hàng" : "Hết hàng"}
              </span>
            </div>

            {/* PRICE */}
            <div className="price-card">
              {product.sale_price ? (
                <>
                  <div className="price-flex">
                    <span className="sale-price">
                      {Number(product.sale_price).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </>
              ) : (
                <div className="normal-price">
                  {Number(product.Price).toLocaleString("vi-VN")}đ
                </div>
              )}

              {product.sale_price && (
                <div className="origin-wrap">
                  <span className="original-price">
                    {Number(product.Price).toLocaleString("vi-VN")}đ
                  </span>

                  <div className="discount-percent">
                    -
                    {(
                      (1 - Number(product.sale_price) / Number(product.Price)) *
                      100
                    ).toFixed(0)}
                    %
                  </div>
                </div>
              )}
            </div>

            {/* FLASH SALE */}
            {product.sale_status === 1 && (
              <div className="flash-sale-box">
                <div className="flash-left">⚡ FLASH SALE</div>
                <div className="flash-right">Kết thúc sau 04:12:22</div>
              </div>
            )}

            {/* QUANTITY */}
            <div className="quantity-wrapper">
              <span>Số lượng</span>

              <div className="quantity-wrapper-block">
                <div className="qty-box">
                  <button
                    onClick={() => {
                      setQuantity((prev) => Math.max(1, prev - 1));
                    }}
                  >
                    -
                  </button>

                  <span>{quantity}</span>

                  <button
                    onClick={() => {
                      setQuantity((prev) =>
                        Math.min(product.StockQuantity, prev + 1),
                      );
                    }}
                  >
                    +
                  </button>
                </div>

                <div className="stock-text">
                  Còn <strong>{product.StockQuantity}</strong> sản phẩm
                </div>
              </div>
            </div>

            {/* BUTTON */}
            <div className="product-action-panel">
              <button
                type="button"
                className="add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={Number(product.StockQuantity || 0) <= 0}
              >
                {Number(product.StockQuantity || 0) <= 0
                  ? "Hết hàng"
                  : "🛒 Giỏ hàng"}
              </button>
            </div>

            {/* EXTRA */}
            <div className="extra-info-box">
              <div>
                <strong>Danh mục:</strong> {product.CategoryName}
              </div>

              <div>
                <strong>Phân loại:</strong> {product.SubCategoryName}
              </div>

              {selectedBatch && (
                <div>
                  <strong>HSD:</strong> {formatDate(selectedBatch.expiryDate)}
                </div>
              )}
            </div>
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
            <div
              key={section.id}
              id={section.id}
              className={`detail-section ${section.className}`}
            >
              <h2 className="section-title">{section.label}</h2>
              <div
                className={`content-wrapper ${overflowingSections[section.id] && !expandedSections[section.id] ? "with-fade" : ""}`}
              >
                <div
                  ref={(el) => {
                    if (el) sectionRefs.current[section.id] = el;
                  }}
                  className={`section-content ql-editor ${
                    expandedSections[section.id] ? "expanded" : ""
                  }`}
                >
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
                {overflowingSections[section.id] &&
                  !expandedSections[section.id] && (
                    <div className="fade-gradient" />
                  )}
              </div>
              {overflowingSections[section.id] && (
                <button
                  className="see-more-btn"
                  onClick={() => toggleSection(section.id)}
                >
                  {expandedSections[section.id] ? (
                    <>
                      <span>Ẩn bớt</span>
                      <svg
                        className="chevron-icon up"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Xem thêm</span>
                      <svg
                        className="chevron-icon"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
