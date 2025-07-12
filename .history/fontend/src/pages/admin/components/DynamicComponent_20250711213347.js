import React, { useState } from "react";
import { ProductOverview } from "./DynamicHome/ProductOverview";
import ToolBar from "./ToolBar";

const DynamicComponent = ({ currentView }) => {
  // 🔎 State chứa từ khóa tìm kiếm
  const [searchKeyword, setSearchKeyword] = useState("");
  const [subViewProduct, setSubViewProduct] = useState("overview");
  const handleAddProduct = () => {
    setSubView("add");
  };
  return (
    <>
      {/* ✅ Nếu đang chọn "Sản phẩm" thì render ToolBar + ProductOverview */}
      {currentView === "Sản phẩm" && (
        <>
          {/* Thanh tìm kiếm + các button */}
          <ToolBar searchKeyword={searchKeyword} setSearchKeyword={setSearchKeyword} />

          {/* Danh sách sản phẩm, lọc theo keyword */}
          <ProductOverview
            searchKeyword={searchKeyword}
            onAddProduct={handleAddProduct}
          />
        </>
      )}

      {/* 💡 Nếu có view khác, thêm điều kiện tương tự ở đây
          Ví dụ:
          {currentView === "Khách hàng" && <CustomerOverview />}
          {currentView === "Đơn hàng" && <OrderOverview />} 
      */}
    </>
  );
};

export default DynamicComponent;
