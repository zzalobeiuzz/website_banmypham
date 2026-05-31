export const ROUTERS = {
    // Các đường dẫn của USER
    USER: {
      HOME: "",                      // Trang chủ user: /
      PROFILE: "profile",            // Trang profile: /profile
      PRODUCT_DETAIL: "product/:id", // Chi tiết sản phẩm: /product/123
      BRAND_DETAIL: "brand/:idBrand", // Chi tiết thương hiệu: /brand/BR001
      SIGNUP: "signup",              // Trang đăng ký: /signup
      ALL_PRODUCTS: "all-products/:type", // Trang tất cả sản phẩm: /all-products/flash-sale
      CARTDETAIL: "cart-detail",     // Trang chi tiết giỏ hàng: /cart-detail
    },
  
    // Các đường dẫn của ADMIN
    ADMIN: {
      HOME: "admin",           // Trang chủ admin: /admin
  
      // Nhóm đường dẫn sản phẩm (Product)
      PRODUCT: {              // Danh sách sản phẩm: /admin/product
        INDEX: "product",               // Danh sách sản phẩm: /admin/product
        ADD: "product/add",             // Thêm sản phẩm: /admin/product/add
        DETAIL: "product/detail/:id",   // Chi tiết sản phẩm: /admin/product/detail/123
        EDIT: "product/edit/:id",       // Sửa sản phẩm: /admin/product/edit/123
      },
  
      // Nhóm đường dẫn danh mục (Category)
      CATEGORY: {
        INDEX: "product/categories",    // Danh sách danh mục: /admin/product/categories
        PRODUCTS: "product/categories/:categoryId/products", // Sản phẩm theo danh mục: /admin/product/categories/:categoryId/products
      },

      // Nhóm đường dẫn thương hiệu (Brand)
      BRAND: {
        INDEX: "brand",                 // Danh sách thương hiệu: /admin/brand
      },
  
      // Nhóm đường dẫn đơn hàng (Order)
      ORDER: {
        INDEX: "order",                 // Danh sách đơn hàng: /admin/order
        ADD: "order/add",               // Thêm đơn hàng: /admin/order/add
        DETAIL: "order/detail/:id",     // Chi tiết đơn hàng: /admin/order/detail/123
      },

      SHIPMENT: {
        INDEX: "shipment",                    // Danh sách lô hàng: /admin/shipment
        DETAIL: "shipment/:batchId",          // Chi tiết lô hàng: /admin/shipment/BATCH_001
      },

      // Nhóm đường dẫn khách hàng (Customer)
      CUSTOMER: {
        INDEX: "customer",                    // Danh sách khách hàng: /admin/customer
        DETAIL: "customer/:customerId",       // Chi tiết khách hàng: /admin/customer/email@domain.com
      },

      // Nhóm đường dẫn voucher (Voucher)
      VOUCHER: {
        INDEX: "voucher",                    // Danh sách voucher: /admin/voucher
      },

      ACCOUNT: {
        INDEX: "account",                     // Danh sách tài khoản: /admin/account
      },
    },
  
    // Đường dẫn trang không tìm thấy
    NOTFOUNDPAGE: {
      NOTFOUNDPAGE: "*",                // Trang 404: bất kỳ đường dẫn không khớp
    },
  };

// // Mảng breadcrumb cho các page user
// export const USER_BREADCRUMBS = [
//   { title: "Trang chủ", url: "/" },
//   { title: "Tất cả sản phẩm", url: "/all-products/flash-sale" },
//   { title: "Chi tiết sản phẩm", url: "/product/:id" },
//   { title: "Chi tiết thương hiệu", url: "/brand/:idBrand" },
//   { title: "Profile", url: "/profile" },
//   { title: "Đăng ký", url: "/signup" },
// ];
