// import { Route, Routes } from 'react-router-dom';
// import ProtectedRoute from './components/ProtectedRoute'; // ✅ thêm
// import SignUp from './components/signup.js';
// import NotFoundPage from "./pages/NotFoundPage/NotFoundPage.js";
// import AdminHomePage from "./pages/admin/homepage/homepage.js";
// import AdminMasterLayout from './pages/admin/theme/masterLayout.js';
// import HomePage from "./pages/user/homePage/home_page.js";
// import ProfilePage from "./pages/user/profilePage/profile_page.js";
// import MasterLayout from './pages/user/theme/masterLayout/masterLayout.js';
// import { ROUTERS } from "./utils/router";

// const renderUserRouter = () => {
//     const userRouters = [
//         {
//             path: ROUTERS.USER.HOME,
//             component: <HomePage />,
//             isShowHeader_Footer: true,
//         },
//         {
//             path: ROUTERS.USER.PROFILE,
//             component: <ProfilePage />,
//             isShowHeader_Footer: true,
//         },
//         {
//             path: ROUTERS.USER.SIGNUP,
//             component: <SignUp />,
//             isShowHeader_Footer: false,
//         },
//     ];

//     return userRouters.map((item, key) => (
//         <Route
//             key={key}
//             path={item.path}
//             element={
//                 <MasterLayout showHeaderFooter={item.isShowHeader_Footer}>
//                     {item.component}
//                 </MasterLayout>
//             }
//         />
//     ));
// };

// const renderAdminRouter = () => {
//     const adminRouters = [
//         {
//             path: ROUTERS.ADMIN.HOME,
//             component: <AdminHomePage />,
//         },
//     ];

//     return adminRouters.map((item, key) => (
//         <Route
//             key={key}
//             path={item.path}
//             element={
//                 <ProtectedRoute requiredRole={1}>   {/* ✅ Bọc lại để kiểm tra quyền */}
//                     <AdminMasterLayout>
//                         {item.component}
//                     </AdminMasterLayout>
//                 </ProtectedRoute>
//             }
//         />
//     ));
// };

// const RouterCustom = () => {
//     return (
//         <Routes>
//             {renderUserRouter()}
//             {renderAdminRouter()}
//             <Route path="*" element={<NotFoundPage />} />
//         </Routes>
//     );
// };

// export default RouterCustom;
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.js";
import SignUp from "./components/signup.js";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage.js";
import { ProductOverview } from "./pages/admin/components/DynamicHome/ProductOverview.js";
import AdminMasterLayout from "./pages/admin/theme/masterLayout.js";
import HomePage from "./pages/user/homePage/home_page.js";
import ProfilePage from "./pages/user/profilePage/profile_page.js";
import MasterLayout from "./pages/user/theme/masterLayout/masterLayout.js";
import AdminHomePage from "./pages/admin/homepage/homepage.js"


import { ROUTERS } from "./utils/router";

const renderUserRouter = () => {
  const userRouters = [
    {
      path: ROUTERS.USER.HOME,
      component: <HomePage />,
      isShowHeader_Footer: true,
    },
    {
      path: ROUTERS.USER.PROFILE,
      component: <ProfilePage />,
      isShowHeader_Footer: true,
    },
    {
      path: ROUTERS.USER.SIGNUP,
      component: <SignUp />,
      isShowHeader_Footer: false,
    },
  ];

  return userRouters.map((item, key) => (
    <Route
      key={key}
      path={item.path}
      element={
        <MasterLayout showHeaderFooter={item.isShowHeader_Footer}>
          {item.component}
        </MasterLayout>
      }
    />
  ));
};

const renderAdminRouter = () => {
    return (
      <Route
        path={ROUTERS.ADMIN.HOME} // ➜ /admin
        element={
          <ProtectedRoute requiredRole={1}>
            <AdminMasterLayout />
          </ProtectedRoute>
        }
      >
        {/* /admin ➜ AdminHomePage */}
        <Route index element={<AdminMasterLayout />} />
  
        {/* /admin/product */}
        <Route path={ROUTERS.ADMIN.PRODUCT.INDEX} element={<ProductOverview />} />
      </Route>
    );
  };
  

const RouterCustom = () => {
  return (
    <Routes>
      {renderUserRouter()}
      {renderAdminRouter()}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default RouterCustom;
