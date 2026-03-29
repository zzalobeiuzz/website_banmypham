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
  
      // Nhóm đường dẫn đơn hàng (Order)
      ORDER: {
        INDEX: "admin/order",                 // Danh sách đơn hàng: /admin/order
        ADD: "admin/order/add",               // Thêm đơn hàng: /admin/order/add
        DETAIL: "admin/order/detail/:id",     // Chi tiết đơn hàng: /admin/order/detail/123
      },

      SHIPMENT: {
        INDEX: "shipment",                    // Danh sách lô hàng: /admin/shipment
      },
    },
  
    // Đường dẫn trang không tìm thấy
    NOTFOUNDPAGE: {
      NOTFOUNDPAGE: "*",                // Trang 404: bất kỳ đường dẫn không khớp
    },
  };
