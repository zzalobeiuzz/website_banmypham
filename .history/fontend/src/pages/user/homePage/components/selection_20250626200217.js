mport PropTypes from "prop-types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import useHttp from "../../../../hooks/useHttp";
import "./componets.scss";

const Select = ({ title }) => {
  const icon_select =
    title === "Flash Sale"
      ? "/assets/images/hot_icon.svg"
      : title === "Sản phẩm hot"
      ? "/assets/images/hot_tag.svg"
      : null;

  const url =
    title === "Flash Sale"
      ? "http://localhost:5000/api/user/products/sale"
      : title === "Sản phẩm hot"
      ? "http://localhost:5000/api/user/products/hot"
      : null;

  const { request, loading, error } = useHttp();
  const [products, setProducts] = useState([]);

  // ✅ Gọi API khi url thay đổi
  useEffect(() => {
    const fetchProducts = async () => {
      if (!url) return;
      try {
        const data = await request("GET", url);
        setProducts(data);
      } catch (err) {
        console.error("❌ Lỗi khi tải sản phẩm:", err.message);
      }
    };

    fetchProducts();
  }, [url]);

  // ===================== ✅ Cập nhật dữ liệu sản phẩm khi nhận được data
  useEffect(() => {
    if (!data) return;

    const now = new Date();
    const updated = data.map((product) => {
      if (title === "Flash Sale") {
        const end = new Date(product.end_date);
        const diff = Math.max(0, end - now);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return {
          ...product,
          discountTimeLeft: `Còn ${days} ngày ${String(hours).padStart(
            2,
            "0"
          )} : ${String(minutes).padStart(2, "0")} : ${String(seconds).padStart(2, "0")}`,
        };
      }
      return product;
    });

    setProducts(updated);
  }, [data, title]);

  // ===================== ✅ Cập nhật countdown mỗi giây nếu là Flash Sale
  useEffect(() => {
    if (title !== "Flash Sale" || products.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      const updated = products.map((product) => {
        const end = new Date(product.end_date);
        const diff = Math.max(0, end - now);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return {
          ...product,
          discountTimeLeft: `Còn ${days} ngày ${String(hours).padStart(
            2,
            "0"
          )} : ${String(minutes).padStart(2, "0")} : ${String(seconds).padStart(2, "0")}`,
        };
      });

      setProducts(updated);
    }, 1000);

    return () => clearInterval(interval);
  }, [title, products]);

  // ===================== ✅ Biến kéo ngang slider
  const [translateX, setTranslateX] = useState(0);
  const [activeIndexes, setActiveIndexes] = useState([0, 1, 2, 3, 4]);
  const ITEM_WIDTH = 254;
  const VISIBLE_COUNT = 5;
  const startX = useRef(0);
  const endX = useRef(0);
  const currentTranslateX = useRef(0);
  const containerRef = useRef(null);
  const animationFrameId = useRef(null);
  const scrolledItemsCount = useRef(0);

  const handleMouseMove = useCallback(
    (e) => {
      if (e.buttons !== 1) return;
      const deltaX = e.clientX - startX.current;
      const maxTranslateX = -(
        products.length * ITEM_WIDTH - VISIBLE_COUNT * ITEM_WIDTH
      );
      const newTranslateX = Math.min(
        0,
        Math.max(currentTranslateX.current + deltaX, maxTranslateX)
      );
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = requestAnimationFrame(() => {
        setTranslateX(newTranslateX);
      });
    },
    [products]
  );

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
    const maxTranslateX = -(
      products.length * ITEM_WIDTH - VISIBLE_COUNT * ITEM_WIDTH
    );
    if (Math.abs(deltaX) < 30) {
      setTranslateX(currentTranslateX.current);
      return;
    }

    const direction = deltaX > 0 ? 1 : -1;
    if (
      (currentTranslateX.current === 0 && direction > 0) ||
      (currentTranslateX.current === maxTranslateX && direction < 0)
    )
      return;

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
      if (index < products.length) newActiveIndexes.push(index);
    }
    setActiveIndexes(newActiveIndexes);
  };

  // ===================== ✅ UI
  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  return (
    <div className="section-flash-mobile d-block slide-template bg-white mb-4 pt-1">
      <div className="slide-top">
        <div className="slide-title d-flex align-items-center gap-2">
          <a href="/" className="d-flex align-items-center gap-2">
            <img className="img-fluid" src={icon_select} alt="Hot Icon" />
            <h2>{title}</h2>
          </a>
        </div>
        <a href="/" className="slide-more">Xem tất cả</a>
      </div>

      <div className="slide-main">
        <div
          className="slide-template-slide"
          ref={containerRef}
          onMouseDown={handleMouseDown}
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
                  key={index}
                >
                  <a href="/a" className="product-template">
                    {product.sale_price && product.discountPercent > 0 && (
                      <div className="product-discount">
                        <span className="pe-1">{product.discountPercent}%</span>
                      </div>
                    )}
                    <img
                      src={`/assets/pictures/${product.Image}`}
                      alt={product.ProductName}
                      style={title === "Flash Sale" ? {} : { border: "none" }}
                    />
                    <div className="product-price px-2">
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
                    <div className="product-brand px-2">{product.SupplierID}</div>
                    <div className="product-title px-2">{product.ProductName}</div>
                    {title === "Flash Sale" && (
                      <div className="product-progress-sale count-down">
                        {product.discountTimeLeft}
                      </div>
                    )}
                  </a>
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
};

export default Select;
