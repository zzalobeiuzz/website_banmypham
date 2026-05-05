// =============== Step 4 ở phần thanh toán giỏ hàng ================
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./checkout.scss";

const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  return amount.toLocaleString("vi-VN");
};

const getQueryParam = (search, key) => {
  const params = new URLSearchParams(search);
  return params.get(key);
};

const OrderSuccess = ({ orderInfo, setStep, isExpanded, onToggleExpand }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy thông tin từ orderInfo (từ CartDetail khi redirect từ payment callback)
  const callbackOrderId = orderInfo?.id;
  const callbackPaymentStatus = orderInfo?.paymentStatus;

  // Lấy thông tin từ query params (backup nếu truy cập trực tiếp)
  const orderIdFromQuery = getQueryParam(location.search, "order_id");
  const paymentStatusFromQuery = getQueryParam(location.search, "payment") || "success";

  // Ưu tiên orderInfo (từ callback), fallback sang query params
  const orderId = callbackOrderId || orderIdFromQuery;
  const paymentStatus = callbackPaymentStatus || paymentStatusFromQuery;

  // Nếu có orderInfo (từ CartDetail), hiển thị kết quả thanh toán
  // Nếu không, hiển thị success message (khi gọi từ step trực tiếp)
  const isPaymentCallback = Boolean(callbackOrderId);
  const orderItems = orderInfo?.items || [];

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
        <h3>{isPaymentCallback ? `${statusText}` : "🎉 Đặt hàng thành công"}</h3>

        <button
          type="button"
          className={`order-expand-toggle ${isExpanded ? "expanded" : ""}`}
          onClick={onToggleExpand}
          title={isExpanded ? "Thu nhỏ thông tin đơn hàng" : "Mở rộng thông tin đơn hàng"}
          aria-label={isExpanded ? "Thu nhỏ thông tin đơn hàng" : "Mở rộng thông tin đơn hàng"}
        >
          <span className="toggle-icon">{isExpanded ? "⤢" : "⤢"}</span>
        </button>
      </div>

      {isPaymentCallback ? (
        <>
          <p>
            <b>Mã đơn:</b> {orderId || "Không xác định"}
          </p>
          <p>
            <b>Trạng thái:</b> {statusText}
          </p>

          <p className="order-total">
            <b>Tổng tiền:</b> {formatCurrency(orderInfo?.total)}đ
          </p>

          {/* 📦 THÔNG TIN GIAO HÀNG */}
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
                {orderItems.map((item, idx) => (
                  <div key={item.productId || idx} className="order-item-card">
                    <div className="product-header">
                      <div>
                        <p className="product-name">
                          {item.name || `Sản phẩm ${idx + 1}`}
                        </p>
                        <p className="product-id">ID: {item.productId || "-"}</p>
                      </div>
                      <div className="product-price-wrap">
                        <p className="product-price">
                          {formatCurrency(item.price || 0)}đ
                        </p>
                      </div>
                    </div>
                    <div className="product-footer">
                      <div className="product-quantity">
                        Số lượng: <strong>{item.quantity}</strong>
                      </div>
                      <div className="product-total">
                        Thành tiền: <span className="total-amount">
                          {formatCurrency((item.price || 0) * (item.quantity || 1))}đ
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="order-actions">
            <button onClick={() => navigate("/cart-detail")} className="action-btn btn-back">
              Quay lại giỏ hàng
            </button>
            <button onClick={() => navigate("/")} className="action-btn btn-home">
              Về trang chủ
            </button>
          </div>
        </>
      ) : (
        <>
          <p>
            <b>Mã đơn:</b> {orderInfo?.id}
          </p>
          <p style={{ marginBottom: 4 }}>
            <b>Tổng tiền:</b> {formatCurrency(orderInfo?.total)}đ
          </p>

          {/* 📦 THÔNG TIN GIAO HÀNG */}
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
                {orderInfo?.items?.map((item, idx) => (
                  <div key={item.id || idx} className="order-item-card">
                    <div className="product-header">
                      <div>
                        <p className="product-name">
                          {item.name || `Sản phẩm ${idx + 1}`}
                        </p>
                        <p className="product-id">ID: {item.productId || "-"}</p>
                      </div>
                      <div className="product-price-wrap">
                        <p className="product-price">
                          {formatCurrency(item.salePrice || item.price || 0)}đ
                        </p>
                        {item.salePrice && item.originalPrice && item.salePrice < item.originalPrice && (
                          <p className="product-original-price">
                            {formatCurrency(item.originalPrice)}đ
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="product-footer">
                      <div className="product-quantity">
                        Số lượng: <strong>{item.quantity}</strong>
                      </div>
                      <div className="product-total">
                        Thành tiền: <span className="total-amount">
                          {formatCurrency((item.salePrice || item.price || 0) * (item.quantity || 1))}đ
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="order-actions">
            <button onClick={() => setStep?.(1)} className="action-btn btn-back">
              Quay về giỏ hàng
            </button>
            <button onClick={() => navigate("/")} className="action-btn btn-home">
              Về trang chủ
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderSuccess;