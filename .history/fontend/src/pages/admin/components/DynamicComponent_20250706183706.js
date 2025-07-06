import React from "react";
import ToolBar from "./ToolBar";
const DynamicComponent = () => {
  return (
    <>
      <ToolBar />
      <div style={{ display: "flex", width: "100%" }}>
      {/* Bên trái */}
      <div style={{ flexBasis: "30%", flexShrink: 0, backgroundColor: "#f0f0f0" }}>
        {/* Nội dung bên trái */}
        <p>Phần bên trái (30%)</p>
      </div>
  
      {/* Khoảng trống */}
      <div style={{ flexBasis: "2%", flexShrink: 0 }} />
  
      {/* Bên phải */}
      <div style={{ flexBasis: "68%", flexShrink: 0, backgroundColor: "#fafafa" }}>
        {/* Nội dung DynamicComponent */}
        <div>DynamicComponent</div>
      </div>
    </div>
  );
};

export default DynamicComponent;
