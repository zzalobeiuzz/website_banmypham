import React from "react";
import "./ProductList.scss";
import ToolBar from "./ToolBar";

const ProductOverview = () => {
  return (
    <>
      <ToolBar />
      <div className="product-wrapper">
        <div className="product-left">
          <p>Bộ lọc sản phẩm</p>
        </div>
        <div className="product-gap"></div>
        <div className="product-right">
          <div>Danh sách sản phẩm</div>
        </div>
      </div>
    </>
  );
};

export default ProductOverview;
