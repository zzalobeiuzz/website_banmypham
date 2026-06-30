import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import { ROUTERS } from "../../../../utils/router";
import { useCart } from "../../context/CartContext";
import { flyToCart } from "./FlyToCart";
import "./componets.scss";

const ITEM_WIDTH = 254;
const VISIBLE_COUNT = 5;

export default function AllProductsSection({ onReady }) {
  const { request } = useHttp();
  const { addToCart: addProductToCart } = useCart();
  const [products, setProducts] = useState([]);
  
  const [lastAddedId, setLastAddedId] = useState(null);
  const [translateX, setTranslateX] = useState(0);
  const [activeIndexes, setActiveIndexes] = useState([0, 1, 2, 3, 4]);
  const containerRef = useRef(null);
  const autoScrollRef = useRef(null);
  const currentTranslateX = useRef(0);
  const isPausedRef = useRef(false);
  const scrolledItemsCount = useRef(0);

  useEffect(() => {
    let mounted = true;
    request("GET", `${API_BASE}/api/user/products/loadAllProducts`)
      .then((res) => {
        const next = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        if (!mounted) return;
        setProducts(next); // load tất cả sản phẩm, không giới hạn
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (mounted) onReady?.();
      });
    return () => { mounted = false; };
  }, [request, onReady]);

  // Tự động trượt giống các section flash sale/hot product.
  useEffect(() => {
    if (!products.length || products.length <= VISIBLE_COUNT) return undefined;

    const step = () => {
      if (!isPausedRef.current) {
        currentTranslateX.current -= 0.7;

        const limit = -(Math.max(products.length - VISIBLE_COUNT, 0) * ITEM_WIDTH);
        if (currentTranslateX.current <= limit) {
          currentTranslateX.current = 0;
          scrolledItemsCount.current = 0;
        }

        const startIndex = Math.min(
          Math.max(Math.abs(Math.round(currentTranslateX.current / ITEM_WIDTH)), 0),
          Math.max(products.length - VISIBLE_COUNT, 0),
        );
        const nextActive = Array.from({ length: Math.min(VISIBLE_COUNT, products.length) }, (_, index) => startIndex + index)
          .filter((index) => index < products.length);

        setTranslateX(currentTranslateX.current);
        setActiveIndexes(nextActive);
      }

      autoScrollRef.current = requestAnimationFrame(step);
    };

    autoScrollRef.current = requestAnimationFrame(step);
    return () => {
      if (autoScrollRef.current) cancelAnimationFrame(autoScrollRef.current);
    };
  }, [products]);

  const handleAddToCart = (product, e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    const productId = String(product?.ProductID || product?.id || "").trim();
    const stockQuantity = Number(product?.StockQuantity ?? product?.stockQuantity ?? 0);

    if (!productId) return;

    if (stockQuantity <= 0) {
      window.alert("Không thể thêm vào giỏ. Sản phẩm đã hết hàng.");
      return;
    }

    const added = addProductToCart(productId, 1, stockQuantity);
    if (!added) {
      window.alert(`Chỉ còn ${stockQuantity} sản phẩm trong kho.`);
      return;
    }

    const productImage = e?.currentTarget
      ?.closest(".product-template")
      ?.querySelector("img");

    if (productImage) {
      flyToCart(productImage);
    }

    setLastAddedId(productId);
    setTimeout(() => setLastAddedId(null), 1400);
  };

  return (
    <div className="section-flash-mobile all-products-section d-block slide-template bg-white mb-4 pt-1">
      <div className="slide-top">
        <div className="slide-title d-flex align-items-center gap-2">
          <h2>Tất cả sản phẩm</h2>
        </div>
        <Link to={`/${ROUTERS.USER.ALL_PRODUCTS.replace(":type", "all")}`} className="slide-more">Xem tất cả</Link>
      </div>

      <div className="slide-main">
        <div
          className="slide-template-slide"
          ref={containerRef}
          onMouseDown={() => { isPausedRef.current = true; }}
          onMouseUp={() => { isPausedRef.current = false; }}
          onMouseLeave={() => { isPausedRef.current = false; }}
          onDragStart={(e) => e.preventDefault()}
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
                  key={product.ProductID || product.id || index}
                >
                  <Link
                    to={`/${ROUTERS.USER.PRODUCT_DETAIL.replace(":id", String(product.ProductID || ""))}`}
                    className="product-template"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    <button
                      className="add-cart-plus-btn"
                      onClick={(e) => handleAddToCart(product, e)}
                      aria-label="Thêm vào giỏ hàng"
                    >
                      {lastAddedId && String(lastAddedId) === String(product.ProductID || product.id) ? '✓' : '+'}
                    </button>
                    <div className="product-image-wrap">
                      <img
                        src={product.Image ? `${UPLOAD_BASE}/pictures/${product.Image}` : ""}
                        alt={product.ProductName}
                        loading="lazy"
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                      />
                    </div>
                    <div className="product-meta">
                      <div className="product-price">
                        {product.sale_price ? (
                          <>
                            <div className="public-price">
                              {Number(product.sale_price).toLocaleString("vi-VN")}đ
                            </div>
                            <div className="origin-price">
                              {Number(product.Price || 0).toLocaleString("vi-VN")}đ
                            </div>
                          </>
                        ) : (
                          <div className="public-price">
                            {Number(product.Price || 0).toLocaleString("vi-VN")}đ
                          </div>
                        )}
                      </div>

                      <div
                        className={`product-stock ${
                          Number(product?.StockQuantity ?? product?.stockQuantity ?? 0) === 0
                            ? "is-out"
                            : "is-available"
                        }`}
                      >
                        {(() => {
                          const stock = Number(product?.StockQuantity ?? product?.stockQuantity ?? 0);
                          return stock === 0 ? "Hết hàng" : `Tồn kho: ${stock}`;
                        })()}
                      </div>
                    </div>

                    <div className="product-id px-2">
                      {`Mã: ${String(product?.ProductCode || product?.code || product?.product_code || product?.ProductID || "")}`}
                    </div>

                    <div className="product-title px-2">{product.ProductName}</div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
