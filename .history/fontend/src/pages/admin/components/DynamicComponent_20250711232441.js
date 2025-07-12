import React, { useState } from "react";
import { ProductOverview } from "./DynamicHome/ProductOverview";
import ToolBar from "./ToolBar";

const DynamicComponent = ({ currentView }) => {
  // 🔎 State chứa từ khóa tìm kiếm
  const [searchKeyword, setSearchKeyword] = useState("");
  const [subViewProduct, setSubViewProduct] = useState("overview");
  const handleAddProduct = () => {
    setSubViewProduct("add");
  };
  return (
    <>
      {/* ✅ Nếu đang chọn "Sản phẩm" thì render ToolBar + ProductOverview */}
      {currentView === "Sản phẩm" && (
        <>
          {subViewProduct === "overview" && (
            <>
              <ToolBar searchKeyword={searchKeyword} setSearchKeyword={setSearchKeyword} />
              <ProductOverview searchKeyword={searchKeyword} onAddProduct={handleAddProduct} />
            </>
          )}
      
          // {subViewProduct === "add" && (
          //   <AddProduct onBack={() => setSubViewProduct("overview")} />
          // )}
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
