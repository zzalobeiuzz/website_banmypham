import React from "react";
import "./ProductList.scss";


export const ProductOverview = () => {
  return (
    <>
      <div className="product-topbar">
        <p>Danh mục sản phẩm</p>
      </div>

      <div className="product-wrapper">
        <div className="product-left">
          <p>Bộ lọc sản phẩm</p>
        </div>
        <div className="product-right">
          <div>Danh sách sản phẩm</div>
        </div>
      </div>
    </>
  );
};
