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

const pickCustomerKeyColumn = async (transaction) => {
  const columnRes = await transaction.request().query(`
    SELECT C.name AS ColumnName
    FROM sys.columns C
    INNER JOIN sys.objects O ON O.object_id = C.object_id
    WHERE O.type = 'U' AND O.name = N'CUSTOMER'
  `);

  const columns = (columnRes.recordset || []).map((r) => String(r.ColumnName || "").toLowerCase());
  if (columns.includes("email")) return "Email";
  if (columns.includes("id")) return "Id";
  return null;
};

// Tạo hồ sơ khách hàng nếu đơn hàng đã thanh toán
const ensureCustomerProfileForPaidOrder = async (transaction, orderRow) => {
  const userId = String(orderRow?.UserID || "").trim();
  if (!userId) return false;
  // ✅ Kiểm tra nếu đã tồn tại profile khách hàng liên kết với userId này rồi thì không tạo nữa
  const accountRes = await transaction.request()
    .input("userId", sql.NVarChar(100), userId)
    .query(`
      SELECT TOP 1 Email, DisplayName, Role
      FROM ACCOUNT
      WHERE CAST(Email AS NVARCHAR(100)) = @userId
    `);

  const account = accountRes.recordset?.[0];
  if (!account) return false;
  // Chỉ tạo profile nếu role là khách hàng (0), 
  // tránh tạo nhầm cho admin/staff nếu có đơn hàng do lỗi hệ thống hoặc tấn công giả mạo
  if (Number(account.Role) !== 0) return false;

  const customerKeyCol = await pickCustomerKeyColumn(transaction);
  if (!customerKeyCol) return false;
  // Kiểm tra nếu đã tồn tại profile liên kết với userId này rồi thì không tạo nữa
  const existsRes = await transaction.request()
    .input("userId", sql.NVarChar(100), userId)
    .query(`
      SELECT TOP 1 1 AS Found
      FROM CUSTOMER
      WHERE CAST([${customerKeyCol}] AS NVARCHAR(100)) = @userId
    `);

  if (existsRes.recordset?.length > 0) {
    return false;
  }

  const profileName = String(orderRow?.CustomerName || account.DisplayName || userId).trim();
  const profilePhone = String(orderRow?.CustomerPhone || "").trim();
  const profileAddress = String(orderRow?.CustomerAddress || "").trim();

  await transaction.request()
    .input("customerName", sql.NVarChar(255), profileName)
    .input("userId", sql.NVarChar(100), userId)
    .input("customerPhone", sql.NVarChar(50), profilePhone || null)
    .input("customerAddress", sql.NVarChar(500), profileAddress || null)
    .query(`
      INSERT INTO CUSTOMER (Name, [${customerKeyCol}], Phone, Address, isActive)
      VALUES (@customerName, @userId, @customerPhone, @customerAddress, 1)
    `);

  return true;
};

const recordVoucherClaimForPaidOrder = async (
  transaction,
  orderRow,
  orderId,
  note = "",
) => {
  const voucherCode = String(orderRow?.Voucher || "").trim();
  const normalizedOrderId = String(orderId || orderRow?.OrderID || "").trim();
  if (!voucherCode || !normalizedOrderId) return false;

  const userId = String(orderRow?.UserID || "").trim() || null;

  const existsRes = await transaction
    .request()
    .input("orderId", sql.NVarChar(128), normalizedOrderId)
    .query(`
      SELECT TOP 1 ClaimID
      FROM VOUCHER_CLAIMS
      WHERE CAST(OrderID AS NVARCHAR(128)) = @orderId
    `);

  if (existsRes.recordset?.length > 0) {
    return false;
  }

  await transaction
    .request()
    .input("voucherCode", sql.NVarChar(128), voucherCode)
    .input("userId", sql.NVarChar(256), userId)
    .input("orderId", sql.NVarChar(128), normalizedOrderId)
    .input("claimAt", sql.Date, new Date())
    .input("note", sql.NVarChar(500), note || null)
    .query(`
      INSERT INTO VOUCHER_CLAIMS (VoucherCode, UserID, OrderID, ClaimAt, Note)
      VALUES (@voucherCode, @userId, @orderId, @claimAt, @note)
    `);

  return true;
};

/**-------------------------------------------------
 🧹 Xóa các đơn hàng có trạng thái "Chờ thanh toán" 
 mà quá 10p chưa chuyển trạng thái "Đã thanh toán"
--------------------------------------------------*/
exports.cleanupExpiredPendingOrders = async (minutes = 10) => {
  const pool = await connectDB();
  const transaction = pool.transaction();

  try {
    await transaction.begin();

    // 🔍 Get expired orders with index-friendly query
    // ⚡ Using datetime comparison for better index utilization
    const expiredResult = await transaction
      .request()
      .input("minutes", sql.Int, Number(minutes) || 10).query(`
        SELECT TOP (10000) [OrderID]
        FROM ORDERS WITH (NOLOCK)
        WHERE [Status] = N'Chờ thanh toán'
          AND [CreatedAt] <= DATEADD(MINUTE, -@minutes, GETDATE())
        ORDER BY [CreatedAt] ASC
      `);

    const expiredOrders = (expiredResult.recordset || []).map((row) =>
      String(row.OrderID),
    );

    // ❌ No expired orders found
    if (expiredOrders.length === 0) {
      await transaction.commit();
      return { deletedOrders: 0, deletedDetails: 0 };
    }

    const deleteReq = transaction.request();
    const orderParams = [];

    // 📌 Build dynamic params (reuse for both queries)
    expiredOrders.forEach((orderId, index) => {
      const paramName = `orderId${index}`;
      deleteReq.input(paramName, sql.NVarChar(100), orderId);
      orderParams.push(`@${paramName}`);
    });

    // 🧨 Delete order details first (foreign key constraint)
    const deleteDetailsResult = await deleteReq.query(`
      DELETE FROM ORDER_DETAILS WITH (ROWLOCK)
      WHERE [OrderID] IN (${orderParams.join(",")})
    `);

    // 🧨 Delete orders
    const deleteOrdersResult = await deleteReq.query(`
      DELETE FROM ORDERS WITH (ROWLOCK)
      WHERE [OrderID] IN (${orderParams.join(",")})
    `);

    await transaction.commit();

    return {
      deletedOrders: deleteOrdersResult.rowsAffected?.[0] || 0,
      deletedDetails: deleteDetailsResult.rowsAffected?.[0] || 0,
    };
  } catch (err) {
    try {
      await transaction.rollback();
    } catch (rollbackErr) {
      console.error("❌ Rollback error:", rollbackErr.message);
    }
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
    const exists = await pool
      .request()
      .input("orderId", sql.NVarChar(100), candidate).query(`
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
 🧾 Kiểm tra người dùng đã dùng voucher chưa
  - Nếu bảng VOUCHER_CLAIMS có bản ghi với (VoucherCode, UserID) => đã dùng
  - Trả về true/false
--------------------------------------------------*/
exports.hasUserUsedVoucher = async (userId, voucherCode) => {
  if (!userId || !voucherCode) return false;

  const pool = await connectDB();
  const normalizedCode = String(voucherCode || "").trim();
  const normalizedUser = String(userId || "").trim();

  const res = await pool.request()
    .input("voucherCode", sql.NVarChar(128), normalizedCode)
    .input("userId", sql.NVarChar(256), normalizedUser)
    .query(`
      SELECT TOP 1 1 AS Found
      FROM VOUCHER_CLAIMS WITH (NOLOCK)
      WHERE CAST(VoucherCode AS NVARCHAR(128)) = @voucherCode
        AND CAST(UserID AS NVARCHAR(256)) = @userId
    `);

  return Array.isArray(res.recordset) && res.recordset.length > 0;
};

/**-------------------------------------------------
 📦 TRỪ KHO HÀNG TỪ BATCH_DETAIL KHI TẠO ĐƠN HÀNG
 💡 Ưu tiên: isActive=1, rồi hạn sử dụng gần nhất (sắp hết hạn)
--------------------------------------------------*/
const deductInventoryFromBatch = async (
  transaction,
  orderId,
  productId,
  quantity,
) => {
  try {
    // 🔎 Kiểm tra trạng thái đơn hàng trong DB trước khi trừ kho
    const orderStatusResult = await transaction
      .request()
      .input("orderId", sql.NVarChar(100), String(orderId || "").trim()).query(`
        SELECT TOP 1 [Status], [PaymentMethod]
        FROM ORDERS WITH (UPDLOCK, ROWLOCK)
        WHERE CAST([OrderID] AS NVARCHAR(100)) = @orderId
      `);

    const persistedOrder = orderStatusResult.recordset?.[0];
    const persistedStatus = String(persistedOrder?.Status || "").trim();
    const persistedPaymentMethod = String(persistedOrder?.PaymentMethod || "").trim().toUpperCase();

    const canDeductNow =
      persistedPaymentMethod === "COD" ||
      persistedStatus.toLowerCase() === "đã thanh toán";

    if (!canDeductNow) {
      throw new Error(
        `== Đơn hàng ${orderId} chưa đủ điều kiện trừ kho (status="${persistedStatus}", paymentMethod="${persistedPaymentMethod}==")`,
      );
    }

    // Chuẩn hóa dữ liệu đầu vào
    // Tạo biến lưu số lượng còn phải trừ ban đầu
    let remainingQty = Number(quantity || 0);
    // 📋 Mảng lưu chi tiết trừ kho (có thể dùng để trả về hoặc log)
    const deductions = [];

    // 🔁1.  Sử dụng vòng lặp đến khi nào số lượng 1
    //  sản phẩm trong đơn hàng bằng 0
    while (remainingQty > 0) {
      // 🔎 Tìm lô tiếp theo để trừ theo tiêu chí:
      //    1. ProductId khớp
      //    2. Quantity > 0 (còn hàng)
      //    3. isActive = 1 hoặc NULL (lô đang hoạt động)
      //    4. Sắp xếp: hạn sử dụng sớm nhất (ExpiryDate NOT NULL trước, rồi ASC)
      //               → nếu không có hạn thì bỏ xuống cuối
      //               → sau đó FIFO (Id ASC, lô cũ nhất trước)
      const findBatchSql = `
        SELECT TOP 1 
          BD.[Id],
          BD.[BatchId],
          BC.[ProductID] AS [ProductId],
          BC.[Barcode],
          BD.[Quantity],
          BC.[ExpiryDate],
          BC.[IsActive]
        FROM BATCH_DETAIL BD
        INNER JOIN BARCODE BC ON BC.id_batch_detail = BD.Id
        LEFT JOIN BATCHES B ON B.ID = BD.BatchId
        WHERE BC.[ProductID] = @ProductId
          AND BD.[Quantity] > 0
          AND (BC.[IsActive] = 1 OR BC.[IsActive] IS NULL)
          AND (B.IsActive = 1 OR B.IsActive IS NULL)
        ORDER BY 
          CASE WHEN BC.[ExpiryDate] IS NOT NULL THEN 0 ELSE 1 END ASC,
          BC.[ExpiryDate] ASC,
          BD.[Id] ASC
      `;

      const batchResult = await transaction
        .request()
        .input("ProductId", sql.NVarChar(100), productId)
        .query(findBatchSql);

      const batch = batchResult.recordset?.[0];
      console.log(
        `🔍 Tìm lô cho sản phẩm ${productId}:`,
        batch
          ? `#${batch.Id} (qty: ${batch.Quantity})`
          : "Không tìm thấy lô nào",
      );
      // ❌ Không tìm thấy lô nào → kết thúc vòng lặp (có thể kho không đủ)
      if (!batch) {
        console.warn(
          `⚠️ Sản phẩm ${productId}: không đủ hàng (cần ${remainingQty})`,
        );
        break;
      }

      // 📦 Lấy thông tin lô
      const currentQty = Number(batch.Quantity || 0);
      // `Id` là khoá nội bộ (PK) của BATCH_DETAIL, dùng để cập nhật quantity.
      const batchRowId = batch.Id;
      // `BatchId` là mã lô (mã hiển thị), lưu vào ORDER_INVENTORY_DEDUCTION.
      const batchId = batch.BatchId || null;
      const expiryDate = batch.ExpiryDate || null;
      const barcode = batch.Barcode || "";

      // 🔻 Tính số lượng trừ từ lô này: MIN(số cần, số có sẵn)
      const deductQty = Math.min(remainingQty, currentQty);
      const newQty = currentQty - deductQty;

      // 📝 Cập nhật số lượng còn lại trong BATCH_DETAIL
      const updateResult = await transaction
        .request()
        .input("Id", sql.Int, batchRowId)
        .input("NewQuantity", sql.Int, newQty).query(`
          UPDATE BATCH_DETAIL
          SET [Quantity] = @NewQuantity
          WHERE [Id] = @Id
        `);

      // ✅ Nếu cập nhật thành công → ghi log và lưu vào bảng audit
      if (updateResult.rowsAffected?.[0] > 0) {
        // 📋 Log chi tiết trừ kho (để debug/audit)
        const expiryInfo = expiryDate
          ? ` (hạn: ${new Date(expiryDate).toLocaleDateString("vi-VN")})`
          : "";
        const barcodeInfo = barcode ? ` [${barcode}]` : "";
        console.log(
          `✅ Trừ kho: ${productId}${barcodeInfo} lô #${batchId}${expiryInfo} (-${deductQty}, còn ${newQty})`,
        );

        // 📊 Cập nhật số lượng còn cần trừ
        remainingQty -= deductQty;

        // 💾 GHI CHI TIẾT TRỪ KHO vào bảng ORDER_INVENTORY_DEDUCTION để audit/theo dõi
        try {
          await transaction
            .request()
            .input("OrderID", sql.NVarChar(100), String(orderId || ""))
            .input("ProductID", sql.NVarChar(100), String(productId || ""))
            // Lưu `BatchId` (mã lô) thay vì khoá nội bộ Id.
            .input("BatchID", sql.NVarChar(100), batchId || null)
            .input("Barcode", sql.NVarChar(100), barcode || null)
            .input("DeductedQty", sql.Int, deductQty)
            .input("ExpiryDate", sql.DateTime, expiryDate || null).query(`
              INSERT INTO ORDER_INVENTORY_DEDUCTION (OrderID, ProductID, BatchID, Barcode, DeductedQty, ExpiryDate)
              VALUES (@OrderID, @ProductID, @BatchID, @Barcode, @DeductedQty, @ExpiryDate)
            `);

          // 📌 Thêm vào danh sách trả về (tuỳ chọn: có thể dùng cho response hoặc log)
          deductions.push({ batchId, barcode, deductQty, expiryDate });
        } catch (insErr) {
          // ⚠️ Nếu ghi chi tiết thất bại → chỉ log cảnh báo (không throw để không rollback transaction)
          console.error(
            `❌ Không lưu được thông tin trừ kho cho order ${orderId}, batch ${batchId}:`,
            insErr.message,
          );
        }
      } else {
        // ❌ Cập nhật BATCH_DETAIL thất bại → log cảnh báo và kết thúc
        console.warn(
          `⚠️ Không cập nhật được batch #${batchId} của ${productId}`,
        );
        break;
      }
    }

    // 🚨 Nếu sau khi lặp còn số lượng cần trừ → kho không đủ
    if (remainingQty > 0) {
      console.warn(
        `⚠️ Cảnh báo: Sản phẩm ${productId} - kho không đủ (thiếu ${remainingQty})`,
      );
    }

    // 📤 Trả về danh sách chi tiết trừ kho (có thể dùng cho admin/report hoặc logging)
    return deductions;
  } catch (err) {
    console.error(`❌ Lỗi trừ kho cho ${productId}:`, err.message);
    throw err;
  }
};

/**-------------------------------------------------
 📦 Thêm dữ liệu vào bảng ORDERS + ORDER_DETAILS
 💡 Trừ kho CHỈ khi thanh toán thành công (status = "Đã thanh toán")
--------------------------------------------------*/
exports.insertBillAndDetails = async (orderData) => {
  console.log("🚀 -----------------Đang tạo đơn hàng-------------------");
  console.log("Trạng thái đơn hàng:", orderData.status);
  const {
    userId,
    items = [],
    shippingInfo = {},
    total = 0,
    subtotal = 0,
    discount = 0,
    voucher = "",
    paymentMethod = "COD",
    status = "Chờ thanh toán",
  } = orderData;

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
      .input("status", sql.NVarChar(100), status).query(`
        INSERT INTO ORDERS (OrderID, UserID, CustomerName, CustomerPhone, CustomerAddress, Subtotal, Discount, Total, Voucher, PaymentMethod, Status, CreatedAt, UpdatedAt)
        VALUES (@orderId, @userId, @customerName, @customerPhone, @customerAddress, @subtotal, @discount, @total, @voucher, @paymentMethod, @status, GETDATE(), GETDATE())
      `);

    // 🧾 Insert bảng ORDER_DETAILS + 📦 Trừ kho (nếu thanh toán thành công)

    const lowerStatus = String(status || "").toLowerCase();
    // 💡 Chỉ trừ kho khi status chứa "Thanh toán" hoặc "Đã thanh toán" (thanh toán thành công)
    // ✅ Status thành công: "Thanh Toán COD", "Đã thanh toán", "Đã Thanh Toán"
    // ❌ Status chưa thành công: "Chờ thanh toán", "Đang xử lý"
    const shouldDeductInventory =
      lowerStatus.includes("đã") ||
      (lowerStatus.includes("thanh toán") && !lowerStatus.includes("chờ"));

    for (const it of items) {
      const qty = Number(it.quantity || 1);
      const originalPriceVal = Number(
        (it.originalPrice ?? it.originPrice ?? it.price) || 0,
      );
      const salePriceVal = Number(
        (it.salePrice ?? it.sale_price ?? it.price) || 0,
      );
      const lineTotalVal = Number(
        (salePriceVal || originalPriceVal) * qty || 0,
      );

      await transaction
        .request()
        .input("orderId", sql.NVarChar(100), newOrderId)
        .input("productId", sql.NVarChar(100), it.productId || 0)
        .input("quantity", sql.Int, qty)
        .input("originalPrice", sql.Decimal(18, 2), originalPriceVal)
        .input("salePrice", sql.Decimal(18, 2), salePriceVal)
        .input("lineTotal", sql.Decimal(18, 2), lineTotalVal).query(`
          INSERT INTO ORDER_DETAILS (OrderID, ProductID,  Quantity, OriginalPrice, SalePrice, LineTotal)
          VALUES (@orderId, @productId,   @quantity, @originalPrice, @salePrice, @lineTotal)
        `);

      // 📦 Trừ kho CHỈ nếu thanh toán thành công (COD hoặc webhook thanh toán)
      const productId = String(it.productId || "").trim();
      if (productId && qty > 0 && shouldDeductInventory) {
        console.log(
          `=> 📦 Trừ kho cho sản phẩm ${productId} vì status="${status}" là thanh toán thành công`,
        );
        await deductInventoryFromBatch(transaction, newOrderId, productId, qty);
      } else if (productId && qty > 0 && !shouldDeductInventory) {
        console.log(
          `=> ⏸️ Chưa trừ kho cho sản phẩm ${productId} vì status="${status}" là chưa thanh toán`,
        );
      }
    }

    // ✅ Commit = tất cả OK
    // Nếu đơn hàng ở trạng thái đã thanh toán khi tạo (ví dụ: Thanh Toán COD),
    // tạo hồ sơ CUSTOMER ngay trong cùng transaction để tránh trường hợp
    // không có callback sau khi tạo đơn (COD thay đổi trạng thái ngay lúc tạo).
    if (shouldDeductInventory) {
      try {
        const orderRowForEnsure = {
          UserID: userId,
          Voucher: voucher,
          CustomerName: shippingInfo.name || "",
          CustomerPhone: shippingInfo.phone || "",
          CustomerAddress: shippingInfo.address || "",
        };
        await ensureCustomerProfileForPaidOrder(transaction, orderRowForEnsure);
        await recordVoucherClaimForPaidOrder(
          transaction,
          { ...orderRowForEnsure, OrderID: newOrderId },
          newOrderId,
          `Thanh toán thành công (${paymentMethod})`,
        );
      } catch (ensureErr) {
        console.warn("Không tạo được hồ sơ khách hàng tự động:", ensureErr.message);
      }
    }

    await transaction.commit();
    console.log(
      `  == ✅ Tạo đơn hàng: ${newOrderId} thành công. ==`,
    );
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
  // Đảm bảo orderId là string và trim để tránh lỗi query
  const normalizedOrderId = String(orderId || "").trim();
  // Nếu orderId không hợp lệ sau khi chuẩn hóa, trả về null
  if (!normalizedOrderId) {
    return null;
  }

  // 1. Kết nối DB và query thông tin đơn hàng
  const pool = await connectDB();
  const orderResult = await pool
    .request()
    .input("orderId", sql.NVarChar(100), normalizedOrderId).query(`
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

  // Nếu không tìm thấy đơn hàng, trả về null
  const orderRow = orderResult.recordset?.[0];
  if (!orderRow) {
    return null;
  }
  // 2. Query chi tiết đơn hàng từ ORDER_DETAILS + JOIN PRODUCT để lấy tên và ảnh
  const detailResult = await pool
    .request()
    .input("OrderId", sql.NVarChar(100), normalizedOrderId).query(`
      SELECT
        CAST([od].[ProductID] AS NVARCHAR(100)) AS ProductID,
        [od].[Quantity],
        [od].[OriginalPrice],
        [od].[SalePrice],
        [od].[LineTotal],
        [p].[ProductName],
        [p].[Image]
      FROM ORDER_DETAILS [od]
      LEFT JOIN PRODUCT [p] ON CAST([od].[ProductID] AS NVARCHAR(100)) = CAST([p].[ProductID] AS NVARCHAR(100))
      WHERE CAST([od].[OrderID] AS NVARCHAR(100)) = @OrderId
    `);

  // ✅ Kiểm tra chi tiết đơn hàng có tồn tại và không rỗng
  if (
    !Array.isArray(detailResult?.recordset) ||
    detailResult.recordset.length === 0
  ) {
    // Nếu đơn hàng tồn tại nhưng không có chi tiết, có thể do lỗi dữ liệu.
    // Cảnh báo và trả về thông tin đơn hàng cơ bản.
    throw new Error(
      `❌ Chi tiết đơn hàng ${orderId} không tồn tại hoặc không có items`,
    );
  }

  // 3. Trả về thông tin đơn hàng + chi tiết
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
    items: detailResult.recordset.map((row) => ({
      productId: row.ProductID,
      productName: row.ProductName || "",
      image: row.Image || "",
      quantity: Number(row.Quantity) || 0,
      originalPrice: Number(row.OriginalPrice) || 0,
      salePrice: Number(row.SalePrice) || 0,
      price: Number(row.SalePrice || row.OriginalPrice) || 0,
      lineTotal: Number(row.LineTotal) || 0,
    })),
  };
};

/**-------------------------------------------------
 🧾 Lấy danh sách đơn hàng của một người dùng (không bao gồm chi tiết item)
--------------------------------------------------*/
exports.getOrdersByUserId = async (userId) => {
  const pool = await connectDB();
  const safeUserId = String(userId || "").trim();
  if (!safeUserId) return [];

  const result = await pool
    .request()
    .input("userId", sql.NVarChar(100), safeUserId).query(`
      SELECT
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
      WHERE CAST([UserID] AS NVARCHAR(100)) = @userId
      ORDER BY [CreatedAt] DESC
    `);

  const rows = result.recordset || [];
  return rows.map((r) => ({
    id: String(r.OrderID || ""),
    userId: r.UserID,
    shippingInfo: {
      name: r.CustomerName || "",
      phone: r.CustomerPhone || "",
      address: r.CustomerAddress || "",
    },
    subtotal: Number(r.Subtotal) || 0,
    discount: Number(r.Discount) || 0,
    total: Number(r.Total) || 0,
    voucher: r.Voucher || "",
    paymentMethod: r.PaymentMethod || "",
    status: r.Status || "",
    createdAt: r.CreatedAt,
    updatedAt: r.UpdatedAt,
  }));
};

/**-------------------------------------------------
 🔄 Update trạng thái đơn hàng khi thanh toán thành công
 - Cập nhật trạng thái từ "Chờ thanh toán" → "Đã thanh toán"
 - Trừ kho hàng nếu chuyển sang "Đã thanh toán" lần đầu
--------------------------------------------------*/
exports.updateBillStatus = async (orderId, newStatus) => {
  console.log(`🚀 Cập nhật trạng thái đơn hàng ${orderId} → ${newStatus}`);
  const validStatuses = [
    "Đang xử lý",
    "Chờ thanh toán",
    "Đã thanh toán",
    "Thanh toán COD",
    "Đã hủy",
  ];
  //  Kiểm tra status gửi của đơn hàng gửi lên có thuộc trong danh sách ko
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Trạng thái không hợp lệ`);
  }
  const pool = await connectDB();
  const transaction = pool.transaction();
  await transaction.begin();

  try {
    // 🔍 Lấy đơn hàng với khóa cập nhật (
    const orderResult = await transaction
      .request()

      // 1. Lấy trạng thái đơn hàng hiện tại
      .input("orderId", sql.NVarChar(100), orderId).query(`
        SELECT TOP 1 OrderID, Status, UserID, Voucher, CustomerName, CustomerPhone, CustomerAddress
        FROM ORDERS WITH (UPDLOCK, ROWLOCK)
        WHERE CAST(OrderID AS NVARCHAR(100)) = @orderId
      `);

    const currentOrder = orderResult.recordset?.[0];
    // Nếu không tìm thấy đơn hàng, trả về lỗi
    if (!currentOrder) {
      await transaction.commit();
      return {
        success: false,
        message: "Không tìm thấy đơn hàng",
      };
    }
    // Trạng thái hiện tại
    const currentStatus = String(currentOrder.Status || "").trim();
    let deductedItems = 0;
    let customerProfileCreated = false;

    const isPaidStatus = (st) => {
      const s = String(st || "").toLowerCase();
      if (!s) return false;
      // Explicit 'Đã thanh toán'
      if (s.includes("đã thanh toán")) return true;
      // Cases like 'Thanh Toán COD' or any 'thanh toán' with 'cod'
      if (s.includes("thanh toán") && s.includes("cod")) return true;
      // Generic: if contains both 'thanh toán' and not 'chờ'
      if (s.includes("thanh toán") && !s.includes("chờ")) return true;
      return false;
    };

    // 2. Nếu trạng thái đã là "Đã thanh toán"
    // và vẫn nhận được yêu cầu markPaid,
    // trả về thông tin đã thanh toán mà không trừ kho thêm lần nữa
    // Đồng thời thêm hồ sơ khách hàng nếu chưa có
    if (isPaidStatus(currentStatus) && isPaidStatus(newStatus)) {
      customerProfileCreated = await ensureCustomerProfileForPaidOrder(transaction, currentOrder);
      await recordVoucherClaimForPaidOrder(transaction, currentOrder, orderId, "Đơn hàng đã ở trạng thái thanh toán thành công");
      await transaction.commit();
      return {
        success: true,
        message: "Đã thanh toán",
        deductedItems,
        customerProfileCreated,
      };
    }

    // 3. Nếu trạng thái của đơn hàng là "Chờ thanh toán"
    // và yêu cầu chuyển sang "Đã thanh toán",
    // thực hiện cập nhật trạng thái và trừ kho hàng
    if (newStatus === "Đã thanh toán" && currentStatus === "Chờ thanh toán") {
      const detailResult = await transaction
        .request()

        // Lấy chi tiết đơn hàng để biết sản phẩm nào, số lượng bao nhiêu để trừ kho
        .input("orderId", sql.NVarChar(100), orderId).query(`
          SELECT ProductID, Quantity
          FROM ORDER_DETAILS
          WHERE CAST(OrderID AS NVARCHAR(100)) = @orderId
        `);

      // ✅ Kiểm tra chi tiết đơn hàng có tồn tại và không rỗng
      if (
        !Array.isArray(detailResult?.recordset) ||
        detailResult.recordset.length === 0
      ) {
        throw new Error(
          `Chi tiết đơn hàng ${orderId} không tồn tại hoặc không có items`,
        );
      }

      // ✅ Cập nhật trạng thái sang "Đã thanh toán" trước khi trừ kho
      // để deductInventoryFromBatch đọc được trạng thái hợp lệ ngay trong cùng transaction.
      await transaction
        .request()
        .input("orderId", sql.NVarChar(100), orderId)
        .input("newStatus", sql.NVarChar(100), newStatus).query(`
          UPDATE ORDERS
          SET Status = @newStatus,
              UpdatedAt = GETDATE()
          WHERE CAST(OrderID AS NVARCHAR(100)) = @orderId
        `);

      // 4. Trừ kho hàng cho từng sản phẩm trong đơn hàng
      const details = detailResult.recordset;
      // Lặp qua từng sản phẩm trong đơn hàng để trừ kho
      for (const line of details) {
        const productId = String(line.ProductID || "").trim();
        const qty = Number(line.Quantity || 0);

        // Chỉ xử lý nếu productId tồn tại và số lượng > 0
        if (productId && qty > 0) {
          // 5. Kiểm tra tồn tại của sản phẩm trước khi trừ kho
          const productExists = await transaction
            .request()
            .input("productId", sql.NVarChar(100), productId).query(`
              SELECT TOP 1 ProductID
              FROM PRODUCT
              WHERE CAST(ProductID AS NVARCHAR(100)) = @productId
            `);
          console.log(
            `🔍 Kiểm tra tồn tại sản phẩm ${productId}:`,
            productExists.recordset?.[0] ? "Tồn tại" : "Không tồn tại",
          );
          // Nếu sản phẩm không tồn tại, cảnh báo và skip trừ kho cho sản phẩm này
          if (
            !productExists.recordset ||
            productExists.recordset.length === 0
          ) {
            console.warn(
              `⚠️ Cảnh báo: ProductID ${productId} không tồn tại trong PRODUCTS`,
            );
            continue; // Skip sản phẩm này, không trừ kho
          }
          // Trừ kho cho sản phẩm này
          await deductInventoryFromBatch(transaction, orderId, productId, qty);
          deductedItems += 1;
        }
      }
    }

    const updateResult = await transaction
      .request()
      .input("orderId", sql.NVarChar(100), orderId)
      .input("newStatus", sql.NVarChar(100), newStatus).query(`
        UPDATE ORDERS
        SET Status = @newStatus,
            UpdatedAt = GETDATE()
        WHERE CAST(OrderID AS NVARCHAR(100)) = @orderId
      `);

    if (isPaidStatus(newStatus)) {
      customerProfileCreated = await ensureCustomerProfileForPaidOrder(transaction, currentOrder);
      await recordVoucherClaimForPaidOrder(transaction, currentOrder, orderId, `Thanh toán thành công (${newStatus})`);
    }

    await transaction.commit();

    return {
      success: updateResult.rowsAffected?.[0] > 0,
      message: updateResult.rowsAffected?.[0]
        ? "Cập nhật thành công"
        : "Không tìm thấy đơn hàng",
      deductedItems,
      customerProfileCreated,
      alreadyPaid: isPaidStatus(currentStatus) && isPaidStatus(newStatus),
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};
