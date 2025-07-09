import React, { useEffect } from "react";
import Header from "./header";

const AdminMasterLayout = ({ children }) => {
  useEffect(() => {
    // Tắt thanh cuộn toàn trang
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto"; // Reset khi unmount
    };
  }, []);

  return (
    <div
      className="home"
      style={{
        overflowY: "scroll",
s
      }}
    >
      <Header />
      {children}
    </div>
  );
};

export default AdminMasterLayout;
