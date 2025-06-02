import React from "react";
import "./componets.scss";

const Voucher = () => {
  return (
    <div className="list-coupon">
      <h2 className="text-center">Mã khuyến mại</h2>
      <div className="slide-main-coupon">
        <div className="slide-template-slide-coupon owl-carousel justify-content-center owl-loaded owl-drag">
          <div className="owl-stage-outer">
            <div
              className="owl-stage"
              style={{ transform: "translate3d(0px, 0px, 0px)", transition: "all", width: "1320px" }}
            >
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
                        <path
                          d="M15 37.5V23.75H12.5V16.25H19C18.8958 16.0625 18.8281 15.8646 18.7969 15.6562C18.7656 15.4479 18.75 15.2292 18.75 15C18.75 13.9583 19.1146 13.0729 19.8438 12.3438C20.5729 11.6146 21.4583 11.25 22.5 11.25C22.9792 11.25 23.4271 11.3385 23.8438 11.5156C24.2604 11.6927 24.6458 11.9375 25 12.25C25.3542 11.9167 25.7396 11.6667 26.1562 11.5C26.5729 11.3333 27.0208 11.25 27.5 11.25C28.5417 11.25 29.4271 11.6146 30.1562 12.3438C30.8854 13.0729 31.25 13.9583 31.25 15C31.25 15.2292 31.2292 15.4427 31.1875 15.6406C31.1458 15.8385 31.0833 16.0417 31 16.25H37.5V23.75H35V37.5H15ZM27.5 13.75C27.1458 13.75 26.849 13.8698 26.6094 14.1094C26.3698 14.349 26.25 14.6458 26.25 15C26.25 15.3542 26.3698 15.651 26.6094 15.8906C26.849 16.1302 27.1458 16.25 27.5 16.25C27.8542 16.25 28.151 16.1302 28.3906 15.8906C28.6302 15.651 28.75 15.3542 28.75 15C28.75 14.6458 28.6302 14.349 28.3906 14.1094C28.151 13.8698 27.8542 13.75 27.5 13.75ZM21.25 15C21.25 15.3542 21.3698 15.651 21.6094 15.8906C21.849 16.1302 22.1458 16.25 22.5 16.25C22.8542 16.25 23.151 16.1302 23.3906 15.8906C23.6302 15.651 23.75 15.3542 23.75 15C23.75 14.6458 23.6302 14.349 23.3906 14.1094C23.151 13.8698 22.8542 13.75 22.5 13.75C22.1458 13.75 21.849 13.8698 21.6094 14.1094C21.3698 14.349 21.25 14.6458 21.25 15ZM15 18.75V21.25H23.75V18.75H15ZM23.75 35V23.75H17.5V35H23.75ZM26.25 35H32.5V23.75H26.25V35ZM35 21.25V18.75H26.25V21.25H35Z"
                          fill="white"
                        />
                      </svg>
                    </div>
                    <div className="box-coupon box-coupon-right w-100">
                      <p className="sub-title-coupon">Giảm 75.000đ</p>
                      <div className="voucher-detail pb-2">
                        Website đơn từ 799K, áp dụng với một số sản phẩm nhất định
                      </div>
                      <div className="progress">
                        <div
                          className="progress-bar bg-danger"
                          role="progressbar"
                          style={{ width: "1.28%" }}
                          aria-valuenow={1.28}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label="Progress: 1.28%"
                        ></div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <button
                          type="button"
                          className="btn btn-call-modal p-0 btn-value"
                          data-value-coupon={JSON.stringify({
                            id: 55,
                            name: "Website đơn từ 799K, áp dụng với một số sản phẩm nhất định",
                            description: "GIẢM 75K CHO HOÁ ĐƠN TỪ 799K",
                            depot_ids: ['161782'],
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
                          })}
                          data-bs-toggle="modal"
                          data-bs-target="#info-coupon-detail"
                        >
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          className="btn btn-dark btn-copy"
                          data-coupon="COCOLUX75K"
                        >
                          Sao chép
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bạn có thể lặp lại các phần tử coupon tương tự cho các voucher khác */}
              {/* Ví dụ voucher 2, voucher 3... */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Voucher;
