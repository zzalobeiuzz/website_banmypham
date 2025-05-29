// src/pages/HomePage.js
import React, { memo } from 'react';
import Banner from '../homePage/components/banner.js'; // Import component FlashSale
import FlashSale from '../homePage/components/flash_sale';
import './style_home_page.scss';

const HomePage = () => {
  return (
    <div className='container'>
      <Banner />
      <FlashSale /> {/* FlashSale tự gọi API và hiển thị dữ liệu */}
    </div>
  );
};

export default memo(HomePage);
