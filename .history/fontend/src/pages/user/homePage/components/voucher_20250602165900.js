import React from "react";
import "./componets.scss";

const vouchers = [
  {
    id: 55,
    title: "GIẢM 75K CHO HOÁ ĐƠN TỪ 799K",
    detail: "Website đơn từ 799K, áp dụng với một số sản phẩm nhất định",
    code: "COCOLUX75K",
    progress: 1.28,
  },
  {
    id: 56,
    title: "GIẢM 55K CHO HOÁ ĐƠN TỪ 599K",
    detail: "Website đơn từ 599K, áp dụng với một số sản phẩm nhất định",
    code: "COCOLUX55K",
    progress: 1,
  },
  {
    id: 57,
    title: "GIẢM 45K CHO HOÁ ĐƠN TỪ 499K",
    detail: "Website đơn từ 499K, áp dụng với một số sản phẩm nhất định",
    code: "COCOLUX45K",
    progress: 1,
  },
  {
    id: 58,
    title: "GIẢM 35K CHO HOÁ ĐƠN TỪ 299K","Website đơn từ 299K, áp dụng với một số sản phẩm nhất định",
    detail: 
    code: "COCOLUX35K",
    progress: 0.98,
  },
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
              <path d="M15 37.5V23.75H12.5V16.25H19C18.8958..." fill="white" />
            </svg>
          </div>
          <div className="box-coupon box-coupon-right w-100">
            <p className="sub-title-coupon">{voucher.detail}</p>
            <div className="voucher-detail pb-2">{voucher.title}</div>
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
