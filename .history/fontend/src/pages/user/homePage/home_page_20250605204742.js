// src/pages/HomePage.js
import React, { memo } from 'react';
import { HotProduct,Banner, FlashSale, Voucher } from '../homePage/components';


const HomePage = () => {
  return (
    <div className='container'>
      <Banner />
      <Voucher/>
      <FlashSale /> {/* FlashSale tự gọi API và hiển thị dữ liệu */}
      <HotProduct
    </div>
  );
};

export default memo(HomePage);
