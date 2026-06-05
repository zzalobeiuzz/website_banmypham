const { connectDB, sql } = require("../../config/connect");
const { getAllProducts } = require("../../user/services/product.service");
const adminCategoryService = require("../category/category.service");
const adminBrandService = require("../brand/brand.service");
const adminBatchService = require("../batch/batch.service");
const adminVoucherService = require("../voucher/voucher.service");
const adminCustomerModel = require("../customer/customer.model");
const adminAccountModel = require("../account/account.model");
const adminSaleEventService = require("../saleEvent/saleEvent.service");
const adminOrderModel = require("../order/order.model");

/**
 * Trả về các thống kê doanh thu cần thiết cho dashboard admin
 */
/**
 * Trả về thống kê doanh thu cho dashboard admin.
 * Dữ liệu trả về dùng cho biểu đồ chính, biểu đồ tròn theo danh mục
 * và bảng chi tiết doanh thu sản phẩm.
 */
exports.getAggregatedStats = async ({
  range,
  year,
  fromYear,
  toYear,
  fromDate,
  toDate,
  categoryRange,
  categoryYear,
  categoryMonth,
  categoryWeek,
  categoryDay,
  categoryQuarter,
} = {}) => {
  const pool = await connectDB();

  // Chỉ tính doanh thu từ đơn đã thanh toán. Điều kiện không có WHERE ở đầu
  // để có thể ghép thêm bộ lọc ngày/tháng/quý/năm bên dưới.
  const statusTextFor = (alias) => `LOWER(LTRIM(RTRIM(CAST(${alias}.Status AS NVARCHAR(4000)))))`;
  const paidCondFor = (alias) =>
    `(${statusTextFor(alias)} LIKE N'đã thanh toán%' OR ${statusTextFor(alias)} LIKE N'%thanh toán cod%' OR ${statusTextFor(alias)} = N'thanh toán cod')`;
  const paidCond = paidCondFor("O");

  const whereClauses = [paidCond];

  const normalizedFromDate = String(fromDate || "");
  const normalizedToDate = String(toDate || "");
  const hasDateRange = /^\d{4}-\d{2}-\d{2}$/.test(normalizedFromDate) && /^\d{4}-\d{2}-\d{2}$/.test(normalizedToDate);

  // Lọc thời gian cho dữ liệu doanh thu tổng: ưu tiên khoảng ngày,
  // sau đó là một năm cụ thể, cuối cùng là khoảng năm khi xem theo năm.
  if (hasDateRange) {
    const startDate = normalizedFromDate <= normalizedToDate ? normalizedFromDate : normalizedToDate;
    const endDate = normalizedFromDate <= normalizedToDate ? normalizedToDate : normalizedFromDate;
    whereClauses.push(`CONVERT(DATE, TRY_CAST(O.CreatedAt AS DATETIME)) BETWEEN '${startDate}' AND '${endDate}'`);
  } else if (year) {
    const yr = Number(String(year).slice(0, 4));
    if (Number.isInteger(yr)) {
      whereClauses.push(`YEAR(TRY_CAST(O.CreatedAt AS DATETIME)) = ${yr}`);
    }
  } else if (range === "year") {
    const from = Number(String(fromYear || "").slice(0, 4));
    const to = Number(String(toYear || "").slice(0, 4));

    if (Number.isInteger(from) && Number.isInteger(to)) {
      whereClauses.push(`YEAR(TRY_CAST(O.CreatedAt AS DATETIME)) BETWEEN ${Math.min(from, to)} AND ${Math.max(from, to)}`);
    } else {
      whereClauses.push(`
        YEAR(TRY_CAST(O.CreatedAt AS DATETIME)) >= (
          SELECT MAX(YEAR(TRY_CAST(O2.CreatedAt AS DATETIME))) - 4
          FROM ORDERS O2
          WHERE ${paidCondFor("O2")} AND TRY_CAST(O2.CreatedAt AS DATETIME) IS NOT NULL
        )
      `);
    }
  }

  const categoryWhereClauses = [...whereClauses];
  const catYearText = String(categoryYear || "").slice(0, 4);
  const catYear = /^\d{4}$/.test(catYearText) ? Number(catYearText) : null;

  // Bộ lọc riêng cho biểu đồ tròn và bảng chi tiết. Khi admin bấm vào
  // một cột doanh thu, categoryRange/categoryYear/... sẽ giới hạn dữ liệu
  // theo đúng năm, quý, tháng hoặc ngày đã chọn.
  if (categoryRange === "day" && /^\d{4}-\d{2}-\d{2}$/.test(String(categoryDay || ""))) {
    categoryWhereClauses.push(`CONVERT(VARCHAR(10), TRY_CAST(O.CreatedAt AS DATETIME), 23) = '${categoryDay}'`);
  } else if (catYear) {
    categoryWhereClauses.push(`YEAR(TRY_CAST(O.CreatedAt AS DATETIME)) = ${catYear}`);

    if (categoryRange === "month") {
      const month = Number(categoryMonth);
      if (Number.isInteger(month) && month >= 1 && month <= 12) {
        categoryWhereClauses.push(`MONTH(TRY_CAST(O.CreatedAt AS DATETIME)) = ${month}`);
      }
    } else if (categoryRange === "week") {
      const week = Number(categoryWeek);
      if (Number.isInteger(week) && week >= 1 && week <= 53) {
        categoryWhereClauses.push(`DATEPART(ISO_WEEK, TRY_CAST(O.CreatedAt AS DATETIME)) = ${week}`);
      }
    } else if (categoryRange === "quarter") {
      const quarter = Number(categoryQuarter);
      if (Number.isInteger(quarter) && quarter >= 1 && quarter <= 4) {
        categoryWhereClauses.push(`DATEPART(QUARTER, TRY_CAST(O.CreatedAt AS DATETIME)) = ${quarter}`);
      }
    }
  }

  const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const categoryWhereSQL = categoryWhereClauses.length ? `WHERE ${categoryWhereClauses.join(" AND ")}` : "";

  // Doanh thu theo danh mục, dùng cho biểu đồ tròn.
  const categorySql = `
    SELECT 
      ISNULL(CAST(C.CategoryID AS NVARCHAR(100)), 'UNKNOWN') AS CategoryID,
      ISNULL(CAST(C.CategoryName AS NVARCHAR(255)), N'Khác') AS CategoryName,
      SUM(CAST(D.LineTotal AS DECIMAL(18,2))) AS Revenue
    FROM ORDER_DETAILS D
    LEFT JOIN PRODUCT P ON CAST(P.ProductID AS NVARCHAR(100)) = CAST(D.ProductID AS NVARCHAR(100))
    LEFT JOIN CATEGORY C ON CAST(P.CategoryID AS NVARCHAR(100)) = CAST(C.CategoryID AS NVARCHAR(100))
    LEFT JOIN ORDERS O ON CAST(O.OrderID AS NVARCHAR(100)) = CAST(D.OrderID AS NVARCHAR(100))
    ${categoryWhereSQL}
    GROUP BY ISNULL(CAST(C.CategoryID AS NVARCHAR(100)), 'UNKNOWN'), ISNULL(CAST(C.CategoryName AS NVARCHAR(255)), N'Khác')
    ORDER BY Revenue DESC
  `;

  // Doanh thu theo tháng, dùng cho biểu đồ tháng và drill từ quý xuống tháng.
  const monthlySql = `
    SELECT 
      CONVERT(VARCHAR(7), TRY_CAST(O.CreatedAt AS DATETIME), 23) AS MonthLabel,
      SUM(CAST(D.LineTotal AS DECIMAL(18,2))) AS Revenue
    FROM ORDER_DETAILS D
    LEFT JOIN ORDERS O ON CAST(O.OrderID AS NVARCHAR(100)) = CAST(D.OrderID AS NVARCHAR(100))
    ${whereSQL}
    GROUP BY CONVERT(VARCHAR(7), TRY_CAST(O.CreatedAt AS DATETIME), 23)
    ORDER BY MonthLabel ASC
  `;

  // Doanh thu theo ngày, dùng khi drill từ tháng xuống danh sách ngày.
  const dailySql = `
    SELECT
      CONVERT(VARCHAR(10), TRY_CAST(O.CreatedAt AS DATETIME), 23) AS DayLabel,
      SUM(CAST(D.LineTotal AS DECIMAL(18,2))) AS Revenue
    FROM ORDER_DETAILS D
    LEFT JOIN ORDERS O ON CAST(O.OrderID AS NVARCHAR(100)) = CAST(D.OrderID AS NVARCHAR(100))
    ${whereSQL}
    GROUP BY CONVERT(VARCHAR(10), TRY_CAST(O.CreatedAt AS DATETIME), 23)
    ORDER BY DayLabel ASC
  `;

  // Doanh thu theo tuần. Frontend thống kê hiện không drill theo tuần,
  // nhưng backend vẫn giữ để tương thích nếu có màn hình khác cần dùng.
  const weeklySql = `
    SELECT
      YEAR(TRY_CAST(O.CreatedAt AS DATETIME)) AS YearLabel,
      DATEPART(ISO_WEEK, TRY_CAST(O.CreatedAt AS DATETIME)) AS WeekOfYear,
      SUM(CAST(D.LineTotal AS DECIMAL(18,2))) AS Revenue
    FROM ORDER_DETAILS D
    LEFT JOIN ORDERS O ON CAST(O.OrderID AS NVARCHAR(100)) = CAST(D.OrderID AS NVARCHAR(100))
    ${whereSQL}
    GROUP BY YEAR(TRY_CAST(O.CreatedAt AS DATETIME)), DATEPART(ISO_WEEK, TRY_CAST(O.CreatedAt AS DATETIME))
    ORDER BY YearLabel ASC, WeekOfYear ASC
  `;

  // Doanh thu theo quý, dùng cho biểu đồ quý và drill từ năm xuống quý.
  const quarterlySql = `
    SELECT
      YEAR(TRY_CAST(O.CreatedAt AS DATETIME)) AS YearLabel,
      DATEPART(QUARTER, TRY_CAST(O.CreatedAt AS DATETIME)) AS Quarter,
      SUM(CAST(D.LineTotal AS DECIMAL(18,2))) AS Revenue
    FROM ORDER_DETAILS D
    LEFT JOIN ORDERS O ON CAST(O.OrderID AS NVARCHAR(100)) = CAST(D.OrderID AS NVARCHAR(100))
    ${whereSQL}
    GROUP BY YEAR(TRY_CAST(O.CreatedAt AS DATETIME)), DATEPART(QUARTER, TRY_CAST(O.CreatedAt AS DATETIME))
    ORDER BY YEAR(TRY_CAST(O.CreatedAt AS DATETIME)) ASC, DATEPART(QUARTER, TRY_CAST(O.CreatedAt AS DATETIME)) ASC
  `;

  // Doanh thu theo năm, dùng cho biểu đồ năm.
  const yearlySql = `
    SELECT
      YEAR(TRY_CAST(O.CreatedAt AS DATETIME)) AS YearLabel,
      SUM(CAST(D.LineTotal AS DECIMAL(18,2))) AS Revenue
    FROM ORDER_DETAILS D
    LEFT JOIN ORDERS O ON CAST(O.OrderID AS NVARCHAR(100)) = CAST(D.OrderID AS NVARCHAR(100))
    ${whereSQL}
    GROUP BY YEAR(TRY_CAST(O.CreatedAt AS DATETIME))
    ORDER BY YearLabel ASC
  `;

  // Chi tiết doanh thu theo sản phẩm. Truy vấn này dùng categoryWhereSQL
  // để bảng chi tiết phản ánh đúng cột biểu đồ đang được chọn.
  const productSalesSql = `
    SELECT
      CAST(ISNULL(D.ProductID, '') AS NVARCHAR(100)) AS ProductID,
      ISNULL(CAST(P.ProductName AS NVARCHAR(255)), N'Sản phẩm') AS ProductName,
      ISNULL(CAST(C.CategoryName AS NVARCHAR(255)), N'Khác') AS CategoryName,
      ISNULL(MAX(CAST(P.Image AS NVARCHAR(500))), '') AS Image,
      SUM(ISNULL(TRY_CAST(D.Quantity AS INT), 0)) AS Quantity,
      SUM(ISNULL(TRY_CAST(D.LineTotal AS DECIMAL(18,2)), 0)) AS Revenue
    FROM ORDER_DETAILS D
    LEFT JOIN PRODUCT P ON CAST(P.ProductID AS NVARCHAR(100)) = CAST(D.ProductID AS NVARCHAR(100))
    LEFT JOIN CATEGORY C ON CAST(C.CategoryID AS NVARCHAR(100)) = CAST(P.CategoryID AS NVARCHAR(100))
    LEFT JOIN ORDERS O ON CAST(O.OrderID AS NVARCHAR(100)) = CAST(D.OrderID AS NVARCHAR(100))
    ${categoryWhereSQL}
    GROUP BY
      CAST(ISNULL(D.ProductID, '') AS NVARCHAR(100)),
      ISNULL(CAST(P.ProductName AS NVARCHAR(255)), N'Sản phẩm'),
      ISNULL(CAST(C.CategoryName AS NVARCHAR(255)), N'Khác')
    ORDER BY Quantity DESC, Revenue DESC
  `;

  // Chạy song song các truy vấn doanh thu để dashboard tải nhanh hơn.
  const [catRes, monRes, dayRes, weekRes, qRes, yRes, productSalesRes] = await Promise.all([
    pool.request().query(categorySql),
    pool.request().query(monthlySql),
    pool.request().query(dailySql),
    pool.request().query(weeklySql),
    pool.request().query(quarterlySql),
    pool.request().query(yearlySql),
    pool.request().query(productSalesSql),
  ]);

  // Trả về recordset thô để frontend tự map sang cấu trúc biểu đồ.
  return {
    categoryRevenue: catRes.recordset || [],
    monthlyRevenue: monRes.recordset || [],
    dailyRevenue: dayRes.recordset || [],
    weeklyRevenue: weekRes.recordset || [],
    quarterlyRevenue: qRes.recordset || [],
    yearlyRevenue: yRes.recordset || [],
    productSalesReport: productSalesRes.recordset || [],
  };
};

exports.getOverviewStats = async () => {
  const safeListCount = async (loader, pickData = (value) => value) => {
    try {
      const result = await loader();
      const data = pickData(result);
      return Array.isArray(data) ? data.length : 0;
    } catch (err) {
      console.warn("Overview management count skipped:", err.message);
      return 0;
    }
  };

  const toNumber = (value) => {
    const normalized = String(value ?? "").replace(/[^0-9.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const isPaidOrder = (status) => {
    const normalized = String(status || "").trim().toLowerCase();
    return (
      normalized.startsWith("đã thanh toán") ||
      normalized.includes("thanh toán cod") ||
      normalized === "thanh toán cod"
    );
  };

  const takeTop = (items, limit = 6) =>
    Array.from(items.values())
      .sort((a, b) => Number(b.Quantity || b.OrderCount || 0) - Number(a.Quantity || a.OrderCount || 0) || Number(b.Revenue || 0) - Number(a.Revenue || 0))
      .slice(0, limit);

  const [
    products,
    productsCount,
    categoriesCount,
    brandsCount,
    batchesCount,
    customersCount,
    vouchersCount,
    accountsCount,
    eventsCount,
    orderPayload,
  ] = await Promise.all([
    getAllProducts().catch((err) => {
      console.warn("Overview products data skipped:", err.message);
      return [];
    }),
    safeListCount(getAllProducts),
    safeListCount(adminCategoryService.getAllCategories, (result) => result?.data),
    safeListCount(adminBrandService.getAllBrands, (result) => Array.isArray(result) ? result : result?.data),
    safeListCount(adminBatchService.getAllBatches, (result) => result?.data),
    safeListCount(adminCustomerModel.getCustomerList),
    safeListCount(adminVoucherService.getAllVouchers, (result) => result?.data),
    safeListCount(adminAccountModel.getAllAccounts),
    safeListCount(adminSaleEventService.getAllSaleEvents),
    adminOrderModel.getAllOrdersFromBill().catch((err) => {
      console.warn("Overview orders data skipped:", err.message);
      return { orders: [], details: [] };
    }),
  ]);

  const orders = Array.isArray(orderPayload?.orders) ? orderPayload.orders : [];
  const details = Array.isArray(orderPayload?.details) ? orderPayload.details : [];
  const paidOrders = orders.filter((order) => isPaidOrder(order.Status));
  const paidOrderIds = new Set(paidOrders.map((order) => String(order.OrderId || "").trim()).filter(Boolean));
  const paidDetails = details.filter((detail) => paidOrderIds.has(String(detail.OrderId || "").trim()));
  const productById = new Map((Array.isArray(products) ? products : []).map((product) => [String(product.ProductID || "").trim(), product]));
  const customerRows = await adminCustomerModel.getCustomerList().catch((err) => {
    console.warn("Overview customer rows skipped:", err.message);
    return [];
  });
  const customerById = new Map(
    (Array.isArray(customerRows) ? customerRows : [])
      .map((customer) => {
        const id = String(customer.CustomerID || customer.Email || customer.CustomerCode || "").trim();
        return id ? [id, customer] : null;
      })
      .filter(Boolean)
  );

  const paidRevenue = paidOrders.reduce((sum, order) => sum + toNumber(order.TotalRaw), 0);
  const summary = {
    PaidOrders: paidOrders.length,
    PaidRevenue: paidRevenue,
    AverageOrderValue: paidOrders.length ? paidRevenue / paidOrders.length : 0,
  };

  const productMap = new Map();
  const categoryMap = new Map();
  paidDetails.forEach((detail) => {
    const productId = String(detail.ProductID || "").trim();
    const productInfo = productById.get(productId) || {};
    const productName = detail.ProductName || productInfo.ProductName || "Sản phẩm";
    const quantity = toNumber(detail.Quantity);
    const revenue = toNumber(detail.LineTotalRaw);
    const productKey = productId || productName;

    if (!productMap.has(productKey)) {
      productMap.set(productKey, {
        ProductID: productId,
        ProductName: productName,
        Image: detail.ProductImage || productInfo.Image || "",
        Quantity: 0,
        Revenue: 0,
      });
    }
    const productRow = productMap.get(productKey);
    productRow.Quantity += quantity;
    productRow.Revenue += revenue;

    const categoryId = String(detail.CategoryID || productInfo.CategoryID || "UNKNOWN").trim() || "UNKNOWN";
    const categoryName = detail.CategoryName || productInfo.CategoryName || "Khác";
    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        CategoryID: categoryId,
        CategoryName: categoryName,
        Quantity: 0,
        Revenue: 0,
      });
    }
    const categoryRow = categoryMap.get(categoryId);
    categoryRow.Quantity += quantity;
    categoryRow.Revenue += revenue;
  });

  const customerMap = new Map();
  paidOrders.forEach((order) => {
    const customerId = String(order.UserID || "").trim();
    const customerInfo = customerById.get(customerId);
    if (!customerId || !customerInfo) return;

    const customerName = String(customerInfo.FullName || customerInfo.CustomerName || customerInfo.Name || order.CustomerName || "Khách hàng").trim() || "Khách hàng";
    const customerPhone = String(customerInfo.PhoneNumber || customerInfo.Phone || order.CustomerPhone || "").trim();
    const key = customerId;
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        CustomerName: customerName,
        CustomerPhone: customerPhone,
        CustomerID: customerId,
        OrderCount: 0,
        Revenue: 0,
      });
    }
    const customerRow = customerMap.get(key);
    customerRow.OrderCount += 1;
    customerRow.Revenue += toNumber(order.TotalRaw);
  });

  const statusMap = new Map();
  orders.forEach((order) => {
    const status = String(order.Status || "Chưa rõ").trim() || "Chưa rõ";
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });

  const recentOrders = orders.slice(0, 6).map((order) => ({
    OrderID: order.OrderId,
    CustomerName: order.CustomerName || "Khách hàng",
    Status: order.Status || "Chưa rõ",
    Total: toNumber(order.TotalRaw),
    CreatedAt: order.OrderDate || "-",
  }));

  return {
    counts: {
      Products: productsCount,
      Orders: orders.length,
      Categories: categoriesCount,
      Brands: brandsCount,
      Batches: batchesCount,
      Customers: customersCount,
      Vouchers: vouchersCount,
      Accounts: accountsCount,
      Events: eventsCount,
    },
    summary,
    topProducts: takeTop(productMap),
    topCategories: takeTop(categoryMap),
    topCustomers: takeTop(customerMap, 5),
    orderStatus: Array.from(statusMap.entries())
      .map(([Status, Total]) => ({ Status, Total }))
      .sort((a, b) => Number(b.Total || 0) - Number(a.Total || 0)),
    recentOrders,
  };
};
