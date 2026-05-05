// =============== Step 1 ở phần thanh toán giỏ hàng ================
import React from "react";
import "./checkout.scss";

const CheckoutSummary = ({
  order,
  setOrder,
  applyVoucher,
  handleCheckout,
}) => {
  return (
    <div className="checkout-summary">
      <h3>
        <i className="fa-solid fa-credit-card"></i> Tổng thanh toán
      </h3>

      <div className="summary-row">
        <span>Tạm tính</span>
        <span>{order.subtotal.toLocaleString("vi-VN")}đ</span>
      </div>

      <div className="summary-row">
        <span>Giảm giá</span>
        <span>-{order.discount.toLocaleString("vi-VN")}đ</span>
      </div>

      <hr />

      <div className="summary-total">
        <strong>Tổng cộng</strong>
        <strong>{order.total.toLocaleString("vi-VN")}đ</strong>
      </div>

      <div className="voucher-box">
        <input
          type="text"
          placeholder="Nhập mã giảm giá"
          value={order.voucher}
          onChange={(e) => setOrder((prev) => ({ ...prev, voucher: e.target.value }))}
        />
        <button onClick={applyVoucher}>Áp dụng</button>
      </div>

      <button className="checkout-btn" onClick={handleCheckout}>
        Thanh toán
      </button>
    </div>
  );
};

export default CheckoutSummary;