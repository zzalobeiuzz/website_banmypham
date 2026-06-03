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

  // Base paid condition (no leading WHERE so we can compose additional filters)
  const statusTextFor = (alias) => `LOWER(LTRIM(RTRIM(CAST(${alias}.Status AS NVARCHAR(4000)))))`;
  const paidCondFor = (alias) =>
    `(${statusTextFor(alias)} LIKE N'đã thanh toán%' OR ${statusTextFor(alias)} LIKE N'%thanh toán cod%' OR ${statusTextFor(alias)} = N'thanh toán cod')`;
  const paidCond = paidCondFor("O");

  const whereClauses = [paidCond];

  const normalizedFromDate = String(fromDate || "");
  const normalizedToDate = String(toDate || "");
  const hasDateRange = /^\d{4}-\d{2}-\d{2}$/.test(normalizedFromDate) && /^\d{4}-\d{2}-\d{2}$/.test(normalizedToDate);

  // Add time filters depending on requested date range/year
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

  const [catRes, monRes, dayRes, weekRes, qRes, yRes, productSalesRes] = await Promise.all([
    pool.request().query(categorySql),
    pool.request().query(monthlySql),
    pool.request().query(dailySql),
    pool.request().query(weeklySql),
    pool.request().query(quarterlySql),
    pool.request().query(yearlySql),
    pool.request().query(productSalesSql),
  ]);

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
    const customerName = String(order.CustomerName || "Khách hàng").trim() || "Khách hàng";
    const customerPhone = String(order.CustomerPhone || "").trim();
    const key = `${customerName}|${customerPhone}`;
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        CustomerName: customerName,
        CustomerPhone: customerPhone,
        CustomerID: customerPhone,
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
    topCustomers: takeTop(customerMap),
    orderStatus: Array.from(statusMap.entries())
      .map(([Status, Total]) => ({ Status, Total }))
      .sort((a, b) => Number(b.Total || 0) - Number(a.Total || 0)),
    recentOrders,
  };
};
