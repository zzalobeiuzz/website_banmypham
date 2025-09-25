export const ROUTERS = {
    // Các đường dẫn của USER
    USER: {
      HOME: "",                // Trang chủ user: /
      PROFILE: "profile",      // Trang profile: /profile
      SIGNUP: "signup",        // Trang đăng ký: /signup
    },
  
    // Các đường dẫn của ADMIN
    ADMIN: {
      HOME: "admin",           // Trang chủ admin: /admin
  
      // Nhóm đường dẫn sản phẩm (Product)
      PRODUCT: {
        INDEX: "product",               // Danh sách sản phẩm: /admin/product
        ADD: "product/add",             // Thêm sản phẩm: /admin/product/add
        DETAIL: "product/detail/:id",   // Chi tiết sản phẩm: /admin/product/detail/123
        EDIT: "product/edit/:id",       // Sửa sản phẩm: /admin/product/edit/123
      },
  
      // Nhóm đường dẫn đơn hàng (Order)
      ORDER: {
        INDEX: "order",                 // Danh sách đơn hàng: /admin/order
        ADD: "order/add",               // Thêm đơn hàng: /admin/order/add
        DETAIL: "order/detail/:id",     // Chi tiết đơn hàng: /admin/order/detail/123
      },
    },
  
    // Đường dẫn trang không tìm thấy
    NOTFOUNDPAGE: {
      NOTFOUNDPAGE: "*",                // Trang 404: bất kỳ đường dẫn không khớp
    },
  };
