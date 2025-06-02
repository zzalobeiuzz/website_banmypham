// src/pages/HomePage.js
import React, { memo } from 'react';
import { Banner, FlashSale, Voucher } from '../homePage/components';


const HomePage = () => {
  return (
    <div className='container'>
      <Banner />
      <FlashSale /> {/* FlashSale tự gọi API và hiển thị dữ liệu */}
    </div>
  );
};

export default memo(HomePage);
