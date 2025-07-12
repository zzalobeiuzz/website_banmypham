import React, { useEffect } from "react";
import { Outlet } from "react-router-dom"; // 👈 Import Outlet
import Header from "./header";

const AdminMasterLayout = () => {
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
        height: "100vh",
      }}
    >
      <Header />
      // <Outlet /> {/* 👈 Thay vì {children} */}
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