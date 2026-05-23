/**
 * =========================================================
 * ORDER CONTROLLER
 * =========================================================
 * Xử lý API quản lý đơn hàng admin
 *
 * Chức năng:
 * - Lấy danh sách đơn hàng
 * - Lấy chi tiết đơn hàng
 * - Format dữ liệu từ SQL Server
 * - Gom BILL + BILL_DETAIL
 * - Tính tổng tiền
 * - Chuẩn hóa dữ liệu frontend
 * =========================================================
 */

/**
 * Import các hàm query database
 */
const {
  getAllOrdersFromBill,
  getOrderDetailFromBill,
} = require("./order.model");

/**
 * =========================================================
 * Chuyển dữ liệu tiền về number
 * =========================================================
 * Ví dụ:
 * "120.000₫" -> 120000
 * null -> 0
 */
const toNumber = (value) => {
  if (value === null || value === undefined) return 0;

  const normalized = String(value).replace(/[^0-9.-]/g, "");

  const num = Number(normalized);

  return Number.isFinite(num) ? num : 0;
};

/**
 * =========================================================
 * Format tiền tệ VNĐ
 * =========================================================
 * Ví dụ:
 * 120000 -> "120.000₫"
 */
const formatMoney = (value) =>
  `${Math.round(toNumber(value)).toLocaleString("vi-VN")}₫`;

/**
 * =========================================================
 * API: GET ALL ORDERS
 * =========================================================
 * Lấy toàn bộ danh sách đơn hàng
 *
 * Flow:
 * 1. Lấy BILL + BILL_DETAIL
 * 2. Gom detail theo OrderId
 * 3. Format dữ liệu
 * 4. Trả về frontend
 * =========================================================
 */
async function handleGetOrders(req, res) {
  try {
    /**
     * Query dữ liệu từ database
     */
    const { orders = [], details = [] } =
      await getAllOrdersFromBill();

    /**
     * =====================================================
     * Gom chi tiết sản phẩm theo OrderId
     * =====================================================
     *
     * Kết quả:
     * {
     *   "HD001": [ ...items ]
     * }
     */
    const detailByOrder = details.reduce((acc, row) => {
      const orderId = String(row?.OrderId || "").trim();

      if (!orderId) return acc;

      /**
       * Số lượng sản phẩm
       */
      const qty = Number(row?.Quantity || 0) || 0;

      /**
       * Lấy đơn giá sản phẩm
       *
       * Ưu tiên:
       * - UnitPriceRaw
       *
       * Nếu không có:
       * - LineTotal / qty
       */
      const unitPrice =
        row?.UnitPriceRaw !== null &&
        row?.UnitPriceRaw !== undefined
          ? toNumber(row.UnitPriceRaw)
          : (() => {
              const line = toNumber(row?.LineTotalRaw);

              if (!line || !qty) return 0;

              return line / qty;
            })();

      /**
       * Object sản phẩm
       */
      const item = {
        name: String(row?.ProductName || "Sản phẩm"),
        qty: qty || 1,
        price: formatMoney(unitPrice),
      };

      /**
       * Nếu chưa có order thì tạo mảng
       */
      if (!acc[orderId]) acc[orderId] = [];

      /**
       * Push item vào order
       */
      acc[orderId].push(item);

      return acc;
    }, {});

    /**
     * =====================================================
     * Mapping dữ liệu đơn hàng
     * =====================================================
     */
    const data = orders.map((row) => {
      const id = String(row?.OrderId || "");

      /**
       * Danh sách sản phẩm của đơn
       */
      const items = detailByOrder[id] || [];

      /**
       * Tính tổng tiền từ detail
       */
      const detailTotal = items.reduce((sum, item) => {
        const amount = toNumber(item.price);

        return sum + amount * (Number(item.qty) || 0);
      }, 0);

      /**
       * Ưu tiên TotalRaw từ DB
       */
      const rawTotal =
        row?.TotalRaw !== null &&
        row?.TotalRaw !== undefined
          ? toNumber(row.TotalRaw)
          : detailTotal;

      /**
       * Trả dữ liệu đơn hàng
       */
      return {
        id,
        customer: String(row?.CustomerName || "Khách hàng"),
        date: String(row?.OrderDate || ""),
        total: formatMoney(rawTotal),
        status: String(row?.Status || "Đang xử lý"),
        details: items,
        address: String(row?.CustomerAddress || ""),
        phone: String(row?.CustomerPhone || ""),
      };
    });

    /**
     * Response thành công
     */
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    /**
     * Log lỗi server
     */
    console.error(
      "❌ Lỗi handleGetOrders:",
      error.message
    );

    /**
     * Response lỗi
     */
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Không thể tải dữ liệu đơn hàng từ BILL/BILL_DETAIL.",
    });
  }
}

/**
 * =========================================================
 * API: GET ORDER DETAIL
 * =========================================================
 * Lấy chi tiết 1 đơn hàng
 *
 * Flow:
 * 1. Lấy toàn bộ row theo OrderId
 * 2. Mapping detail sản phẩm
 * 3. Format dữ liệu
 * 4. Trả về frontend
 * =========================================================
 */
async function handleGetOrderDetail(req, res) {
  try {
    /**
     * Lấy orderId từ URL params
     */
    const { orderId } = req.params;

    /**
     * Query database
     */
    const rows = await getOrderDetailFromBill(orderId);

    /**
     * Dòng đầu tiên chứa thông tin đơn
     */
    const row = rows[0];

    /**
     * Không tìm thấy đơn
     */
    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng.",
      });
    }

    /**
     * =====================================================
     * Mapping chi tiết sản phẩm
     * =====================================================
     */
    const details = rows
      /**
       * Chỉ giữ row có sản phẩm
       */
      .filter(
        (item) =>
          item?.ProductName || item?.Quantity
      )

      /**
       * Mapping dữ liệu frontend
       */
      .map((detailRow) => {
        const qty =
          Number(detailRow?.Quantity || 0) || 0;

        /**
         * Tính đơn giá
         */
        const unitPrice =
          detailRow?.UnitPriceRaw !== null &&
          detailRow?.UnitPriceRaw !== undefined
            ? toNumber(detailRow.UnitPriceRaw)
            : (() => {
                const line = toNumber(
                  detailRow?.LineTotalRaw
                );

                if (!line || !qty) return 0;

                return line / qty;
              })();

        return {
          /**
           * Thông tin sản phẩm
           */
          id: String(detailRow?.ProductID || ""),
          name: String(
            detailRow?.ProductName || "Sản phẩm"
          ),

          /**
           * Số lượng
           */
          qty: qty || 1,

          /**
           * Giá
           */
          price: formatMoney(unitPrice),

          /**
           * Giá gốc
           */
          originalPrice: formatMoney(
            detailRow?.OriginalPriceRaw || 0
          ),

          /**
           * Giá sale
           */
          salePrice: formatMoney(
            detailRow?.SalePriceRaw || 0
          ),

          /**
           * Thành tiền
           */
          lineTotal: formatMoney(
            detailRow?.LineTotalRaw || 0
          ),

          /**
           * Raw number
           */
          originalPriceRaw:
            Number(
              detailRow?.OriginalPriceRaw || 0
            ) || 0,

          salePriceRaw:
            Number(detailRow?.SalePriceRaw || 0) || 0,

          lineTotalRaw:
            Number(detailRow?.LineTotalRaw || 0) || 0,

          /**
           * Ảnh sản phẩm
           */
          image: detailRow?.ProductImage || "",

          /**
           * Thông tin xuất kho
           */
          batchId:
            detailRow?.DeductBatchID || null,

          barcode:
            detailRow?.DeductBarcode || "",

          deductedQty:
            Number(detailRow?.DeductedQty || 0) || 0,

          expiryDate:
            detailRow?.DeductExpiryDate
              ? String(detailRow.DeductExpiryDate)
              : "",
        };
      });

    /**
     * Tính tổng tiền
     */
    const detailTotal = details.reduce(
      (sum, item) => {
        const amount = toNumber(item.price);

        return (
          sum +
          amount * (Number(item.qty) || 0)
        );
      },
      0
    );

    /**
     * Ưu tiên TotalRaw
     */
    const rawTotal =
      row?.TotalRaw !== null &&
      row?.TotalRaw !== undefined
        ? toNumber(row.TotalRaw)
        : detailTotal;

    /**
     * Response thành công
     */
    return res.json({
      success: true,

      data: {
        id: String(row?.OrderId || ""),

        customer: String(
          row?.CustomerName || "Khách hàng"
        ),

        date: String(row?.OrderDate || ""),

        total: formatMoney(rawTotal),

        status: String(
          row?.Status || "Đang xử lý"
        ),

        details,

        address: String(
          row?.CustomerAddress || ""
        ),

        phone: String(
          row?.CustomerPhone || ""
        ),
      },
    });
  } catch (error) {
    /**
     * Log lỗi
     */
    console.error(
      "❌ Lỗi handleGetOrderDetail:",
      error.message
    );

    /**
     * Response lỗi
     */
    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Không thể tải chi tiết đơn hàng.",
    });
  }
}

/**
 * =========================================================
 * Export controller
 * =========================================================
 */
module.exports = {
  handleGetOrders,
  handleGetOrderDetail,
};