import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import useFetchData from '../../../../hooks/useFetchData';
import '../style_home_page.scss';

const FlashSale = () => {
  // -------------------- Nhận dữ liệu --------------------
  const { data: fetchedProducts, loading, error } = useFetchData('http://localhost:5000/api/products');

  // -------------------- Trạng thái và ref --------------------
  const [translateX, setTranslateX] = useState(0);
  const startX = useRef(0);
  const endX = useRef(0);
  const currentTranslateX = useRef(0);
  const containerRef = useRef(null);
  const animationFrameId = useRef(null);
  const ITEM_WIDTH = 254;  // Chiều rộng của mỗi sản phẩm
  const VISIBLE_COUNT = 5; // Số sản phẩm hiển thị

  // -------------------- Cập nhật sản phẩm khi nhận dữ liệu --------------------
  const [products, setProducts] = useState([]);
  useEffect(() => {
    if (fetchedProducts) {
      setProducts(fetchedProducts);
    }
  }, [fetchedProducts]);

  // -------------------- Hàm xử lý sự kiện --------------------
  const handleMouseMove = useCallback((e) => {
    if (e.buttons !== 1) return; // Chỉ xử lý khi giữ chuột
    const deltaX = e.clientX - startX.current;
    const maxTranslateX = -(products.length * ITEM_WIDTH - VISIBLE_COUNT * ITEM_WIDTH);
    const newTranslateX = Math.min(0, Math.max(currentTranslateX.current + deltaX, maxTranslateX));

    // Hủy bỏ animation frame cũ và tạo mới
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }

    animationFrameId.current = requestAnimationFrame(() => {
      setTranslateX(newTranslateX);  // Cập nhật giá trị translateX
    });
  }, [products]);

  const handleMouseDown = (e) => {
    startX.current = e.clientX; // Lưu vị trí chuột khi nhấn xuống
    currentTranslateX.current = translateX; // Lưu lại vị trí hiện tại của slide

    // Đăng ký các sự kiện khi kéo chuột
    containerRef.current.addEventListener('mousemove', handleMouseMove);
    containerRef.current.addEventListener('mouseup', handleMouseUp);
    containerRef.current.addEventListener('mouseleave', handleMouseUp);
  };

  const handleMouseUp = (e) => {
    endX.current = e.clientX;

    // Hủy bỏ các sự kiện khi thả chuột hoặc chuột ra khỏi vùng
    containerRef.current.removeEventListener('mousemove', handleMouseMove);
    containerRef.current.removeEventListener('mouseup', handleMouseUp);
    containerRef.current.removeEventListener('mouseleave', handleMouseUp);

    const deltaX = endX.current - startX.current;
    console.log(deltaX)

    // Nếu di chuyển ít hơn 30px, đưa về vị trí mặc định (chưa di chuyển)
    if (Math.abs(deltaX) < 70) {
      setTranslateX(0);  // Đặt về vị trí ban đầu
      return; // Không làm gì nếu di chuyển quá ít
    }

    const maxTranslateX = -(products.length * ITEM_WIDTH - VISIBLE_COUNT * ITEM_WIDTH);

    // Kiểm tra điều kiện lướt qua phải và không còn sản phẩm
    if (deltaX > 0) {
      const newTranslateX = currentTranslateX.current + ITEM_WIDTH;
      if (newTranslateX > 0) {
        setTranslateX(0); // Dừng ở vị trí ban đầu
      } else {
        setTranslateX(newTranslateX);
      }
    }
    // Lướt sang trái (deltaX < 0)
    else {
      const newTranslateX = Math.max(currentTranslateX.current - ITEM_WIDTH, maxTranslateX);
      if (newTranslateX < maxTranslateX) {
        setTranslateX(maxTranslateX); // Dừng ở vị trí cuối cùng
      } else {
        setTranslateX(newTranslateX);
      }
    }
  };

  // -------------------- Xử lý loading và error --------------------
  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  // -------------------- Giao diện --------------------
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
          onMouseDown={handleMouseDown}  // Thêm sự kiện mousedown
        >
          <div className="owl-stage-outer">
            <div
              className="owl-stage"
              style={{
                transform: `translate3d(${translateX}px, 0, 0)`,  // Dịch chuyển slide theo giá trị translateX
                width: `${products.length * ITEM_WIDTH}px`,
                display: 'flex',
              }}
            >
              {products.map((product, index) => (
                <div
                  className={`owl-item ${index === 0 ? 'active' : ''}`}
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
