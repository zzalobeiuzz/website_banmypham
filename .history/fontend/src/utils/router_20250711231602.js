export const ROUTERS = {
    USER: {
      HOME: "",
      PROFILE: "profile",
      SIGNUP: "signup",
    },
  
    ADMIN: {
      HOME: "admin",
  
      PRODUCT: {
        INDEX: "product",               // ➜ /admin/product
        ADD: "product/add",            // ➜ /admin/product/add
        DETAIL: "product/detail/:id",  // ➜ /admin/product/detail/123
        EDIT: "product/edit/:id",      // ➜ /admin/product/edit/123
      },
  
      ORDER: {
        INDEX: "order",                // ➜ /admin/order
        ADD: "order/add",             // ➜ /admin/order/add
        DETAIL: "order/detail/:id",   // ➜ /admin/order/detail/123
      },
    },
  
    NOTFOUNDPAGE: {
      NOTFOUNDPAGE: "*",
    },
  };
  