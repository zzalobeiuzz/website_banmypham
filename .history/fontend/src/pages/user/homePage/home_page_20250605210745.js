// src/pages/HomePage.js
import React, { memo } from 'react';
import { Banner, FlashSale, HotProduct, TopBrand, Voucher } from '../homePage/components';


const HomePage = () => {
  return (
    <div className='container'>
      <Banner />
      <Voucher/>
      <FlashSale /> {/* FlashSale tự gọi API và hiển thị dữ liệu */}
      <HotProduct/>
      <TopBrand/>
    </div>
  );
};

export default memo(HomePage);
