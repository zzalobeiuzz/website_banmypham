import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import useFetchData from '../../../../hooks/useFetchData';
import '../style_home_page.scss';

const FlashSale = () => {
  const { data: fetchedProducts, loading, error } = useFetchData('http://localhost:5000/api/products');

  const [translateX, setTranslateX] = useState(0);
  const startX = useRef(0);
  const endX = useRef(0);
  const currentTranslateX = useRef(0);
  const containerRef = useRef(null);
  const animationFrameId = useRef(null);
  const scrolledItemsCount = useRef(0);

  const ITEM_WIDTH = 254;
  const VISIBLE_COUNT = 5;

  const [activeIndexes, setActiveIndexes] = useState([0, 1, 2, 3, 4]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (fetchedProducts) {
      setProducts(fetchedProducts);
    }
  }, [fetchedProducts]);

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

    containerRef.current.addEventListener('mousemove', handleMouseMove);
    containerRef.current.addEventListener('mouseup', handleMouseUp);
    containerRef.current.addEventListener('mouseleave', handleMouseUp);
  };

  const handleMouseUp = (e) => {
    endX.current = e.clientX;

    containerRef.current.removeEventListener('mousemove', handleMouseMove);
    containerRef.current.removeEventListener('mouseup', handleMouseUp);
    containerRef.current.removeEventListener('mouseleave', handleMouseUp);

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
      console.log('Đã đạt giới hạn, không lướt thêm được.');
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

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  return (
    <div className="section-flash-mobile d-block slide-template bg-white mb-4 pt-1">
      <div className="slide-top">
        <div className="slide-title d-flex align-items-center gap-2">
          <a href="/" className="d-flex align-items-center gap-2">
            <img className="img-fluid lazy entered loaded" src="/assets/images/hot_icon.svg" alt="Hot Icon" />
            <h2>Flash deal</h2>
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
                transition: '0.25s',
                width: `${products.length * ITEM_WIDTH}px`,
                display: 'flex',
              }}
            >
              {products.map((product, index) => (
                <div
                  className={`owl-item ${activeIndexes.includes(index) ? 'active' : ''}`}
                  style={{ width: `${ITEM_WIDTH}px`, flexShrink: 0 }}
                  key={index}
                >
                  <a href="/a" className="product-template">
                    <div className="product-discount"><span className="pe-1">10%</span></div>
                    <img src={`/assets/pictures/${product.Image}`} alt={product.ProductName} />
                    <div className="product-price px-2">
                      <div className="public-price">
                        {product.Price.toLocaleString('vi-VN')}đ
                      </div>
                      <div className="origin-price">asdf</div>
                    </div>
                    <div className="product-brand px-2">{product.SupplierID}</div>
                    <div className="product-title px-2">{product.ProductName}</div>
                    <div className="product-progress-sale count-down"></div>
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

FlashSale.propTypes = {
  products: PropTypes.array,
};

export default FlashSale;
