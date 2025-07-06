import React from "react";
import ToolBar from "./ToolBar";
import "./style.scss";

export const ProductOverview = () => {
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
