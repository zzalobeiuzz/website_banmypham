
 

import PropTypes from "prop-types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import { ROUTERS } from "../../../../utils/router";
import "./componets.scss";



// 🧱 Layout slider
const ITEM_WIDTH = 254;
const VISIBLE_COUNT = 5;
const CART_STORAGE_KEY = "cartItems";

const getCartItemsFromStorage = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const saveCartItemsToStorage = (items) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
};

const resolveBrandLogoSrc = (logoUrl) => {
  const raw = String(logoUrl || "").trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;

  if (raw.startsWith("/uploads/")) {
    return `${API_BASE}${raw}`;
  }

  if (raw.startsWith("uploads/")) {
    return `${API_BASE}/${raw}`;
  }

  if (raw.startsWith("icons/")) {
    return `${UPLOAD_BASE}/${raw}`;
  }

  return `${UPLOAD_BASE}/${raw.replace(/^\/+/, "")}`;
};

const resolveBrandPreviewSrc = (image) => {
  const raw = String(image || "").trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;

  if (raw.startsWith("/uploads/")) {
    return `${API_BASE}${raw}`;
  }

  if (raw.startsWith("uploads/")) {
    return `${API_BASE}/${raw}`;
  }

  return `${UPLOAD_BASE}/pictures/${raw.replace(/^\/+/, "")}`;
};

// ✨ Bay ảnh vào giỏ
const animateImageToCart = (sourceImage) => {
  if (!sourceImage) return;

  const cartIcon = document.querySelector(".shopping-cart-icon-wrap img")
    || document.querySelector(".shopping-cart-icon-wrap");
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
  clone.style.borderRadius = "8px";
  clone.style.zIndex = "9999";
  clone.style.pointerEvents = "none";
  clone.style.transition = "transform 650ms cubic-bezier(0.22, 1, 0.36, 1), opacity 650ms ease";
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

const Select = ({ title, onReady }) => {


  

   
  const { request, loading, error } = useHttp();
  const isTopBrandSection = title === "Thương hiệu nổi bật";

  // 🗂️ State
  const [products, setProducts] = useState([]);
  const [translateX, setTranslateX] = useState(0);
  const [activeIndexes, setActiveIndexes] = useState([0, 1, 2, 3, 4]);

  // 📍 Refs
  const startX = useRef(0);
  const endX = useRef(0);
  const currentTranslateX = useRef(0);
  const containerRef = useRef(null);
  const animationFrameId = useRef(null);
  const scrolledItemsCount = useRef(0);

  // 🎨 Icon tiêu đề

  let icon_select = null;
  if (title === "Flash Sale") {
    icon_select = `${UPLOAD_BASE}/images/hot_icon.svg`;
  } else if (title === "Sản phẩm hot") {
    icon_select = `${UPLOAD_BASE}/images/hot_tag.svg`;
  }


  // 🔄 Load dữ liệu
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const INITIAL_DELAY = 1000;

    const fetchProducts = async () => {
      let url = null;
      if (title === "Flash Sale") {
        url = `${API_BASE}/api/user/products/sale`;
      } else if (title === "Sản phẩm hot") {
        url = `${API_BASE}/api/user/products/hot`;
      } else if (isTopBrandSection) {
        url = `${API_BASE}/api/user/products/featured-brands`;
      }

      if (!url) {
        onReady?.();
        return;
      }

      const attemptFetch = async (attempt = 0) => {
        try {
          const data = await request("GET", url);

          if (!isMounted) return;

          if (title === "Flash Sale") {
            const now = new Date();
            const updated = data.map((product) => {
              const end = new Date(product.end_date);
              const diff = Math.max(0, end - now);
              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
              const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              const seconds = Math.floor((diff % (1000 * 60)) / 1000);

              const formatted = `Còn ${days} ngày ${String(hours).padStart(2, "0")} : ${String(minutes).padStart(2, "0")} : ${String(seconds).padStart(2, "0")}`;

              return { ...product, discountTimeLeft: formatted };
            });
            setProducts(updated);
          } else {
            setProducts(data);
          }
          onReady?.();
        } catch (err) {
          if (!isMounted) return;

          retryCount = attempt + 1;

          if (retryCount < MAX_RETRIES) {
            const delayMs = INITIAL_DELAY * Math.pow(2, attempt);
            console.warn(`⚠️ Lỗi lấy ${title} (lần ${retryCount}/${MAX_RETRIES}), thử lại trong ${delayMs}ms...`, err.message);
            setTimeout(() => {
              if (isMounted) {
                attemptFetch(attempt + 1);
              }
            }, delayMs);
          } else {
            console.error(`❌ Lỗi lấy ${title} sau ${MAX_RETRIES} lần thử:`, err.message);
            onReady?.();
          }
        }
      };

      setTimeout(() => {
        if (isMounted) {
          attemptFetch(0);
        }
      }, INITIAL_DELAY);
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [title, request, isTopBrandSection, onReady]);

  // ⏱️ Countdown flash sale
  useEffect(() => {
    if (title !== "Flash Sale" || products.length === 0) return;

    const updateCountdown = () => {
      const now = new Date();
      const updated = products.map((product) => {
        const end = new Date(product.end_date);
        const diff = Math.max(0, end - now);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const formatted = `Còn ${days} ngày ${String(hours).padStart(2, "0")} : ${String(minutes).padStart(2, "0")} : ${String(seconds).padStart(2, "0")}`;

        return { ...product, discountTimeLeft: formatted };
      });

      setProducts(updated);
    };

    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [products, title]);

  // ↔️ Auto slide
  useEffect(() => {
    if (!products.length || products.length <= VISIBLE_COUNT) return;
    let autoSlideTimer = null;
    let paused = false;

    const startAutoSlide = () => {
      if (autoSlideTimer) clearInterval(autoSlideTimer);
      autoSlideTimer = setInterval(() => {
        if (paused) return;
        scrolledItemsCount.current++;
        if (scrolledItemsCount.current > products.length - VISIBLE_COUNT) {
          scrolledItemsCount.current = 0;
        }
        const finalTranslateX = -scrolledItemsCount.current * ITEM_WIDTH;
        setTranslateX(finalTranslateX);
        currentTranslateX.current = finalTranslateX;
        const newActiveIndexes = [];
        for (let i = 0; i < VISIBLE_COUNT; i++) {
          const idx = scrolledItemsCount.current + i;
          if (idx < products.length) newActiveIndexes.push(idx);
        }
        setActiveIndexes(newActiveIndexes);
      }, 3000);
    };

    startAutoSlide();

    const pauseAutoSlide = () => { paused = true; };
    const resumeAutoSlide = () => { paused = false; };
    const slider = containerRef.current;
    if (slider) {
      slider.addEventListener("mousedown", pauseAutoSlide);
      slider.addEventListener("touchstart", pauseAutoSlide);
      slider.addEventListener("mouseup", resumeAutoSlide);
      slider.addEventListener("touchend", resumeAutoSlide);
      slider.addEventListener("mouseleave", resumeAutoSlide);
    }

    return () => {
      if (autoSlideTimer) clearInterval(autoSlideTimer);
      if (slider) {
        slider.removeEventListener("mousedown", pauseAutoSlide);
        slider.removeEventListener("touchstart", pauseAutoSlide);
        slider.removeEventListener("mouseup", resumeAutoSlide);
        slider.removeEventListener("touchend", resumeAutoSlide);
        slider.removeEventListener("mouseleave", resumeAutoSlide);
      }
    };
  }, [products]);

  // 🖱️ Kéo ngang
  const handleMouseMove = useCallback((e) => {
    if (e.buttons !== 1) return;
    const deltaX = e.clientX - startX.current;
    const maxTranslateX = -(products.length * ITEM_WIDTH - VISIBLE_COUNT * ITEM_WIDTH);
    const newTranslateX = Math.min(0, Math.max(currentTranslateX.current + deltaX, maxTranslateX));

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    animationFrameId.current = requestAnimationFrame(() => {
      setTranslateX(newTranslateX);
    });
  }, [products]);

  const handleMouseDown = (e) => {
    startX.current = e.clientX;
    currentTranslateX.current = translateX;

    containerRef.current.addEventListener("mousemove", handleMouseMove);
    containerRef.current.addEventListener("mouseup", handleMouseUp);
    containerRef.current.addEventListener("mouseleave", handleMouseUp);
  };

  const handleMouseUp = (e) => {
    endX.current = e.clientX;

    containerRef.current.removeEventListener("mousemove", handleMouseMove);
    containerRef.current.removeEventListener("mouseup", handleMouseUp);
    containerRef.current.removeEventListener("mouseleave", handleMouseUp);

    const deltaX = endX.current - startX.current;
    const maxTranslateX = -(products.length * ITEM_WIDTH - VISIBLE_COUNT * ITEM_WIDTH);

    if (Math.abs(deltaX) < 30) {
      setTranslateX(currentTranslateX.current);
      return;
    }

    const direction = deltaX > 0 ? 1 : -1;

    if (
      (currentTranslateX.current === 0 && direction > 0) ||
      (currentTranslateX.current === maxTranslateX && direction < 0)
    ) {
      return;
    }

    const itemsScrollable = Math.min(
      Math.floor((Math.abs(deltaX) - 70) / ITEM_WIDTH) + 1,
      Math.max(products.length - VISIBLE_COUNT, 0)
    );

    scrolledItemsCount.current += direction * itemsScrollable;
    scrolledItemsCount.current = Math.max(
      Math.min(scrolledItemsCount.current, products.length - VISIBLE_COUNT),
      0
    );

    const finalTranslateX = -scrolledItemsCount.current * ITEM_WIDTH;
    setTranslateX(finalTranslateX);
    currentTranslateX.current = finalTranslateX;

    const newActiveIndexes = [];
    for (let i = 0; i < VISIBLE_COUNT; i++) {
      const index = scrolledItemsCount.current + i;
      if (index < products.length) {
        newActiveIndexes.push(index);
      }
    }

    setActiveIndexes(newActiveIndexes);
  };

  const handleAddToCart = (event, product) => {
    event.preventDefault();
    event.stopPropagation();

    const productId = String(product?.ProductID || "").trim();
    if (!productId) return;

    // 📦 Kiểm tra tồn kho trước khi cho thêm vào giỏ
    const stockQuantity = Number(product?.StockQuantity || 0);
    if (stockQuantity <= 0) {
      window.alert("Sản phẩm đã hết hàng.");
      return;
    }

    const cartItems = getCartItemsFromStorage();
    const foundIndex = cartItems.findIndex((item) => String(item?.productId) === productId);
    const currentQty = foundIndex >= 0 ? Number(cartItems[foundIndex].quantity || 0) : 0;
    const nextQty = currentQty + 1;

    if (nextQty > stockQuantity) {
      window.alert(stockQuantity <= 0 ? "Sản phẩm đã hết hàng." : `Không thể thêm vào giỏ. Sản phẩm đã hết hàng`);
      return;
    }

    if (foundIndex >= 0) {
      cartItems[foundIndex] = {
        ...cartItems[foundIndex],
        quantity: nextQty,
      };
    } else {
      cartItems.push({
        productId,
        quantity: 1,
      });
    }

    // ✨ Chỉ chạy hiệu ứng khi thêm thành công (không vượt quá stock)
    const productCard = event.currentTarget.closest(".product-template");
    const productImage = productCard?.querySelector("img");
    animateImageToCart(productImage);

    saveCartItemsToStorage(cartItems);
  };

  // 🖼️ Render
  if (loading) return <div className="loading">🔄 Đang tải sản phẩm...</div>;
  if (error) return <div className="error">❌ Lỗi: {error}</div>;

  // Xác định type cho route all-products
  let allProductsType = "flash-sale";
  if (title === "Sản phẩm hot") allProductsType = "hot-products";
  else if (title === "Thương hiệu nổi bật") allProductsType = "featured-brands";

  return (
    <div className="section-flash-mobile d-block slide-template bg-white mb-4 pt-1">
      <div className="slide-top">
        <div className="slide-title d-flex align-items-center gap-2">
          <a href="/" className="d-flex align-items-center gap-2">
            {title !== "Thương hiệu nổi bật" && <img className="img-fluid" src={icon_select} alt="Icon sản phẩm" loading="lazy" />}
            <h2>{title}</h2>
          </a>
        </div>
        <Link to={`/all-products/${allProductsType}`} className="slide-more">Xem tất cả</Link>
      </div>

      <div className="slide-main">
        <div
          className="slide-template-slide"
          ref={containerRef}
          onMouseDown={handleMouseDown}

          onDragStart={e => e.preventDefault()}
        >
          <div className="owl-stage-outer">
            <div
              className="owl-stage"
              style={{
                transform: `translate3d(${translateX}px, 0, 0)`,
                transition: "0.25s",
                width: `${products.length * ITEM_WIDTH}px`,
                display: "flex",
              }}
            >
              {products.map((product, index) => (
                <div
                  className={`owl-item ${activeIndexes.includes(index) ? "active" : ""}`}
                  style={{ width: `${ITEM_WIDTH}px`, flexShrink: 0 }}
                  key={product?.ProductID || product?.idBrand || index}
                >
                  <Link
                    to={
                      isTopBrandSection
                        ? `/${ROUTERS.USER.BRAND_DETAIL.replace(":idBrand", String(product.idBrand || "")).replace(/^\/+/, "")}`
                        : `/${ROUTERS.USER.PRODUCT_DETAIL.replace(":id", String(product.ProductID || ""))}`
                    }
                    className={`product-template ${isTopBrandSection ? "brand-only-template" : ""}`}
                    draggable={false}
                    onDragStart={e => e.preventDefault()}
                  >
                    {!isTopBrandSection && (
                      <button
                        type="button"
                        className="add-cart-plus-btn"
                        onClick={(event) => handleAddToCart(event, product)}
                        title="Thêm vào giỏ hàng"
                        aria-label="Thêm vào giỏ hàng"
                      >
                        +
                      </button>
                    )}

                    {!isTopBrandSection && product.sale_price && product.discountPercent > 0 && (
                      <div className="product-discount">
                        <span className="pe-1">{product.discountPercent}%</span>
                      </div>
                    )}

                    {isTopBrandSection ? (
                      <div className="brand-only-wrap">
                        <img
                          src={resolveBrandPreviewSrc(product.previewImage) || resolveBrandLogoSrc(product.logoUrl)}
                          alt={product.brandName || "Thương hiệu"}
                          loading="lazy"
                          className="brand-only-image"
                          draggable={false}
                          onDragStart={e => e.preventDefault()}
                        />
                        <div className="brand-name-pill">{product.brandName || "Thương hiệu"}</div>
                      </div>
                    ) : (
                      <>
                        <div className="product-image-wrap">
                          <img
                            src={`${UPLOAD_BASE}/pictures/${product.Image}`}
                            alt={`Hình ảnh của ${product.ProductName}`}
                            loading="lazy"
                            style={title !== "Flash Sale" ? { border: "none" } : {}}
                            draggable={false}
                            onDragStart={e => e.preventDefault()}
                          />
                        </div>

                        <div className="product-meta">
                          <div className="product-price">
                            {product.sale_price ? (
                              <>
                                <div className="public-price">
                                  {product.sale_price.toLocaleString("vi-VN")}đ
                                </div>
                                <div className="origin-price">
                                  {product.Price.toLocaleString("vi-VN")}đ
                                </div>
                              </>
                            ) : (
                              <div className="public-price">
                                {product.Price.toLocaleString("vi-VN")}đ
                              </div>
                            )}
                          </div>

                          <div className="product-stock">
                            {(() => {
                              const stock = Number(product?.StockQuantity ?? product?.stockQuantity ?? 0);
                              return (
                                <span style={{ fontSize: "12px", color: stock === 0 ? "#c73030" : "#0f766e" }}>
                                  {stock === 0 ? "Hết hàng" : `Tồn kho: ${stock}`}
                                </span>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="product-id px-2">{` ID: ${product.ProductID}`}</div>
                        <div className="product-title px-2">{product.ProductName}</div>

                        {title === "Flash Sale" && (
                          <div className="product-progress-sale count-down px-2">
                            {product.discountTimeLeft}
                          </div>
                        )}

                      </>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Select.propTypes = {
  title: PropTypes.string.isRequired,
  onReady: PropTypes.func,
};

export default Select;
