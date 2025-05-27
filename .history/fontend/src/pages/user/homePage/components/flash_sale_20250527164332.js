import PropTypes from 'prop-types';
import React, { useRef, useState } from 'react';
import useFetchData from '../../../../hooks/useFetchData';
import '../style_home_page.scss';

const FlashSale = () => {
  const { data: products, loading, error } = useFetchData('http://localhost:5000/api/products');
  const [translateX, setTranslateX] = useState(0); // Trạng thái dịch chuyển theo X
  const startX = useRef(0); // Lưu vị trí bắt đầu vuốt
  const currentTranslateX = useRef(0); // Giá trị dịch chuyển hiện tại trước khi bắt đầu vuốt
  const containerRef = useRef(null);

  const ITEM_WIDTH = 254; // Chiều rộng của mỗi sản phẩm
  const VISIBLE_COUNT = 5; // Số lượng sản phẩm hiển thị cùng lúc

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  const handleMouseDown = (e) => {
    startX.current = e.clientX; // Lưu vị trí bắt đầu
    currentTranslateX.current = translateX; // Lưu trạng thái dịch chuyển hiện tại
    containerRef.current.addEventListener('mousemove', handleMouseMove);
  };

  const handleMouseMove = (e) => {
    if (e.buttons !== 1) return; // Chỉ xử lý khi chuột được giữ
    const deltaX = e.clientX - startX.current;
    const maxTranslateX = -(products.length * ITEM_WIDTH - VISIBLE_COUNT * ITEM_WIDTH);
    const newTranslateX = Math.min(0, Math.max(currentTranslateX.current + deltaX, maxTranslateX));
    setTranslateX(newTranslateX);
  };

  const handleMouseUp = () => {
    containerRef.current.removeEventListener('mousemove', handleMouseMove);
  };

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
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp} // Thêm sự kiện để xử lý khi chuột rời khỏi phần tử
        >
          <div className="owl-stage-outer">
            <div
              className="owl-stage"
              style={{
                transform: `translate3d(${translateX}px, 0, 0)`,
                transition: 'transform 0.25s ease-out',
                width: `${products.length * ITEM_WIDTH}px`,
                display: 'flex',
              }}
            >
              {products.map((product, index) => (
                <div
                  className="owl-item"
                  style={{ width: `${ITEM_WIDTH}px`, flexShrink: 0 }}
                  key={index}
                >
                  <a href="/a" className="product-template">
                    <div className="product-discount">
                      <span className="pe-1">10%</span>
                    </div>
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
