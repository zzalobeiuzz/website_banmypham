// // src/components/FlashSale.js
// import PropTypes from 'prop-types';
// import React from 'react';
// import useFetchData from '../../../../hooks/useFetchData'; // Import custom hook
// import '../style_home_page.scss'; // Nếu cần định nghĩa style riêng cho FlashSale

// const FlashSale = () => {
//   const { data: products, loading, error } = useFetchData('http://localhost:5000/api/products'); // Đừng thêm tham số ngẫu nhiên ở đây

//   if (loading) {
//     return <div>Đang tải...</div>;
//   }

//   if (error) {
//     return <div>Lỗi: {error}</div>;
//   }

//   return (
//     <div className='section-flash-mobile d-block slide-template bg-white mb-4 pt-1'>
//       <div className='slide-top'>
//         <div className='slide-title d-flex align-items-center gap-2'>
//           <a href='/' className='d-flex align-items-center gap-2'>
//             <img className="img-fluid lazy entered loaded" src="/assets/images/hot_icon.svg" alt="Hot Icon" />
//             <h2>Flash deal</h2>
//           </a>
//         </div>
//         <a href='/' className='slide-more'>Xem tất cả</a>
//       </div>
//       <div className='slide-main'>
//         <div className='slide-template-slide owl-carousel owl-loaded owl-drag'>
//           <div className='owl-stage-outer'>
//           <div className="owl-stage" style={{
//                                       transform: 'translate3d(0px, 0px, 0px)',
//                                       transition: '0.25s',
//                                       width: '2096px',
//                                       }}>
//               {products.slice(0, 5).map((product, index) => (
//                 // Hiển thị 5 sản phẩm đầu tiên từ mảng products
//                 <div className='owl-item active' key={index}>
//                   <a href='/a' className='product-template'>
//                     <div className='product-discount'><span className='pe-1'>10%</span></div>

//                     <img src={/assets/pictures/${product.Image}} alt='' />
//                     <div className='product-price px-2'>
//                       <div className='public-price'>{product.Price.toLocaleString('vi-VN') + 'đ'} {/*fomat giá*/}  </div>
//                       <div className='origin-price'>asdf</div>
//                     </div>
//                     <div className='product-brand px-2'>{product.SupplierID}</div>
//                     <div className='product-title px-2'>{product.ProductName}</div>
//                     <div className='product-progress-sale count-down'></div>
//                   </a>
//                 </div>
//               ))}
//               {products.length > 5 && (
//                 // Nếu mảng products có hơn 5 sản phẩm, hiển thị phần còn lại từ sản phẩm thứ 6 trở đi trong một div riêng
//                 <div className='owl-item'>
//                   {products.slice(5).map((product, index) => (
//                     <a href='/a' className='product-template' key={index}>
//                       <div className='product-discount'><span className='pe-1'>10%</span></div>

//                       <img src={/assets/pictures/${product.Image}} alt='' />
//                       <div className='product-price px-2'>
//                         <div className='public-price'>{product.Price.toLocaleString('vi-VN') + 'đ'} {/*fomat giá*/}  </div>
//                         <div className='origin-price'>asdf</div>
//                       </div>
//                       <div className='product-brand px-2'>{product.SupplierID}</div>
//                       <div className='product-title px-2'>{product.ProductName}</div>
//                       <div className='product-progress-sale count-down'></div>
//                     </a>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>

//           <div className='owl-nav'>
//             <button type='button' role='presentation' className='owl-prev'>
//               <span aria-label="Previous">‹</span>
//             </button>
//             <button type='button' role='presentation' className='owl-next'>
//               <span aria-label="Next">›</span>
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// FlashSale.propTypes = {
//   products: PropTypes.array,
// };

// export default FlashSale;
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

  const [activeIndexes, setActiveIndexes] = useState([0, 1, 2, 3, 4]);  // Chỉ số các sản phẩm hiện tại
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

    setTranslateX(newTranslateX);

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }

    animationFrameId.current = requestAnimationFrame(() => {
      setTranslateX(newTranslateX);  // Cập nhật giá trị translateX
    });
  }, [products]);

  const handleMouseDown = (e) => {
    startX.current = e.clientX;  // Lưu vị trí chuột khi nhấn xuống
    currentTranslateX.current = translateX;  // Lưu lại vị trí hiện tại của slide

    // Đăng ký các sự kiện khi kéo chuột
    containerRef.current.addEventListener('mousemove', handleMouseMove);
    containerRef.current.addEventListener('mouseup', handleMouseUp);
    containerRef.current.addEventListener('mouseleave', handleMouseUp);
  };

  const handleMouseUp = (e) => {
    endX.current = e.clientX;
  
    containerRef.current.removeEventListener('mousemove', handleMouseMove);
    containerRef.current.removeEventListener('mouseup', handleMouseUp);
    containerRef.current.removeEventListener('mouseleave', handleMouseUp);
  
    const deltaX = endX.current - startX.current; // Khoảng cách di chuyển
    const maxTranslateX = -(products.length * ITEM_WIDTH - VISIBLE_COUNT * ITEM_WIDTH);
  
    if (Math.abs(deltaX) < 30) {
      // Không đủ khoảng cách để coi là lướt
      setTranslateX(currentTranslateX.current);
      return;
    }
  
    const direction = deltaX > 0 ? 1 : -1; // Kiểm tra hướng kéo (trái hoặc phải)
  
    // Giới hạn không cho lướt ra ngoài
    if (
      (currentTranslateX.current === 0 && direction > 0) || 
      (currentTranslateX.current === maxTranslateX && direction < 0)
    ) {
      console.log('Đã đạt giới hạn, không lướt thêm được.');
      return;
    }
  
    // Tính số sản phẩm cần lướt qua
    const itemsScrollable = Math.min(
      Math.floor((Math.abs(deltaX) - 70) / ITEM_WIDTH) + 1, 
      Math.max(products.length - VISIBLE_COUNT, 0)
    );
  
    // Cập nhật giá trị scrolledItemsCount
    scrolledItemsCount.current += direction * itemsScrollable;
  
    // Đảm bảo scrolledItemsCount không vượt ngoài giới hạn
    scrolledItemsCount.current = Math.max(
      Math.min(scrolledItemsCount.current, products.length - VISIBLE_COUNT),
      0
    );
  
    console.log('Tổng sản phẩm đã lướt: ', scrolledItemsCount.current);
  
    // Tính toán translateX mới
    const finalTranslateX = -scrolledItemsCount.current * ITEM_WIDTH;
    setTranslateX(finalTranslateX);
    currentTranslateX.current = finalTranslateX;
  
    // Cập nhật danh sách sản phẩm đang hiển thị
    const newActiveIndexes = [];
    for (let i = 0; i < VISIBLE_COUNT; i++) {
      const index = scrolledItemsCount.current + i;
      if (index < products.length) {
        newActiveIndexes.push(index);
      }
    }
  
    setActiveIndexes(newActiveIndexes);
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
                transform: translate3d(${translateX}px, 0, 0), transition:'0.25s',
                width: ${products.length * ITEM_WIDTH}px,  // Cập nhật chiều rộng theo số lượng sản phẩm
                display: 'flex',
              }}
            >
              {products.map((product, index) => (
                <div
                  className={owl-item ${activeIndexes.includes(index) ? 'active' : ''}}
                  style={{ width: ${ITEM_WIDTH}px, flexShrink: 0 }}
                  key={index}
                >
                  <a href="/a" className="product-template">
                    <div className="product-discount"><span className="pe-1">10%</span></div>
                    <img src={/assets/pictures/${product.Image}} alt={product.ProductName} />
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