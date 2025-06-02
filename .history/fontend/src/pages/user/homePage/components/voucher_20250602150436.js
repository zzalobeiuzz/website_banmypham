import React from "react";

const voucherData = [
  {
    id: 1,
    title: "Mã giảm 15k",
    condition: "Đơn hàng từ 199k",
    code: "QTDLK",
    quantity: "100 mã",
    valueCoupon: 15000,
    valueDiscount: 0,
  },
  {
    id: 2,
    title: "Mã giảm 20k",
    condition: "Đơn hàng từ 249k",
    code: "QTDLK20",
    quantity: "100 mã",
    valueCoupon: 20000,
    valueDiscount: 0,
  },
  {
    id: 3,
    title: "Mã giảm 30k",
    condition: "Đơn hàng từ 299k",
    code: "QTDLK30",
    quantity: "100 mã",
    valueCoupon: 30000,
    valueDiscount: 0,
  },
  // Thêm các voucher khác tương tự
];

function VoucherItem({ voucher, onSelect }) {
  // Khi click nút "Sử dụng", gọi onSelect với code voucher
  const handleClick = () => {
    onSelect(voucher.code);
  };

  return (
    <div className="item-coupon">
      <div className="title-coupon">{voucher.title}</div>
      <div className="condition">{voucher.condition}</div>
      <div className="coupon-code">{voucher.code}</div>
      <div className="quantity">{voucher.quantity}</div>
      <button
        className="use-coupon-btn"
        onClick={handleClick}
        type="button"
        data-value-coupon={voucher.valueCoupon}
        data-value-discount={voucher.valueDiscount}
      >
        Sử dụng
      </button>
    </div>
  );
}

export default function VoucherList() {
  // Hàm xử lý khi chọn voucher
  const handleUseCoupon = (code) => {
    alert(`Bạn đã chọn voucher: ${code}`);
    // Ở đây bạn có thể thêm logic áp dụng mã coupon
  };

  return (
    <div className="list-coupon" style={{ transform: "translate3d(0px, 0px, 0px)" }}>
      {voucherData.map((voucher) => (
        <VoucherItem key={voucher.id} voucher={voucher} onSelect={handleUseCoupon} />
      ))}
    </div>
  );
}
