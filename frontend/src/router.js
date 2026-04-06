import { Route, Routes, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.js";
import SignUp from "./components/signup.js";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage.js";

// ========== 👤 USER IMPORTS ==========
import HomePage from "./pages/user/homePage/home_page.js";
import ProfilePage from "./pages/user/profilePage/profile_page.js";
import ProductDetail from "./pages/user/productDetail/product_detail.js";
import MasterLayout from "./pages/user/theme/masterLayout/masterLayout.js";

// ========== 🛠️ ADMIN IMPORTS ==========
import AddProduct from "./pages/admin/components/DynamicHome/product/AddProduct.js";
import { ProductOverview } from "./pages/admin/components/DynamicHome/product/ProductOverview.js";
import CategoryPage from "./pages/admin/components/DynamicHome/category/CategoryPage.js";
import CategoryProductsPage from "./pages/admin/components/DynamicHome/category/CategoryProductsPage.js";
import AdminHomepage from "./pages/admin/homepage/homepage.js";
import AdminMasterLayout from "./pages/admin/theme/masterLayout.js";
import ProductTable from "./pages/admin/components/DynamicHome/product/ProductTable.js";
import BatchesPage from "./pages/admin/components/DynamicHome/batches/BatchesPage.js";
import BatchDetailPage from "./pages/admin/components/DynamicHome/batches/BatchDetailPage.js";
import OrderPage from "./pages/admin/components/DynamicHome/order/OrderPage.js";
import AddOrder from "./pages/admin/components/DynamicHome/order/AddOrder.js";
import CustomerPage from "./pages/admin/components/DynamicHome/customer/CustomerPage.js";
import BrandPage from "./pages/admin/components/DynamicHome/brand/BrandPage.js";

import { ROUTERS } from "./utils/router";

// ========== 👤 USER ROUTES ==========
const userRoutes = [
  { path: ROUTERS.USER.HOME, element: <HomePage />, showHeaderFooter: true },
  { path: ROUTERS.USER.PROFILE, element: <ProfilePage />, showHeaderFooter: true },
  { path: ROUTERS.USER.PRODUCT_DETAIL, element: <ProductDetail />, showHeaderFooter: true },
  { path: ROUTERS.USER.SIGNUP, element: <SignUp />, showHeaderFooter: false },
];

// ========== 🛠️ ADMIN ROUTES ==========
const adminRoutes = [
  {
    path: ROUTERS.ADMIN.PRODUCT.INDEX || "product", // 📦 Sản phẩm
    children: [
      {
        path: ROUTERS.ADMIN.PRODUCT.ADD.replace("product/", ""), // ➕ Thêm sản phẩm (/admin/product/add)
        element: <AddProduct />,
      },
      {
        path: ROUTERS.ADMIN.CATEGORY.INDEX.replace("product/", ""), // 📂 Danh mục sản phẩm (/admin/product/categories)
        element: <CategoryPage />,
      },
      {
        path: ROUTERS.ADMIN.CATEGORY.PRODUCTS.replace("product/", ""), // 📦 Sản phẩm theo danh mục (/admin/product/categories/:categoryId/products)
        element: <CategoryProductsPage />,
      },
      {
        path: ROUTERS.ADMIN.PRODUCT.DETAIL.replace("product/", ""), // 🔍 Chi tiết sản phẩm (/admin/product/detail/:id)
        element: <ProductTable />,
      },
    ],
  },
  {
    path: ROUTERS.ADMIN.BRAND.INDEX || "brand",
    children: [{ index: true, element: <BrandPage /> }],
  },
  {
    path: ROUTERS.ADMIN.ORDER.INDEX || "order", // 📦 Đơn hàng
    children: [
      { index: true, element: <OrderPage /> }, // 🏠 Trang danh sách đơn hàng (/admin/order)
      {
        path: ROUTERS.ADMIN.ORDER.ADD.replace("order/", ""), // ➕ Thêm đơn hàng (/admin/order/add)
        element: <AddOrder />,
      },
    ],
  },
  {
    path: ROUTERS.ADMIN.SHIPMENT.INDEX || "shipment", // 🚚 Lô hàng
    children: [
      { index: true, element: <BatchesPage /> },
      { path: ":batchId", element: <BatchDetailPage /> },
    ],
  },
  {
    path: ROUTERS.ADMIN.CUSTOMER.INDEX || "customer", // 👥 Khách hàng
    children: [
      { index: true, element: <CustomerPage /> }, // 🏠 Trang danh sách khách hàng (/admin/customer)
    ],
  },
];

// ========== 🚦 ROUTER CUSTOM ==========
const RouterCustom = () => (
  <Routes>
    {/* 👤 USER ROUTES */}
    {userRoutes.map((route, idx) => (
      <Route
        key={idx}
        path={route.path}
        element={
          <MasterLayout showHeaderFooter={route.showHeaderFooter}>
            {route.element}
          </MasterLayout>
        }
      />
    ))}

    {/* 🛠️ ADMIN ROUTES */}
    <Route
      path={ROUTERS.ADMIN.HOME}
      element={
        <ProtectedRoute requiredRole={1}>
          <AdminMasterLayout />
        </ProtectedRoute>
      }
    >
      {/* 🏠 Layout AdminHomepage bao ngoài (chứa sidebar, header, ...) */}
      <Route element={<AdminHomepage />}>
        {/* 🏠 Khi vào /admin → mặc định hiển thị ProductOverview */}
        <Route index element={<ProductOverview />} />

        {/* 📦 Các route con admin (sản phẩm, đơn hàng, ...) */}
        {adminRoutes.map((route, idx) => (
          <Route key={idx} path={route.path}>
            {route.children?.map((child, cidx) => (
              <Route
                key={cidx}
                index={child.index}
                path={child.path}
                element={child.element}
              />
            ))}
          </Route>
        ))}

        {/* 🚫 Redirect nếu không khớp path */}
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Route>

    {/* 🚫 NOT FOUND PAGE */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default RouterCustom;
