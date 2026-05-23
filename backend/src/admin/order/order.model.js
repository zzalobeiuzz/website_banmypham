/**
 * =========================================================
 * ORDER MODEL
 * =========================================================
 * File này chịu trách nhiệm:
 * - Kết nối database
 * - Query dữ liệu đơn hàng
 * - Query chi tiết đơn hàng
 * - Trả dữ liệu về cho controller xử lý
 */

const { connectDB } = require("../../config/connect");
const sql = require("mssql");

/**
 * =========================================================
 * TÊN BẢNG
 * =========================================================
 * Tách riêng để dễ sửa đổi sau này
 */
const ORDERS_TABLE = "ORDERS";
const ORDER_DETAILS_TABLE = "ORDER_DETAILS";

/**
 * =========================================================
 * LẤY TOÀN BỘ DANH SÁCH ĐƠN HÀNG
 * =========================================================
 * Bao gồm:
 * - Thông tin cơ bản của đơn hàng
 * - Danh sách sản phẩm trong từng đơn
 */
const getAllOrdersFromBill = async () => {

  /**
   * Kết nối SQL Server
   */
  const pool = await connectDB();

  /**
   * =========================================================
   * QUERY LẤY DANH SÁCH ĐƠN HÀNG
   * =========================================================
   */
  const ordersSql = `
    SELECT
      -- Mã đơn hàng
      CAST(O.[OrderID] AS NVARCHAR(100)) AS OrderId,

      -- Tên khách hàng
      CAST(O.[CustomerName] AS NVARCHAR(255)) AS CustomerName,

      -- Số điện thoại
      CAST(O.[CustomerPhone] AS NVARCHAR(50)) AS CustomerPhone,

      -- Địa chỉ giao hàng
      CAST(O.[CustomerAddress] AS NVARCHAR(500)) AS CustomerAddress,

      -- Trạng thái đơn hàng
      CAST(O.[Status] AS NVARCHAR(100)) AS Status,

      -- Ngày đặt hàng (yyyy-mm-dd)
      CONVERT(VARCHAR(10), TRY_CAST(O.[CreatedAt] AS DATETIME), 23) AS OrderDate,

      -- Tổng tiền gốc
      CAST(O.[Total] AS DECIMAL(18,2)) AS TotalRaw

    FROM ${ORDERS_TABLE} O

    -- Sắp xếp đơn mới nhất lên đầu
    ORDER BY TRY_CAST(O.[CreatedAt] AS DATETIME) DESC, O.[OrderID] DESC
  `;

  /**
   * =========================================================
   * QUERY LẤY CHI TIẾT SẢN PHẨM TRONG ĐƠN
   * =========================================================
   */
  const detailSql = `
    SELECT

      -- Mã đơn hàng
      CAST(D.[OrderID] AS NVARCHAR(100)) AS OrderId,

      -- Tên sản phẩm
      CAST(COALESCE(P.[ProductName], N'Sản phẩm') AS NVARCHAR(255)) AS ProductName,

      -- Số lượng
      TRY_CAST(D.[Quantity] AS INT) AS Quantity,

      -- Giá bán ưu tiên SalePrice
      CAST(COALESCE(D.[SalePrice], D.[OriginalPrice]) AS DECIMAL(18,2)) AS UnitPriceRaw,

      -- Thành tiền
      CAST(D.[LineTotal] AS DECIMAL(18,2)) AS LineTotalRaw

    FROM ${ORDER_DETAILS_TABLE} D

    /**
     * JOIN bảng PRODUCT để lấy tên sản phẩm
     */
    LEFT JOIN PRODUCT P
      ON CAST(P.[ProductID] AS NVARCHAR(100))
      = CAST(D.[ProductID] AS NVARCHAR(100))
  `;

  /**
   * =========================================================
   * CHẠY 2 QUERY SONG SONG
   * =========================================================
   * Promise.all giúp tối ưu tốc độ
   */
  const [orderRes, detailRes] = await Promise.all([
    pool.request().query(ordersSql),
    pool.request().query(detailSql),
  ]);

  /**
   * =========================================================
   * TRẢ DỮ LIỆU
   * =========================================================
   */
  return {
    orders: orderRes.recordset || [],
    details: detailRes.recordset || [],
  };
};

/**
 * =========================================================
 * LẤY CHI TIẾT 1 ĐƠN HÀNG
 * =========================================================
 * Bao gồm:
 * - Thông tin đơn hàng
 * - Sản phẩm
 * - Hình ảnh
 * - Giá gốc / giá sale
 * - Thông tin trừ kho
 */
const getOrderDetailFromBill = async (orderId) => {

  /**
   * Làm sạch orderId
   */
  const safeOrderId = String(orderId || "").trim();

  /**
   * Nếu không có mã đơn => báo lỗi
   */
  if (!safeOrderId) {
    throw new Error("Thiếu mã đơn hàng.");
  }

  /**
   * Kết nối database
   */
  const pool = await connectDB();

  /**
   * =========================================================
   * QUERY CHI TIẾT ĐƠN HÀNG
   * =========================================================
   */
  const detailSql = `
    SELECT

      /**
       * =====================================================
       * THÔNG TIN ĐƠN HÀNG
       * =====================================================
       */

      CAST(O.[OrderID] AS NVARCHAR(100)) AS OrderId,

      CAST(O.[CustomerName] AS NVARCHAR(255)) AS CustomerName,

      CAST(O.[CustomerPhone] AS NVARCHAR(50)) AS CustomerPhone,

      CAST(O.[CustomerAddress] AS NVARCHAR(500)) AS CustomerAddress,

      CAST(O.[Status] AS NVARCHAR(100)) AS Status,

      CONVERT(VARCHAR(10), TRY_CAST(O.[CreatedAt] AS DATETIME), 23) AS OrderDate,

      CAST(O.[Total] AS DECIMAL(18,2)) AS TotalRaw,

      /**
       * =====================================================
       * THÔNG TIN SẢN PHẨM
       * =====================================================
       */

      -- Tên sản phẩm
      CAST(COALESCE(P.[ProductName], N'Sản phẩm') AS NVARCHAR(255)) AS ProductName,

      -- Mã sản phẩm
      CAST(COALESCE(D.[ProductID], '') AS NVARCHAR(100)) AS ProductID,

      -- Ảnh sản phẩm
      CAST(P.[Image] AS NVARCHAR(500)) AS ProductImage,

      -- Số lượng mua
      TRY_CAST(D.[Quantity] AS INT) AS Quantity,

      -- Giá gốc
      CAST(D.[OriginalPrice] AS DECIMAL(18,2)) AS OriginalPriceRaw,

      -- Giá sale
      CAST(D.[SalePrice] AS DECIMAL(18,2)) AS SalePriceRaw,

      -- Giá sử dụng thực tế
      CAST(COALESCE(D.[SalePrice], D.[OriginalPrice]) AS DECIMAL(18,2)) AS UnitPriceRaw,

      -- Thành tiền
      CAST(D.[LineTotal] AS DECIMAL(18,2)) AS LineTotalRaw,

      /**
       * =====================================================
       * THÔNG TIN TRỪ KHO
       * =====================================================
       */

      OID.BatchID AS DeductBatchID,

      OID.Barcode AS DeductBarcode,

      OID.DeductedQty AS DeductedQty,

      OID.ExpiryDate AS DeductExpiryDate

    FROM ${ORDERS_TABLE} O

    /**
     * JOIN bảng chi tiết đơn hàng
     */
    LEFT JOIN ${ORDER_DETAILS_TABLE} D
      ON CAST(D.[OrderID] AS NVARCHAR(100))
      = CAST(O.[OrderID] AS NVARCHAR(100))

    /**
     * JOIN bảng sản phẩm
     */
    LEFT JOIN PRODUCT P
      ON CAST(P.[ProductID] AS NVARCHAR(100))
      = CAST(D.[ProductID] AS NVARCHAR(100))

    /**
     * =====================================================
     * LẤY THÔNG TIN TRỪ KHO
     * =====================================================
     * OUTER APPLY giống JOIN động cho từng dòng
     */
    OUTER APPLY (
      SELECT TOP 1
        BatchID,
        Barcode,
        DeductedQty,
        ExpiryDate

      FROM ORDER_INVENTORY_DEDUCTION OID

      WHERE CAST(OID.OrderID AS NVARCHAR(100))
        = CAST(O.OrderID AS NVARCHAR(100))

        AND CAST(OID.ProductID AS NVARCHAR(100))
        = CAST(D.ProductID AS NVARCHAR(100))

      ORDER BY OID.ID ASC
    ) OID

    /**
     * Chỉ lấy đơn hàng được yêu cầu
     */
    WHERE CAST(O.[OrderID] AS NVARCHAR(100)) = @orderId
  `;

  /**
   * =========================================================
   * TRUYỀN PARAMETER CHỐNG SQL INJECTION
   * =========================================================
   */
  const result = await pool
    .request()
    .input("orderId", sql.NVarChar(100), safeOrderId)
    .query(detailSql);

  /**
   * Trả danh sách record
   */
  return result.recordset || [];
};

/**
 * =========================================================
 * EXPORT FUNCTIONS
 * =========================================================
 * Để controller có thể sử dụng
 */
exports.getAllOrdersFromBill = getAllOrdersFromBill;

exports.getOrderDetailFromBill = getOrderDetailFromBill;