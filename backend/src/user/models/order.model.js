const { connectDB, sql } = require("../../config/connect");

/**-------------------------------------------------
 🧪 Tạo mã OrderID ngẫu nhiên
--------------------------------------------------*/
const buildRandomOrderId = () => {
  // ⏱️ Timestamp hiện tại (ms) → đảm bảo gần như không trùng
  const timestamp = Date.now();

  // 🎲 Random 4 số (0000 → 9999)
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");

  // 🆔 Format mã đơn hàng: DH + timestamp + random
  return `DH${timestamp}${random}`;
};

/**-------------------------------------------------
 🔄 Convert string OrderID → INT an toàn
 ⚠️ Dùng cho ORDER_DETAILS nếu cột OrderID là INT
--------------------------------------------------*/
const buildSafeIntFromString = (value) => {
  let hash = 0;
  const text = String(value || "");

  // 🔁 Hash chuỗi → số int
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }

  // 🛡️ Đảm bảo nằm trong range INT của SQL Server
  const safeValue = Math.abs(hash) % 2147483647;

  // ❗ Tránh = 0 (vì có thể conflict logic)
  return safeValue === 0 ? 1 : safeValue;
};

/**-------------------------------------------------
 🧹 Xóa các đơn hàng có trạng thái "Chờ thanh toán" 
 mà quá 10p chưa chuyển trạng thái "Đã thanh toán"
--------------------------------------------------*/
exports.cleanupExpiredPendingOrders = async (minutes = 10) => {
  const pool = await connectDB();
  const transaction = pool.transaction();
  await transaction.begin();

  try {
    // 🔍 Lấy danh sách đơn hàng quá hạn
    const expiredResult = await transaction.request()
      .input("minutes", sql.Int, Number(minutes) || 10)
      .query(`
        SELECT [OrderID]
        FROM ORDERS
        WHERE [Status] = N'Chờ thanh toán'
          AND [CreatedAt] <= DATEADD(MINUTE, -@minutes, GETDATE())
      `);

    const expiredOrders = (expiredResult.recordset || [])
      .map((row) => String(row.OrderID));

    // ❌ Không có đơn nào → commit luôn
    if (expiredOrders.length === 0) {
      await transaction.commit();
      return { deletedOrders: 0, deletedDetails: 0 };
    }

    const deleteReq = transaction.request();
    const orderParams = [];
    const detailParams = [];

    // 📌 Build dynamic params cho ORDERS
    expiredOrders.forEach((orderId, index) => {
      const paramName = `orderId${index}`;
      deleteReq.input(paramName, sql.NVarChar(100), orderId);
      orderParams.push(`@${paramName}`);
    });

    // 📌 Build dynamic params cho ORDER_DETAILS
    expiredOrders.forEach((orderId, index) => {
      const paramName = `OrderId${index}`;
      deleteReq.input(paramName, sql.NVarChar(100), orderId);
      detailParams.push(`@${paramName}`);
    });

    // 🧨 Xóa chi tiết trước (FK)
    const deleteDetailsResult = await deleteReq.query(`
      DELETE FROM ORDER_DETAILS
      WHERE [OrderID] IN (${detailParams.join(",")})
    `);

    // 🧨 Xóa đơn chính
    const deleteOrdersResult = await deleteReq.query(`
      DELETE FROM ORDERS
      WHERE [OrderID] IN (${orderParams.join(",")})
    `);

    await transaction.commit();

    return {
      deletedOrders: deleteOrdersResult.rowsAffected?.[0] || 0,
      deletedDetails: deleteDetailsResult.rowsAffected?.[0] || 0,
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**-------------------------------------------------
 🆔 Tạo OrderID không trùng trong DB
--------------------------------------------------*/
exports.generateOrderId = async (maxAttempts = 5) => {
  const pool = await connectDB();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {

    // 🧪 Tạo mã mới
    const candidate = buildRandomOrderId();

    // 🔍 Check trùng DB
    const exists = await pool.request()
      .input("orderId", sql.NVarChar(100), candidate)
      .query(`
        SELECT TOP 1 1 AS Found
        FROM ORDERS
        WHERE CAST([OrderID] AS NVARCHAR(100)) = @orderId
      `);

    // ✅ Nếu chưa tồn tại → dùng luôn
    if (!exists.recordset || exists.recordset.length === 0) {
      return candidate;
    }
  }

  // ❌ Nếu trùng nhiều lần
  throw new Error("Không tạo được mã OrderID không trùng.");
};

/**-------------------------------------------------
 📦 Insert ORDERS + ORDER_DETAILS (transaction)
--------------------------------------------------*/
exports.insertBillAndDetails = async (orderData) => {
  const {
    userId,
    items = [],
    shippingInfo = {},
    total = 0,
    subtotal = 0,
    discount = 0,
    voucher = "",
    paymentMethod = "COD",
    status = "Đang xử lý",
  } = orderData;

  // ✅ Validate trạng thái
  const validStatuses = ["Đang xử lý", "Chờ thanh toán", "Đã thanh toán", "Đã hủy"];
  if (!validStatuses.includes(status)) {
    throw new Error(`Trạng thái không hợp lệ: ${status}`);
  }

  const pool = await connectDB();
  const transaction = pool.transaction();
  await transaction.begin();

  try {
    // 🆔 Tạo ID đơn hàng
    const newOrderId = await exports.generateOrderId();

    // ⚠️ Hash sang INT cho bảng detail (thiết kế tạm)
    const detailOrderId = buildSafeIntFromString(newOrderId);

    const tranReq = transaction.request();

    // 🧾 Insert bảng ORDERS
    await tranReq
      .input("orderId", sql.NVarChar(100), newOrderId)
      .input("userId", sql.NVarChar(100), userId || null)
      .input("customerName", sql.NVarChar(255), shippingInfo.name || "")
      .input("customerPhone", sql.NVarChar(50), shippingInfo.phone || "")
      .input("customerAddress", sql.NVarChar(500), shippingInfo.address || "")
      .input("subtotal", sql.Decimal(18, 2), subtotal)
      .input("discount", sql.Decimal(18, 2), discount)
      .input("total", sql.Decimal(18, 2), total)
      .input("voucher", sql.NVarChar(100), voucher)
      .input("paymentMethod", sql.NVarChar(50), paymentMethod)
      .input("status", sql.NVarChar(100), status)
      .query(`
        INSERT INTO ORDERS (OrderID, UserID, CustomerName, CustomerPhone, CustomerAddress, Subtotal, Discount, Total, Voucher, PaymentMethod, Status, CreatedAt, UpdatedAt)
        VALUES (@orderId, @userId, @customerName, @customerPhone, @customerAddress, @subtotal, @discount, @total, @voucher, @paymentMethod, @status, GETDATE(), GETDATE())
      `);

    // 🧾 Insert bảng ORDER_DETAILS
    for (const it of items) {
      await transaction.request()
        .input("orderId", sql.NVarChar(100), newOrderId)
        .input("productId", sql.NVarChar(100), it.productId || 0)
        .input("productName", sql.NVarChar(255), it.name || "")
        .input("barcode", sql.NVarChar(100), it.barcode || "")
        .input("quantity", sql.Int, it.quantity || 1)
        .input("originalPrice", sql.Decimal(18, 2), it.originalPrice || 0)
        .input("salePrice", sql.Decimal(18, 2), it.salePrice || 0)
        .input("lineTotal", sql.Decimal(18, 2),
          (it.salePrice || it.price || 0) * (it.quantity || 1))
        .query(`
          INSERT INTO ORDER_DETAILS (OrderID, ProductID, ProductName, Barcode, Quantity, OriginalPrice, SalePrice, LineTotal)
          VALUES (@orderId, @productId, @productName, @barcode, @quantity, @originalPrice, @salePrice, @lineTotal)
        `);
    }

    // ✅ Commit = tất cả OK
    await transaction.commit();
    console.log(`✅ Tạo đơn hàng thành công: ${newOrderId} với ${items.length} sản phẩm.`);
    return {
      id: newOrderId,
      total,
      itemsCount: items.length,
    };

  } catch (err) {
    // ❌ Có lỗi → rollback toàn bộ
    await transaction.rollback();
    throw err;
  }
};

/**-------------------------------------------------
 🔎 Lấy thông tin đơn hàng + chi tiết đơn hàng
--------------------------------------------------*/
exports.getOrderByOrderId = async (orderId) => {
  const normalizedOrderId = String(orderId || "").trim();

  if (!normalizedOrderId) {
    return null;
  }

  const pool = await connectDB();
  const orderResult = await pool.request()
    .input("orderId", sql.NVarChar(100), normalizedOrderId)
    .query(`
      SELECT TOP 1
        CAST([OrderID] AS NVARCHAR(100)) AS OrderID,
        [UserID],
        [CustomerName],
        [CustomerPhone],
        [CustomerAddress],
        [Subtotal],
        [Discount],
        [Total],
        [Voucher],
        [PaymentMethod],
        [Status],
        [CreatedAt],
        [UpdatedAt]
      FROM ORDERS
      WHERE CAST([OrderID] AS NVARCHAR(100)) = @orderId
    `);

  const orderRow = orderResult.recordset?.[0];
  if (!orderRow) {
    return null;
  }

  const detailResult = await pool.request()
    .input("OrderId", sql.NVarChar(100), normalizedOrderId)
    .query(`
      SELECT
        CAST([ProductID] AS NVARCHAR(100)) AS ProductID,
        CAST([ProductName] AS NVARCHAR(255)) AS ProductName,
        CAST([Barcode] AS NVARCHAR(100)) AS Barcode,
        [Quantity],
        [OriginalPrice],
        [SalePrice],
        [LineTotal]
      FROM ORDER_DETAILS
      WHERE CAST([OrderID] AS NVARCHAR(100)) = @OrderId
      ORDER BY CAST([ProductName] AS NVARCHAR(255)) ASC
    `);

  return {
    id: orderRow.OrderID,
    userId: orderRow.UserID,
    shippingInfo: {
      name: orderRow.CustomerName || "",
      phone: orderRow.CustomerPhone || "",
      address: orderRow.CustomerAddress || "",
    },
    subtotal: Number(orderRow.Subtotal) || 0,
    discount: Number(orderRow.Discount) || 0,
    total: Number(orderRow.Total) || 0,
    voucher: orderRow.Voucher || "",
    paymentMethod: orderRow.PaymentMethod || "",
    status: orderRow.Status || "",
    createdAt: orderRow.CreatedAt,
    updatedAt: orderRow.UpdatedAt,
    items: (detailResult.recordset || []).map((row) => ({
      productId: row.ProductID,
      name: row.ProductName,
      barcode: row.Barcode,
      quantity: Number(row.Quantity) || 0,
      originalPrice: Number(row.OriginalPrice) || 0,
      salePrice: Number(row.SalePrice) || 0,
      price: Number(row.SalePrice || row.OriginalPrice) || 0,
      lineTotal: Number(row.LineTotal) || 0,
    })),
  };
};

/**-------------------------------------------------
 🔄 Update trạng thái đơn hàng
--------------------------------------------------*/
exports.updateBillStatus = async (orderId, newStatus) => {
  const validStatuses = ["Đang xử lý", "Chờ thanh toán", "Đã thanh toán", "Đã hủy"];

  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Trạng thái không hợp lệ`);
  }

  const pool = await connectDB();

  const result = await pool.request()
    .input("orderId", sql.NVarChar(100), orderId)
    .input("newStatus", sql.NVarChar(100), newStatus)
    .query(`
      UPDATE ORDERS
      SET Status = @newStatus,
          UpdatedAt = GETDATE()
      WHERE CAST(OrderID AS NVARCHAR(100)) = @orderId
    `);

  return {
    success: result.rowsAffected?.[0] > 0,
    message: result.rowsAffected?.[0]
      ? "Cập nhật thành công"
      : "Không tìm thấy đơn hàng",
  };
};