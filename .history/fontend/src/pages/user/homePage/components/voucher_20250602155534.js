import React from "react";
import "./componets.scss";

const vouchers = [
  {
    id: 55,
    title: "Giảm 75.000đ",
    detail: "Website đơn từ 799K, áp dụng với một số sản phẩm nhất định",
    code: "COCOLUX75K",
    progress: 1.28,
    btnData: {
      id: 55,
      name: "Website đơn từ 799K, áp dụng với một số sản phẩm nhất định",
      description: "GIẢM 75K CHO HOÁ ĐƠN TỪ 799K",
      depot_ids: ["161782"],
      start_date: "2025-04-04",
      end_date: "2025-05-31",
      from_value: 799000,
      number_of_codes: 1,
      total_used_time: 64,
      total_assign: 0,
      value_type: 1,
      value: "75.000",
      value_max: null,
      status: 1,
      active: 1,
      id_nhanh: 228,
      created_at: "2025-04-10T07:50:37.000000Z",
      updated_at: "2025-06-02T06:06:20.000000Z",
      products_add: null,
      ordering: null,
      options: "1",
      total_using_voucher: 4936,
      time_end_voucher: "2",
      progressbar: 1.28,
      items: {
        id: 37,
        code: "COCOLUX75K",
        voucher_id: 55,
        value: 75000,
        value_type: 1,
        value_max: null,
        can_used_times: 5000,
        used_times: 64,
        status: 1,
        created_at: "2025-05-14T04:30:53.000000Z",
        updated_at: "2025-06-02T06:06:20.000000Z",
        ordering: null,
        options: null,
      },
    },
  },
  // Bạn có thể thêm voucher khác ở đây
];

const VoucherItem = ({ voucher }) => {
  return (
    <div className="owl-item active" style={{ width: "330px" }}>
      <div className="item-coupon">
        <div className="d-flex align-items-center justify-content-between">
          <div className="box-coupon box-coupon-left text-center">
            <svg
              width="50"
              height="50"
              viewBox="0 0 50 50"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="25" cy="25" r="25" fill="#C73030"></circle>
              {/* icon path giữ nguyên */}
              <path
                d="M15 37.5V23.75H12.5V16.25H19C18.8958..."
                fill="white"
              />
            </svg>
          </div>
          <div className="box-coupon box-coupon-right w-100">
            <p className="sub-title-coupon">{voucher.title}</p>
            <div className="voucher-detail pb-2">{voucher.detail}</div>
            <div className="progress">
              <div
                className="progress-bar bg-danger"
                role="progressbar"
                style={{ width: `${voucher.progress}%` }}
                aria-valuenow={voucher.progress}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
            <div className="d-flex justify-content-between align-items-center mt-1">
              <button
                type="button"
                className="btn btn-call-modal p-0 btn-value"
                data-value-coupon={JSON.stringify(voucher.btnData)}
                data-bs-toggle="modal"
                data-bs-target="#info-coupon-detail"
              >
                Chi tiết
              </button>
              <button
                type="button"
                className="btn btn-dark btn-copy"
                data-coupon={voucher.code}
              >
                Sao chép
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Voucher = () => {
  return (
    <div className="list-coupon">
      <h2 className="text-center">Mã khuyến mại</h2>
      <div className="slide-main-coupon">
        <div className="slide-template-slide-coupon owl-carousel justify-content-center owl-loaded owl-drag">
          <div className="owl-stage-outer">
            <div
              className="owl-stage"
              style={{
                transform: "translate3d(0px, 0px, 0px)",
                transition: "all",
                width: `${vouchers.length * 330}px`,
              }}
            >
              {vouchers.map((voucher) => (
                <VoucherItem key={voucher.id} voucher={voucher} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Voucher;
