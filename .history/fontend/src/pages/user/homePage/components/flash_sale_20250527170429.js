// src/components/FlashSale.js
import PropTypes from 'prop-types';
import React from 'react';
import useFetchData from '../../../hooks/useFetchData'; // Import custom hook
import './style_flash_sale.scss'; // Nếu cần định nghĩa style riêng cho FlashSale

const FlashSale = () => {
  const { data: products, loading, error } = useFetchData('http://localhost:5000/api/products'); // Gọi API trực tiếp

  if (loading) {
    return <div>Đang tải...</div>;
  }

  if (error) {
    return <div>Lỗi: {error}</div>;
  }

  return (
    <div className='section-flash-mobile d-block slide-template bg-white mb-4 pt-1'>
      <div className='slide-top'>
        <div className='slide-title d-flex align-items-center gap-2'>
          <a href='/' className='d-flex align-items-center gap-2'>
            <img className="img-fluid lazy entered loaded" src="/assets/images/hot_icon.svg" alt="Hot Icon" />
            <h2>Flash deal</h2>
          </a>
        </div>
        <a href='/' className='slide-more'>Xem tất cả</a>
      </div>
      <div className='slide-main'>
        {products.map((product, index) => (
          <li key={index}>
            {product.ProductName}
          </li>
        ))}
      </div>
    </div>
  );
};

FlashSale.propTypes = {
  products: PropTypes.array,
};

export default FlashSale;
