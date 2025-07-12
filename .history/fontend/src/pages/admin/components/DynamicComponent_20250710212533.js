import React, { useState } from "react";
import ProductOverview from "./DynamicHome/ProductOverview";

import ToolBar from "./ToolBar";

const DynamicComponent = () => {
  const [searchKeyword, setSearchKeyword] = useState("");

  return (
    <>
      <ToolBar searchKeyword={searchKeyword} setSearchKeyword={setSearchKeyword} />
      <ProductOverview searchKeyword={searchKeyword} />
    </>
  );
};

export default DynamicComponent;
