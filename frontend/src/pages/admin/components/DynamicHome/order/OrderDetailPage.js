import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useHttp from "../../../../../hooks/useHttp";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import "./OrderDetailPage.scss";

/*
  OrderDetailPage
  - Admin view for a single order's full details.
  - Fetches order data from admin API: `/api/admin/orders/:orderId`.
  - Renders order header, customer/shipping info, product table with
    inventory-deduction details (batch, barcode, expiry), and totals.
  - Includes status change flow (open menu -> choose -> confirm).
*/
const ORDER_STATUSES = [
  "Chờ thanh toán",
  "Đã thanh toán",
  "Thanh toán COD",
  "Đang giao",
  "Hoàn thành",
  "Hủy đơn",
  "Trả hàng",
];

const parseMoneyValue = (value) => Number(String(value ?? "").replace(/[^\d]/g, "")) || 0;

const getEffectivePrice = (item) => {
  const salePrice = Number(item?.salePriceRaw ?? item?.SalePriceRaw ?? parseMoneyValue(item?.salePrice ?? item?.SalePrice));
  const originalPrice = Number(item?.originalPriceRaw ?? item?.OriginalPriceRaw ?? parseMoneyValue(item?.originalPrice ?? item?.OriginalPrice));
  const fallbackPrice = parseMoneyValue(item?.price ?? item?.Price);

  return salePrice > 0 ? salePrice : originalPrice || fallbackPrice;
};

// Normalize API response into the shape the UI expects.
// Keeps compatibility with different backend field names.
const normalizeOrder = (raw) => ({
  id: String(raw?.id || raw?.OrderID || raw?.BillID || ""),
  customer: String(raw?.customer || raw?.CustomerName || "Khách hàng"),
  date: String(raw?.date || raw?.OrderDate || ""),
  total: String(raw?.total || raw?.TotalPrice || "0₫"),
  status: String(raw?.status || raw?.Status || "Chờ thanh toán"),
  details: Array.isArray(raw?.details)
    ? raw.details.map((item) => ({
        id: String(item?.id || item?.ProductID || ""),
        name: String(item?.name || item?.ProductName || "Sản phẩm"),
        qty: Number(item?.qty || item?.Quantity || 0) || 0,
        price: getEffectivePrice(item),
        originalPrice: String(item?.originalPrice || item?.OriginalPrice || "0₫"),
        salePrice: String(item?.salePrice || item?.SalePrice || "0₫"),
        lineTotal: String(item?.lineTotal || item?.LineTotal || "0₫"),
        originalPriceRaw: Number(item?.originalPriceRaw || item?.OriginalPriceRaw || 0) || 0,
        salePriceRaw: Number(item?.salePriceRaw || item?.SalePriceRaw || 0) || 0,
        lineTotalRaw: Number(item?.lineTotalRaw || item?.LineTotalRaw || 0) || 0,
        image: String(item?.image || item?.Image || item?.ImageUrl || ""),
        // Inventory deduction info
        batchId: item?.batchId || item?.BatchID || null,
        barcode: item?.barcode || item?.Barcode || "",
        deductedQty: Number(item?.deductedQty || item?.DeductedQty || 0) || 0,
        expiryDate: item?.expiryDate || item?.ExpiryDate || "",
      }))
    : [],
  address: String(raw?.address || raw?.CustomerAddress || ""),
  phone: String(raw?.phone || raw?.CustomerPhone || ""),
});

// Map order status string to a CSS class for visual styling.
const getStatusClass = (status) => {
  if (status === "Chờ thanh toán") return "status--cho-thanh-toan";
  if (status === "Đã thanh toán") return "status--da-thanh-toan";
  if (status === "Thanh toán COD") return "status--cod";
  if (status === "Đang giao") return "status--dang-giao";
  if (status === "Hoàn thành") return "status--hoan-thanh";
  if (status === "Hủy đơn") return "status--da-huy";
  if (status === "Trả hàng") return "status--tra-hang";
  return "";
};

// Resolve an image field to a valid URL.
// - If a full URL is supplied (starts with http) return it directly.
// - Otherwise assume it's an upload filename and prefix with UPLOAD_BASE.
const getImageUrl = (imageField) => {
  if (!imageField) return "";
  // Nếu là URL đầy đủ (bắt đầu với http), trả về nguyên
  if (String(imageField).startsWith("http")) {
    return imageField;
  }
  // Nếu chỉ là filename, thêm UPLOAD_BASE
  return `${UPLOAD_BASE}/pictures/${imageField}`;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const { request } = useHttp();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openStatusMenu, setOpenStatusMenu] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [expandedProduct, setExpandedProduct] = useState(null); // Để mở rộng chi tiết inventory

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        // Fetch single order by ID
        const res = await request(
          "GET",
          `${API_BASE}/api/admin/orders/${orderId}`
        );
        const orderData = res?.data;
        if (orderData) {
          setOrder(normalizeOrder(orderData));
        } else {
          setError("Không tìm thấy đơn hàng");
        }
      } catch (err) {
        setError("Lỗi khi tải dữ liệu đơn hàng");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, request]);

  // Note: the admin API already returns image and inventory deduction
  // fields inside `details[]`. We do not call the user-facing product API
  // here so admin behavior remains server-side only.

  // Note: images & inventory deduction are provided by admin order API now.
  // Backend returns `details[].image`, `batchId`, `barcode`, `deductedQty`, `expiryDate`.
  // The previous product-detail fetch is removed to avoid calling a different flow.

  // Helpers for price/date formatting used by the table rendering.
  const parsePrice = (p) => Number(String(p).replace(/[^\d]/g, "")) || 0;
  const formatPrice = (v) => (Number(v) || 0).toLocaleString("vi-VN") + "₫";
  // formatDate returns a date-only string (vi-VN) if possible, otherwise
  // falls back to simple splitting for non-standard server strings.
  const formatDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) {
      const parts = String(d).split("T");
      return parts[0] || String(d);
    }
    return dt.toLocaleDateString("vi-VN");
  };

  const totalItems = order
    ? order.details.reduce((sum, it) => sum + (it.qty || 0), 0)
    : 0;
  const totalPrice = order
    ? order.details.reduce(
        (s, it) => s + parsePrice(it.price) * (it.qty || 0),
        0
      )
    : 0;

  const buildOrderInvoiceHtml = (targetOrder) => {
    const invoiceTotalItems = targetOrder.details.reduce(
      (sum, item) => sum + (Number(item.qty || 0) || 0),
      0
    );
    const detailTotal = targetOrder.details.reduce(
      (sum, item) => sum + parsePrice(item.price) * (item.qty || 0),
      0
    );
    const invoiceTotal = parsePrice(targetOrder.total) || detailTotal;
    const invoiceItems = targetOrder.details
      .map((item, index) => {
        const unitPrice = parsePrice(item.price);
        const quantity = Number(item.qty || 0) || 0;
        const lineTotal = unitPrice * quantity;

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.name)}</td>
            <td class="text-center">${quantity}</td>
            <td class="text-right">${formatPrice(unitPrice)}</td>
            <td class="text-right">${formatPrice(lineTotal)}</td>
          </tr>
        `;
      })
      .join("");

    return `
      <!doctype html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <title>Hoa don ${escapeHtml(targetOrder.id)}</title>
          <style>
            @page { size: A4; margin: 16mm; }
            * { box-sizing: border-box; }
            body { margin: 0; color: #0f172a; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.45; }
            .header { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 18px; border-bottom: 2px solid #0f766e; }
            .shop-name { margin: 0 0 6px; color: #0f766e; font-size: 26px; font-weight: 800; }
            .shop-subtitle { margin: 0; color: #475569; }
            .invoice-title { margin: 0 0 6px; text-align: right; font-size: 24px; font-weight: 800; text-transform: uppercase; }
            .invoice-code { text-align: right; color: #475569; font-weight: 700; }
            .info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 28px; margin: 22px 0; padding: 14px; border: 1px solid #dbe4ef; border-radius: 10px; background: #f8fafc; }
            .info-item strong { display: inline-block; min-width: 92px; color: #334155; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { background: #0f766e; color: #fff; font-weight: 800; text-align: left; }
            th, td { border: 1px solid #dbe4ef; padding: 10px 9px; vertical-align: top; }
            tbody tr:nth-child(even) { background: #f8fafc; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .summary { width: 320px; margin: 18px 0 0 auto; border: 1px solid #dbe4ef; border-radius: 10px; overflow: hidden; }
            .summary-row { display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; border-bottom: 1px solid #e5ebf2; }
            .summary-row:last-child { border-bottom: 0; background: #ecfdf5; color: #b91c1c; font-size: 16px; font-weight: 800; }
            .footer { margin-top: 34px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px; text-align: center; color: #334155; }
            .signature { min-height: 90px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-weight: 800; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <main>
            <section class="header">
              <div>
                <h1 class="shop-name">Tiny Shop</h1>
                <p class="shop-subtitle">Cosmetics & Beauty</p>
              </div>
              <div>
                <h2 class="invoice-title">Hóa đơn bán hàng</h2>
                <div class="invoice-code">Mã đơn: ${escapeHtml(targetOrder.id)}</div>
              </div>
            </section>
            <section class="info-grid">
              <div class="info-item"><strong>Khách hàng:</strong> ${escapeHtml(targetOrder.customer)}</div>
              <div class="info-item"><strong>Ngày đặt:</strong> ${escapeHtml(targetOrder.date)}</div>
              <div class="info-item"><strong>SĐT:</strong> ${escapeHtml(targetOrder.phone || "-")}</div>
              <div class="info-item"><strong>Trạng thái:</strong> ${escapeHtml(targetOrder.status)}</div>
              <div class="info-item" style="grid-column: 1 / -1;"><strong>Địa chỉ:</strong> ${escapeHtml(targetOrder.address || "-")}</div>
            </section>
            <table>
              <thead>
                <tr>
                  <th style="width: 48px;">STT</th>
                  <th>Sản phẩm</th>
                  <th class="text-center" style="width: 90px;">SL</th>
                  <th class="text-right" style="width: 130px;">Đơn giá</th>
                  <th class="text-right" style="width: 140px;">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceItems || '<tr><td colspan="5" class="text-center">Không có sản phẩm</td></tr>'}
              </tbody>
            </table>
            <section class="summary">
              <div class="summary-row"><span>Tổng số món</span><strong>${invoiceTotalItems}</strong></div>
              <div class="summary-row"><span>Tổng tiền</span><strong>${formatPrice(invoiceTotal)}</strong></div>
            </section>
            <section class="footer">
              <div class="signature">Người lập hóa đơn</div>
              <div class="signature">Khách hàng</div>
            </section>
          </main>
        </body>
      </html>
    `;
  };

  const handlePrintOrder = () => {
    if (!order) return;

    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.setAttribute("title", `print-order-${order.id}`);
    document.body.appendChild(frame);

    const frameWindow = frame.contentWindow;
    const frameDocument = frameWindow?.document;
    if (!frameWindow || !frameDocument) {
      frame.remove();
      window.print();
      return;
    }

    frameDocument.open();
    frameDocument.write(buildOrderInvoiceHtml(order));
    frameDocument.close();

    window.setTimeout(() => {
      frameWindow.focus();
      frameWindow.print();
      window.setTimeout(() => {
        if (frame.parentNode) frame.parentNode.removeChild(frame);
      }, 300);
    }, 250);
  };

  const handleStatusClick = () => {
    setOpenStatusMenu(!openStatusMenu);
  };

  const handleChooseStatus = (nextStatus) => {
    if (nextStatus === order.status) {
      setOpenStatusMenu(false);
      return;
    }
    setPendingStatusChange(nextStatus);
    setOpenStatusMenu(false);
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingStatusChange || !order) return;

    try {
      // Call backend to update status
      await request("PATCH", `${API_BASE}/api/admin/orders/${order.id}`, {
        status: pendingStatusChange,
      });

      setOrder((prev) => ({
        ...prev,
        status: pendingStatusChange,
      }));
      setPendingStatusChange(null);
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Lỗi khi cập nhật trạng thái");
    }
  };

  const handleCancelStatusChange = () => {
    setPendingStatusChange(null);
  };

  if (loading) {
    return (
      <div className="order-detail-page">
        <div className="loading">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-detail-page">
        <div className="error">
          <p>{error || "Không tìm thấy đơn hàng"}</p>
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate(-1)}
          >
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-detail-page">
      <div className="order-detail-container">
        {/* Header với nút quay lại */}
        <div className="detail-header">
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate(-1)}
            title="Quay lại trang danh sách"
          >
            ← Quay lại
          </button>
          <h1>Chi tiết đơn hàng #{order.id}</h1>
        </div>

        {/* Thông tin cơ bản */}
        <div className="detail-section">
          <h2>Thông tin đơn hàng</h2>
          <div className="info-grid">
            <div className="info-item">
              <strong>Mã đơn:</strong>
              <span>{order.id}</span>
            </div>
            <div className="info-item">
              <strong>Khách hàng:</strong>
              <span>{order.customer}</span>
            </div>
            <div className="info-item">
              <strong>Ngày đặt:</strong>
              <span>{order.date}</span>
            </div>
            <div className="info-item">
              <strong>Trạng thái:</strong>
              <div className="status-section">
                <button
                  type="button"
                  className={`status-pill status-clickable ${getStatusClass(
                    order.status
                  )}`}
                  onClick={handleStatusClick}
                >
                  {order.status}
                </button>
                {openStatusMenu && (
                  <div className="status-dropdown" role="menu">
                    {ORDER_STATUSES.map((status) => (
                      <button
                        type="button"
                        key={status}
                        className={`status-option ${
                          status === order.status ? "active" : ""
                        }`}
                        onClick={() => handleChooseStatus(status)}
                      >
                        <span className={`status-pill ${getStatusClass(status)}`}>
                          {status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Thông tin địa chỉ */}
        <div className="detail-section">
          <h2>Thông tin giao hàng</h2>
          <div className="info-grid">
            <div className="info-item">
              <strong>Địa chỉ:</strong>
              <span>{order.address}</span>
            </div>
            <div className="info-item">
              <strong>Số điện thoại:</strong>
              <span>{order.phone}</span>
            </div>
          </div>
        </div>

        {/* Bảng sản phẩm */}
        <div className="detail-section">
          <h2>Sản phẩm trong đơn</h2>
          <div className="order-products-table-wrapper">
            <table className="order-products-table">
              <colgroup>
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "28%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "8%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Mã SP</th>
                  <th>Tên Sản phẩm</th>
                  <th>Giá</th>
                  <th style={{ textAlign: "center" }}>Số lượng</th>
                  <th style={{ textAlign: "right" }}>Thành tiền</th>
                  <th style={{ textAlign: "center" }}>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {order.details.map((item, i) => {
                  const itemPrice = parsePrice(item.price);
                  const itemTotal = itemPrice * (item.qty || 0);
                  const isExpanded = expandedProduct === i;

                  return (
                    <React.Fragment key={i}>
                      <tr className={isExpanded ? "expanded-row" : ""}>
                        <td className="product-image-cell">
                          {item.image ? (
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.name}
                              className="product-thumbnail"
                              title={item.name}
                            />
                          ) : (
                            <div className="product-thumbnail-placeholder">
                              📷
                            </div>
                          )}
                        </td>
                        <td className="product-id-cell">{item.id || ""}</td>
                        <td title={item.name} className="product-name-cell">
                          {item.name}
                        </td>
                        <td className="product-price-cell">
                          {Number(item.salePriceRaw) > 0 && Number(item.salePriceRaw) !== Number(item.originalPriceRaw) ? (
                            <>
                              <div className="price-original">{item.originalPrice}</div>
                              <div className="price-sale">{item.salePrice}</div>
                            </>
                          ) : (
                            <div className="price-single">{item.originalPrice || item.price}</div>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>{item.qty}</td>
                        <td style={{ textAlign: "right" }}>
                          {item.lineTotalRaw > 0 ? item.lineTotal : formatPrice(itemTotal)}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="btn-expand-inventory"
                            onClick={() =>
                              setExpandedProduct(isExpanded ? null : i)
                            }
                            title="Xem chi tiết kho"
                          >
                            {isExpanded ? "▼" : "▶"}
                          </button>
                        </td>
                      </tr>

                      {/* Inventory deduction details row */}
                      {isExpanded && (
                        <tr className="inventory-detail-row">
                          <td colSpan="6">
                            <div className="inventory-details">
                              <div className="inventory-info">
                                {item.batchId && (
                                  <div className="info-pair">
                                    <strong>Lô hàng:</strong>
                                    <span>#{item.batchId}</span>
                                  </div>
                                )}
                                {item.barcode && (
                                  <div className="info-pair">
                                    <strong>Barcode:</strong>
                                    <span>{item.barcode}</span>
                                  </div>
                                )}
                                {item.deductedQty > 0 && (
                                  <div className="info-pair">
                                    <strong>Lấy từ kho:</strong>
                                    <span>{item.deductedQty} cái</span>
                                  </div>
                                )}
                                {item.expiryDate && (
                                  <div className="info-pair">
                                    <strong>Hạn dùng:</strong>
                                    <span>{formatDate(item.expiryDate)}</span>
                                  </div>
                                )}
                                {!item.batchId &&
                                  !item.barcode &&
                                  !item.deductedQty &&
                                  !item.expiryDate && (
                                    <p className="no-inventory">
                                      Không có thông tin kho
                                    </p>
                                  )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tổng kết */}
        <div className="detail-section">
          <div className="totals-section">
            <div className="total-item">
              <span>Tổng số món:</span>
              <strong>{totalItems}</strong>
            </div>
            <div className="total-item highlight">
              <span>Tổng tiền:</span>
              <strong>{formatPrice(totalPrice)}</strong>
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="detail-actions">
          <button
            type="button"
            className="btn-print"
            onClick={handlePrintOrder}
          >
            🖨 In đơn hàng
          </button>
        </div>
      </div>

      {/* Modal xác nhận đổi trạng thái */}
      {pendingStatusChange && (
        <div className="status-confirm-overlay" role="dialog" aria-modal="true">
          <div className="status-confirm-modal">
            <h4>Xác nhận đổi trạng thái</h4>
            <p>Bạn có muốn thay đổi trạng thái đơn hàng?</p>
            <p>
              <strong>{order.status}</strong> {"->"}{" "}
              <strong>{pendingStatusChange}</strong>
            </p>
            <div className="status-confirm-actions">
              <button type="button" onClick={handleCancelStatusChange}>
                Không
              </button>
              <button type="button" onClick={handleConfirmStatusChange}>
                Có, thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;
