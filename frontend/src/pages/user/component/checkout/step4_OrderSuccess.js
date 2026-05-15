// =============== Step 4 ở phần thanh toán giỏ hàng ================
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UPLOAD_BASE } from "../../../../constants";
import "./checkout.scss";

const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  return amount.toLocaleString("vi-VN");
};

const getQueryParam = (search, key) => {
  const params = new URLSearchParams(search);
  return params.get(key);
};

const resolveImage = (item = {}) => {
  const direct = item.image || item.thumbnail || "";
  if (direct) {
    if (String(direct).startsWith("http") || String(direct).startsWith("/")) {
      return direct;
    }
    return `${UPLOAD_BASE}/pictures/${direct}`;
  }

  if (item.Image) {
    return `${UPLOAD_BASE}/pictures/${item.Image}`;
  }

  return "";
};

const normalizeItem = (item = {}, idx = 0) => {
  const originalPrice = Number(item.originalPrice ?? item.price ?? 0) || 0;
  const salePriceRaw = Number(item.salePrice ?? item.sale_price ?? item.price ?? 0) || 0;
  const salePrice = salePriceRaw > 0 ? salePriceRaw : originalPrice;
  const quantity = Number(item.quantity ?? 1) || 1;

  return {
    id: item.productId || item.id || idx + 1,
    name: item.name || item.productName || `Sản phẩm ${idx + 1}`,
    image: resolveImage(item),
    originalPrice,
    salePrice,
    quantity,
    lineTotal: salePrice * quantity,
  };
};

const ProductCard = ({ item }) => {
  const hasDiscount = item.originalPrice > item.salePrice;

  return (
    <div className="order-item-card">
      <div className="product-header">
        <div className="product-main-info">
          <div className="product-image-wrap">
            {item.image ? (
              <img src={item.image} alt={item.name} className="product-image" />
            ) : (
              <div className="product-image product-image-placeholder">No image</div>
            )}
          </div>

          <div>
            <p className="product-id">ID: {item.id}</p>
            <p className="product-name">{item.name}</p>
          </div>
        </div>

        <div className="product-price-wrap">
          <p className="product-price">
            {hasDiscount ? "Giá sau giảm" : "Giá"}: {formatCurrency(item.salePrice)}đ
          </p>
          {hasDiscount && (
            <p className="product-original-price">Giá gốc: {formatCurrency(item.originalPrice)}đ</p>
          )}
        </div>
      </div>

      <div className="product-footer">
        <div className="product-quantity">
          Số lượng: <strong>{item.quantity}</strong>
        </div>
        <div className="product-total">
          Thành tiền: <span className="total-amount">{formatCurrency(item.lineTotal)}đ</span>
        </div>
      </div>
    </div>
  );
};

const OrderSuccess = ({ orderInfo, setStep, isExpanded, onToggleExpand }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const callbackOrderId = orderInfo?.id;
  const callbackPaymentStatus = orderInfo?.paymentStatus;

  const orderIdFromQuery = getQueryParam(location.search, "order_id");
  const paymentStatusFromQuery = getQueryParam(location.search, "payment") || "success";

  const orderId = callbackOrderId || orderIdFromQuery;
  const paymentStatus = callbackPaymentStatus || paymentStatusFromQuery;
  const isPaymentCallback = Boolean(callbackOrderId);

  const orderItems = orderInfo?.items || [];
  const normalizedItems = orderItems.map((item, idx) => normalizeItem(item, idx));
  const totalQuantity = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);
  const originalTotal = normalizedItems.reduce(
    (sum, item) => sum + item.originalPrice * item.quantity,
    0,
  );
  const saleTotal = normalizedItems.reduce(
    (sum, item) => sum + item.salePrice * item.quantity,
    0,
  );
  const discountAmount = Math.max(originalTotal - saleTotal, 0);

  const statusText =
    paymentStatus === "success"
      ? "🎉 Đặt hàng thành công"
      : paymentStatus === "error"
        ? "Thanh toán thất bại"
        : paymentStatus === "cancel"
          ? "Đã hủy thanh toán"
          : "Kết quả thanh toán";

  return (
    <div className="checkout-box checkout-result-page">
      <div className="order-result-header">
        <h3>{isPaymentCallback ? statusText : "🎉 Đặt hàng thành công"}</h3>

        <button
          type="button"
          className={`order-expand-toggle ${isExpanded ? "expanded" : ""}`}
          onClick={onToggleExpand}
          title={isExpanded ? "Thu nhỏ thông tin đơn hàng" : "Mở rộng thông tin đơn hàng"}
          aria-label={isExpanded ? "Thu nhỏ thông tin đơn hàng" : "Mở rộng thông tin đơn hàng"}
        >
          <span className="toggle-icon">⤢</span>
        </button>
      </div>

      <p>
        <b>Mã đơn:</b> {orderId || orderInfo?.id || "Không xác định"}
      </p>

      {isPaymentCallback && (
        <p>
          <b>Trạng thái:</b> {statusText}
        </p>
      )}

      <p className="order-total">
        <b>Tổng tiền:</b> {formatCurrency(orderInfo?.total)}đ
      </p>

      <div className="order-shipping-info">
        <h4>🏠 Thông tin giao hàng</h4>
        <div className="shipping-details">
          <p className="order-info-text shipping-item">
            <b>Người nhận:</b> {orderInfo?.shippingInfo?.name || "-"}
          </p>
          <p className="order-info-text shipping-item">
            <b>Số điện thoại:</b> {orderInfo?.shippingInfo?.phone || "-"}
          </p>
          <p className="order-info-text shipping-item">
            <b>Địa chỉ giao hàng:</b> {orderInfo?.shippingInfo?.address || "-"}
          </p>
        </div>
      </div>

      {isExpanded && (
        <div className="order-expand-wrapper">
          <div className="products-list">
            {normalizedItems.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}

            <div className="order-summary-line">
              <span className="summary-item-inline">
                Tổng số sản phẩm: <strong>{totalQuantity}</strong>
              </span>
              <span className="summary-item-inline">
                Tổng tiền: <strong>{formatCurrency(originalTotal)}đ</strong>
              </span>
              <span className="summary-item-inline">
                Giảm giá: <strong>{formatCurrency(discountAmount)}đ</strong>
              </span>
              <span className="summary-item-inline summary-item-total">
                Thành tiền: <strong>{formatCurrency(saleTotal)}đ</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="order-actions">

        <button onClick={() => navigate("/")} className="action-btn btn-home">
          Về trang chủ
        </button>
      </div>
    </div>
  );
};

export default OrderSuccess;