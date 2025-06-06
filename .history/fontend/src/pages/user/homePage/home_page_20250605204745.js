// src/pages/HomePage.js
import React, { memo } from 'react';
import { Banner, FlashSale, HotProduct, Voucher } from '../homePage/components';


const HomePage = () => {
  return (
    <div className='container'>
      <Banner />
      <Voucher/>
      <FlashSale /> {/* FlashSale tự gọi API và hiển thị dữ liệu */}
      <HotProduct/>
    </div>
  );
};

export default memo(HomePage);
