import React from "react";
import "./style.scss";

export const ProductOverview = () => {
  return (
    <>
      <div className="product-wrapper">
        {/* Topbar nằm trong wrapper */}
        <div className="product-topbar">
        
        <button>Tất cả</button>
        <button>Điện thoại</button>
        <button>Laptop</button>
        <button>Phụ kiện</button>
        <button>Khác</button>
     
        </div>

        <div className="product-content">
          <div className="product-left">
            <p>Bộ lọc sản phẩm</p>
          </div>
          <div className="product-right">
            <div>Danh sách sản phẩm</div>
          </div>
        </div>
      </div>
    </>
  );
};
