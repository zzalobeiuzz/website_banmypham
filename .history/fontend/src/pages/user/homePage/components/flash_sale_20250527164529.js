import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import useFetchData from '../../../../hooks/useFetchData';
import '../style_home_page.scss';

const FlashSale = () => {
  // -------------------- Nhận dữ liệu --------------------
  const { data: fetchedProducts, loading, error } = useFetchData('http://localhost:5000/api/products');
  
  // -------------------- Trạng thái và ref --------------------
  const [translateX, setTranslateX] = useState(0);  // Dùng để lưu trữ và cập nhật vị trí dịch chuyển của carousel (trục X)
  const startX = useRef(0);  // Lưu trữ vị trí chuột khi bắt đầu kéo
  const currentTranslateX = useRef(0);  // Lưu trữ vị trí dịch chuyển hiện tại của carousel
  const containerRef = useRef(null);  // Tham chiếu đến phần tử chứa carousel
  const animationFrameId = useRef(null);  // Lưu trữ ID của `requestAnimationFrame`
  const ITEM_WIDTH = 254;  // Chiều rộng của mỗi sản phẩm
  const VISIBLE_COUNT = 5;  // Số lượng sản phẩm hiển thị cùng lúc
  
  // -------------------- Cập nhật sản phẩm khi nhận dữ liệu --------------------
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    if (fetchedProducts) {
      setProducts(fetchedProducts);  // Cập nhật danh sách sản phẩm
    }
  }, [fetchedProducts]);

  // -------------------- Hàm xử lý sự kiện --------------------
  const handleMouseMove = useCallback((e) => {
    if (e.buttons !== 1) return;  // Chỉ xử lý khi giữ chuột

    const deltaX = e.clientX - startX.current;
    const maxTranslateX = -(products.length * ITEM_WIDTH - VISIBLE_COUNT * ITEM_WIDTH);
    const newTranslateX = Math.min(0, Math.max(currentTranslateX.current + deltaX, maxTranslateX));

    setTranslateX(newTranslateX);

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);  // Hủy animation frame cũ
    }

    animationFrameId.current = requestAnimationFrame(() => {
      setTranslateX(newTranslateX);  // Cập nhật translateX
    });
  }, [products]);

  // Xử lý sự kiện khi nhấn chuột
  const handleMouseDown = (e) => {
    startX.current = e.clientX;
    currentTranslateX.current = translateX;

    containerRef.current.addEventListener('mousemove', handleMouseMove);
    containerRef.current.addEventListener('mouseup', handleMouseUp);
    containerRef.current.addEventListener('mouseleave', handleMouseUp);
  };

  // Xử lý sự kiện khi thả chuột
  const handleMouseUp = () => {
    containerRef.current.removeEventListener('mousemove', handleMouseMove);
    containerRef.current.removeEventListener('mouseup', handleMouseUp);
    containerRef.current.removeEventListener('mouseleave', handleMouseUp);

    // Kiểm tra nếu chuột đã di chuyển đủ để thay đổi sản phẩm
    const itemMoved = Math.abs(translateX) >= ITEM_WIDTH;

    if (itemMoved) {
      // Cập nhật lại danh sách sản phẩm bằng cách đẩy sản phẩm đầu tiên ra ngoài màn hình
      setProducts(prevProducts => {
        const movedProducts = prevProducts.slice(1);  // Loại bỏ sản phẩm đầu tiên
        const nextProducts = [...movedProducts, prevProducts[0]];  // Thêm sản phẩm đầu tiên vào cuối danh sách
        setTranslateX(0);  // Reset translateX về 0 sau khi di chuyển
        return nextProducts;  // Trả về danh sách sản phẩm đã được cập nhật
      });
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
          onMouseDown={handleMouseDown}
        >
          <div className="owl-stage-outer">
            <div
              className="owl-stage"
              style={{
                transform: `translate3d(${translateX}px, 0, 0)`,
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
