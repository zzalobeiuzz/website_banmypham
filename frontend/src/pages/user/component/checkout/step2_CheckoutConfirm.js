import "./checkout.scss";

const CheckoutConfirm = ({ setStep, order, setOrder }) => {

  const handleChange = (key, value) => {
    setOrder((prev) => ({
      ...prev,
      shippingInfo: {
        ...prev.shippingInfo,
        [key]: value,
      },
    }));
  };

  const handleNext = () => {
    setStep(3);
  };
  return (
    <div className="checkout-box">
      <h3>
        <i className="fa-solid fa-circle-check"></i> Xác nhận thông tin
      </h3>

      <div className="confirm-info">
        <div className="form-group">
          <label>👤 Tên người nhận</label>
          <input
            type="text"
            value={order.shippingInfo?.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Nhập họ tên người nhận"
          />
        </div>

        <div className="form-group">
          <label>📞 Số điện thoại</label>
          <input
            type="text"
            value={order.shippingInfo?.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="Nhập số điện thoại"
          />
        </div>

        <div className="form-group">
          <label>📍 Địa chỉ giao hàng</label>
          <textarea
            value={order.shippingInfo?.address || ""}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="Nhập địa chỉ chi tiết..."
          />
        </div>
      </div>

      <div className="checkout-actions">
        <button className="btn-back" onClick={() => setStep(1)}>
          ← Quay lại
        </button>

        <button className="btn-next" onClick={handleNext}>
          Xác nhận →
        </button>
      </div>
    </div>
  );
};

export default CheckoutConfirm;
