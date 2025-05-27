
import PropTypes from 'prop-types';
import React from 'react';
import useFetchData from '../../../../hooks/useFetchData';
import '../style_home_page.scss';

const FlashSale = () => {
  const { data: products, loading, error } = useFetchData('http://localhost:5000/api/products'); // Đừng thêm tham số ngẫu nhiên ở đây

  if (loading) {
    return <div>Đang tải...</div>;
  }

  if (error) {
    return <div>Lỗi: {error}</div>;
  }

  return (
    <div className="section-flash-mobile d-block slide-template bg-white mb-4 pt-1">
      <div className="slide-top">
        <div className="slide-title d-flex align-items-center gap-2">
          <a href="/" className="d-flex align-items-center gap-2">
            <img className="img-fluid lazy entered loaded" src="/assets/images/hot_icon.svg" alt="Hot Icon" />
            <h2>Flash deal</h2>
          </a>
        </div>
        <a href='/' className='slide-more'>Xem tất cả</a>
      </div>

      <div className="slide-main">
        <div
          className="slide-template-slide"
          ref={containerRef}
          onMouseDown={handleMouseDown}  // Thêm sự kiện mousedown
        >
          <div className="owl-stage-outer">
          <div
          className="owl-stage"
          style={{
            transform: `translate3d(${translateX}px, 0, 0)`,  // ✅ dùng template string
            transition: '0.25s',
            width: `${products.length * ITEM_WIDTH}px`,       // ✅ dùng template string
            display: 'flex',
          }}
        >
        
              {products.map((product, index) => (
                <div
                className={`owl-item ${activeIndexes.includes(index) ? 'active' : ''}`}
                style={{ width: `${ITEM_WIDTH}px`, flexShrink: 0 }}  // ✅ dùng template string
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
  products: PropTypes.array.isRequired,
};

export default FlashSale;