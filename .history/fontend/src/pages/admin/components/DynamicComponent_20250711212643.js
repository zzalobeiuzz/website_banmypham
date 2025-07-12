import React, { useState } from "react";
import { ProductOverview } from "./DynamicHome/ProductOverview";
import ToolBar from "./ToolBar";

const DynamicComponent = ({ currentView }) => {
  const [searchKeyword, setSearchKeyword] = useState("");

  return (
    <>
      <ToolBar searchKeyword={searchKeyword} setSearchKeyword={setSearchKeyword} />

      {currentView === "Sản phẩm" && <ProductOverview searchKeyword={searchKeyword} />}

      {/* ... thêm các view khác nếu cần */}
    </>
  );
};

export default DynamicComponent;
