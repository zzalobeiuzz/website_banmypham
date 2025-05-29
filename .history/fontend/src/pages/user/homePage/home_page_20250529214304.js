// src/pages/HomePage.js
import React, { memo } from 'react';
import FlashSale from '../homePage/components/flash_sale'; 
import Banne from '../homePage/components/banner.js'; // Import component FlashSale
import './style_home_page.scss';

const HomePage = () => {
  return (
    <div className='container'>
      <FlashSale /> {/* FlashSale tự gọi API và hiển thị dữ liệu */}
    </div>
  );
};

export default memo(HomePage);
