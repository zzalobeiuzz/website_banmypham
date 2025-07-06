import React from "react";
import ".sty";
import ToolBar from "./ToolBar";

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
