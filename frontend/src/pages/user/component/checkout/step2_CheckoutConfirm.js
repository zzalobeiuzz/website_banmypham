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

  // ✅ Kiểm tra dự liệu nhập trước khi qua bước tiếp theo
  const handleNext = () => {
  const name = order.shippingInfo?.name?.trim();
  const phone = order.shippingInfo?.phone?.trim();
  const address = order.shippingInfo?.address?.trim();

  // ❌ Kiểm tra rỗng
  if (!name || !phone || !address) {
    alert("Vui lòng nhập đầy đủ thông tin giao hàng.");
    return;
  }

  // ❌ Kiểm tra số điện thoại
  const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;

  if (!phoneRegex.test(phone)) {
    alert("Số điện thoại không hợp lệ.");
    return;
  }

  // ✅ Qua bước thanh toán
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
