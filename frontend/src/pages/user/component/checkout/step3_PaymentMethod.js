import React from "react";
import "./checkout.scss";

const PaymentMethod = ({ order, setOrder, setStep, handleFinalCheckout, isSubmittingOrder }) => {
  const handleSelectPayment = (method) => {
    if (isSubmittingOrder) return;
    setOrder((prev) => ({
      ...prev,
      paymentMethod: method,
    }));
  };

  // ✅ Kiểm tra phương thức thanh toán đã được chọn chưa
  const isPaymentMethodSelected = order.paymentMethod && order.paymentMethod.trim() !== "";


  // ✅ Xử lý khi người dùng nhấn "Xác nhận" ở bước chọn phương thức thanh toán
  const handleCheckout = async () => {
    if (!isPaymentMethodSelected) {
      alert("⚠️ Vui lòng chọn phương thức thanh toán trước khi xác nhận!");
      return;
    }

    // Gọi handler tạo đơn; handler bên ngoài (`CartDetail.handleFinalCheckout`)
    // sẽ chịu trách nhiệm redirect tới `/payment/form` nếu cần (TRANSFER).
    await handleFinalCheckout();
  };

  return (
    <div className="checkout-box payment-method">
      <h3>
        <i className="fa-solid fa-credit-card"></i> Phương thức thanh toán
      </h3>

      <div className="payment-options">
        {/* ================= COD ================= */}
        <div
          className={`payment-option ${order.paymentMethod === "COD" ? "active" : ""}`}
          onClick={() => handleSelectPayment("COD")}
        >
          <input
            type="radio"
            name="payment"
            value="COD"
            checked={order.paymentMethod === "COD"}
            disabled={isSubmittingOrder}
            readOnly
          />
          <label>
            <i className="fa-solid fa-money-bills"></i> Thanh toán khi nhận hàng
          </label>
        </div>

        {/* ================= BANK TRANSFER ================= */}
        <div
          className={`payment-option ${order.paymentMethod === "TRANSFER" ? "active" : ""}`}
          onClick={() => handleSelectPayment("TRANSFER")}
        >
          <input
            type="radio"
            name="payment"
            value="TRANSFER"
            checked={order.paymentMethod === "TRANSFER"}
            disabled={isSubmittingOrder}
            readOnly
          />
          <label>
            <i className="fa-solid fa-building-columns"></i> Chuyển khoản ngân
            hàng
          </label>
        </div>

        {/* ================= MOMO ================= */}
        <div
          className={`payment-option ${order.paymentMethod === "MOMO" ? "active" : ""}`}
          onClick={() => handleSelectPayment("MOMO")}
        >
          <input
            type="radio"
            name="payment"
            value="MOMO"
            checked={order.paymentMethod === "MOMO"}
            disabled={isSubmittingOrder}
            readOnly
          />
          <label>
            <i className="fa-solid fa-wallet"></i> Ví MoMo
          </label>
        </div>
      </div>

      <div className="checkout-actions">
        <button
          type="button"
          className="btn-back"
          onClick={() => { if (!isSubmittingOrder) setStep(2); }}
          disabled={isSubmittingOrder}
          title={isSubmittingOrder ? "Đang xử lý, không thể quay lại" : "Quay lại"}
        >
          ← Quay lại
        </button>

        <button 
          type="button"
          className="btn-next" 
          onClick={handleCheckout}
          disabled={isSubmittingOrder || !isPaymentMethodSelected}
          title={!isPaymentMethodSelected ? "Vui lòng chọn phương thức thanh toán" : ""}
        >
          {isSubmittingOrder ? "Đang xử lý" : "Xác nhận →"}
        </button>
      </div>
    </div>
  );
};

export default PaymentMethod;
