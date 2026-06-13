import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../constants";
import useHttp from "../../../hooks/useHttp";
import "./order_lookup.scss";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatPaymentMethod = (method) => {
  const value = String(method || "").trim().toUpperCase();

  switch (value) {
    case "COD":
      return "Thanh toán khi nhận hàng";
    case "MOMO":
      return "Thanh toán ví MoMo";
    case "TRANSFER":
      return "Chuyển khoản ngân hàng";
    default:
      return method || "-";
  }
};

const resolveProductImageSrc = (image) => {
  const value = String(image || "").trim();
  if (!value) return `${UPLOAD_BASE}/pictures/no_image.jpg`;
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;

  const normalized = value
    .replace(/^\/+/, "")
    .replace(/^uploads\/?assets\/?pictures\/?/i, "")
    .replace(/^pictures\/?/i, "");

  return `${UPLOAD_BASE}/pictures/${normalized}`;
};

const OrderLookupPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialOrderId = searchParams.get("orderId") || "";
  const [orderCode, setOrderCode] = useState(initialOrderId);
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState("");
  const { request, loading } = useHttp();

  const orderItems = useMemo(
    () => (Array.isArray(order?.items) ? order.items : []),
    [order],
  );

  const handleLookup = async (event) => {
    event.preventDefault();
    const normalizedCode = String(orderCode || "").trim();

    setMessage("");
    setOrder(null);

    if (!normalizedCode) {
      setMessage("Vui lòng nhập mã đơn hàng cần tra cứu.");
      return;
    }

    try {
      const res = await request(
        "GET",
        `${API_BASE}/api/user/orders/lookup/${encodeURIComponent(normalizedCode)}`,
      );

      if (!res?.success || !res?.order) {
        setMessage(res?.message || "Không tìm thấy đơn hàng.");
        return;
      }

      setOrder(res.order);
      setSearchParams({ orderId: normalizedCode });
    } catch (error) {
      setMessage(error?.message || "Không thể tra cứu đơn hàng.");
    }
  };

  return (
    <div className="order-lookup-page">
      <section className="order-lookup-hero">
        <div className="order-lookup-hero__content">
          <p className="order-lookup-hero__eyebrow">Tra cứu nhanh</p>
          <h1>Tra cứu đơn hàng</h1>
          <p>
            Nhập mã đơn hàng để xem trạng thái, thông tin giao hàng và danh sách
            sản phẩm mà không cần đăng nhập.
          </p>
        </div>

        <form className="order-lookup-form" onSubmit={handleLookup}>
          <label htmlFor="order-code">Mã đơn hàng</label>
          <div className="order-lookup-form__row">
            <input
              id="order-code"
              type="text"
              value={orderCode}
              onChange={(event) => setOrderCode(event.target.value)}
              placeholder="Ví dụ: DH17802440690566183"
              autoComplete="off"
            />
            <button type="submit" disabled={loading}>
              {loading ? "Đang tra cứu..." : "Tra cứu"}
            </button>
          </div>
          {message && <div className="order-lookup-message">{message}</div>}
        </form>
      </section>

      {order && (
        <section className="order-lookup-result">
          <div className="order-lookup-result__header">
            <div>
              <span>Đơn hàng</span>
              <h2>{order.id}</h2>
            </div>
            <div className="order-lookup-status">{order.status || "Đang cập nhật"}</div>
          </div>

          <div className="order-lookup-summary">
            <div className="order-lookup-info-card">
              <span>Khách hàng</span>
              <strong>{order.shippingInfo?.name || "-"}</strong>
              <p>{order.shippingInfo?.phone || "-"}</p>
            </div>
            <div className="order-lookup-info-card">
              <span>Ngày đặt</span>
              <strong>{formatDateTime(order.createdAt)}</strong>
              <p>Cập nhật: {formatDateTime(order.updatedAt)}</p>
            </div>
            <div className="order-lookup-info-card">
              <span>Thanh toán</span>
              <strong>{formatPaymentMethod(order.paymentMethod)}</strong>
              <p>{order.voucher ? `Mã giảm giá: ${order.voucher}` : "Không dùng mã giảm giá"}</p>
            </div>
            <div className="order-lookup-info-card order-lookup-info-card--address">
              <span>Địa chỉ nhận hàng</span>
              <strong>{order.shippingInfo?.address || "-"}</strong>
            </div>
          </div>

          <div className="order-lookup-products">
            <div className="order-lookup-products__title">
              <h3>Sản phẩm trong đơn</h3>
              <span>{orderItems.length} sản phẩm</span>
            </div>

            <div className="order-lookup-products__list">
              {orderItems.map((item) => (
                <div className="order-lookup-product" key={`${item.productId}-${item.productName}`}>
                  <Link to={`/product/${item.productId}`} className="order-lookup-product__image">
                    <img
                      src={resolveProductImageSrc(item.image)}
                      alt={item.productName || "Sản phẩm"}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src = `${UPLOAD_BASE}/pictures/no_image.jpg`;
                      }}
                    />
                  </Link>

                  <div className="order-lookup-product__main">
                    <Link to={`/product/${item.productId}`} className="order-lookup-product__name">
                      {item.productName || item.productId}
                    </Link>
                    <span>Mã: {item.productId}</span>
                  </div>

                  <div className="order-lookup-product__qty">x{item.quantity}</div>

                  <div className="order-lookup-product__price">
                    <strong>{formatCurrency(item.lineTotal)}</strong>
                    <span>Đơn giá: {formatCurrency(item.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-lookup-total">
            <div>
              <span>Tạm tính</span>
              <strong>{formatCurrency(order.subtotal)}</strong>
            </div>
            <div>
              <span>Giảm giá</span>
              <strong>-{formatCurrency(order.discount)}</strong>
            </div>
            <div className="order-lookup-total__final">
              <span>Tổng thanh toán</span>
              <strong>{formatCurrency(order.total)}</strong>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default OrderLookupPage;
