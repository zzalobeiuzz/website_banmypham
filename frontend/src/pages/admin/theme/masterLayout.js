import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "./header";
// import Sidebar from "./sidebar"; // Nếu có sidebar riêng, hãy import ở đây

const AdminMasterLayout = () => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div
      className="home"
      style={{
        overflowY: "scroll",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header />
      <div style={{ display: "flex", flex: 1 }}>
        {/* <Sidebar /> */} {/* Bỏ comment nếu có sidebar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminMasterLayout;


// import React, { useEffect } from "react";
// import Header from "./header";

// const AdminMasterLayout = ({ children }) => {
//   useEffect(() => {
//     // Tắt thanh cuộn toàn trang
//     document.body.style.overflow = "hidden";
//     return () => {
//       document.body.style.overflow = "auto"; // Reset khi unmount
//     };
//   }, []);

//   return (
//     <div
//       className="home"
//       style={{
//         overflowY: "scroll",
//         height: "100vh",
//       }}
//     >
//       <Header />
//       {children}
//     </div>
//   );
// };

// export default AdminMasterLayout;