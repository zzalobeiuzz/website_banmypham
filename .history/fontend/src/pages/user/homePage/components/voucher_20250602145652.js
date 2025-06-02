import React from "react";

const Voucher = () => {
    return(
    <div class="list-coupon">
        <h2 class="text-center">Mã khuyến mại</h2>
        <div class="slide-main-coupon">
            <div class="slide-template-slide-coupon owl-carousel justify-content-center owl-loaded owl-drag">
                <div class="owl-stage-outer">
                    <div
                        class="owl-stage"
                        style="transform: translate3d(0px, 0px, 0px); transition: all; width: 1320px;"
                    >
                        <div class="owl-item active" style="width: 330px;">
                            <div class="item-coupon">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div class="box-coupon box-coupon-left text-center">
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
                                            ></path>
                                        </svg>
                                    </div>
                                    <div class="box-coupon box-coupon-right w-100">
                                        <p class="sub-title-coupon">Giảm 75.000đ</p>
                                        <div class="voucher-detail pb-2">
                                            Website đơn từ 799K, áp dụng với một số sản phẩm nhất định
                                        </div>
                                        <div class="progress">
                                            <div
                                                class="progress-bar bg-danger"
                                                role="progressbar"
                                                style="width: 1.28%"
                                                aria-valuenow="1.28"
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                                aria-label="Progress: 1.28%"
                                            ></div>
                                        </div>

                                        <div class="d-flex justify-content-between align-items-center mt-1">
                                            <button
                                                type="button"
                                                class="btn btn-call-modal p-0 btn-value"
                                                data-value-coupon='{"id":55,"name":"Website \u0111\u01a1n t\u1eeb 799K, \u00e1p d\u1ee5ng v\u1edbi m\u1ed9t s\u1ed1 s\u1ea3n ph\u1ea9m nh\u1ea5t \u0111\u1ecbnh","description":"GI\u1ea2M 75K CHO HO\u00c1 \u0110\u01a0N T\u1eea 799K","depot_ids":"[\"161782\"]","start_date":"2025-04-04","end_date":"2025-05-31","from_value":799000,"number_of_codes":1,"total_used_time":64,"total_assign":0,"value_type":1,"value":"75.000","value_max":null,"status":1,"active":1,"id_nhanh":228,"created_at":"2025-04-10T07:50:37.000000Z","updated_at":"2025-06-02T06:06:20.000000Z","products_add":null,"ordering":null,"options":"1","total_using_voucher":4936,"time_end_voucher":"2","progressbar":1.28,"items":{"id":37,"code":"COCOLUX75K","voucher_id":55,"value":75000,"value_type":1,"value_max":null,"can_used_times":5000,"used_times":64,"status":1,"created_at":"2025-05-14T04:30:53.000000Z","updated_at":"2025-06-02T06:06:20.000000Z","ordering":null,"options":null}}'
                                                data-bs-toggle="modal"
                                                data-bs-target="#info-coupon-detail"
                                            >
                                                Chi tiết
                                            </button>
                                            <button
                                                type="button"
                                                class="btn btn-dark btn-copy"
                                                data-coupon="COCOLUX75K"
                                            >
                                                Sao chép
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="owl-item active" style="width: 330px;">
                            <div class="item-coupon">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div class="box-coupon box-coupon-left text-center">
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
                                            ></path>
                                        </svg>
                                    </div>
                                    <div class="box-coupon box-coupon-right w-100">
                                        <p class="sub-title-coupon">Giảm 55.000đ</p>
                                        <div class="voucher-detail pb-2">
                                            Website đơn từ 599K, áp dụng với một số sản phẩm nhất định
                                        </div>
                                        <div class="progress">
                                            <div
                                                class="progress-bar bg-danger"
                                                role="progressbar"
                                                style="width: 1%"
                                                aria-valuenow="1"
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                                aria-label="Progress: 1%"
                                            ></div>
                                        </div>

                                        <div class="d-flex justify-content-between align-items-center mt-1">
                                            <button
                                                type="button"
                                                class="btn btn-call-modal p-0 btn-value"
                                                data-value-coupon='{"id":56,"name":"Website \u0111\u01a1n t\u1eeb 599K, \u00e1p d\u1ee5ng v\u1edbi m\u1ed9t s\u1ed1 s\u1ea3n ph\u1ea9m nh\u1ea5t \u0111\u1ecbnh","description":"GI\u1ea2M 55K CHO HO\u00c1 \u0110\u01a0N T\u1eea 599K","depot_ids":"[\"161782\"]","start_date":"2025-04-04","end_date":"2025-05-31","from_value":599000,"number_of_codes":1,"total_used_time":50,"total_assign":0,"value_type":1,"value":"55.000","value_max":null,"status":1,"active":1,"id_nhanh":227,"created_at":"2025-04-10T07:50:38.000000Z","updated_at":"2025-06-02T03:29:42.000000Z","products_add":null,"ordering":null,"options":"1","total_using_voucher":4950,"time_end_voucher":"2","progressbar":1,"items":{"id":38,"code":"COCOLUX55K","voucher_id":56,"value":55000,"value_type":1,"value_max":null,"can_used_times":5000,"used_times":50,"status":1,"created_at":"2025-05-14T04:30:54.000000Z","updated_at":"2025-06-02T03:29:42.000000Z","ordering":null,"options":null}}'
                                                data-bs-toggle="modal"
                                                data-bs-target="#info-coupon-detail"
                                            >
                                                Chi tiết
                                            </button>
                                            <button
                                                type="button"
                                                class="btn btn-dark btn-copy"
                                                data-coupon="COCOLUX55K"
                                            >
                                                Sao chép
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="owl-item active" style="width: 330px;">
                            <div class="item-coupon">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div class="box-coupon box-coupon-left text-center">
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
                                            ></path>
                                        </svg>
                                    </div>
                                    <div class="box-coupon box-coupon-right w-100">
                                        <p class="sub-title-coupon">Giảm 35.000đ</p>
                                        <div class="voucher-detail pb-2">
                                            Website đơn từ 399K, áp dụng với một số sản phẩm nhất định
                                        </div>
                                        <div class="progress">
                                            <div
                                                class="progress-bar bg-danger"
                                                role="progressbar"
                                                style="width: 1.82%"
                                                aria-valuenow="1.82"
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                                aria-label="Progress: 1.82%"
                                            ></div>
                                        </div>

                                        <div class="d-flex justify-content-between align-items-center mt-1">
                                            <button
                                                type="button"
                                                class="btn btn-call-modal p-0 btn-value"
                                                data-value-coupon='{"id":57,"name":"Website \u0111\u01a1n t\u1eeb 399K, \u00e1p d\u1ee5ng v\u1edbi m\u1ed9t s\u1ed1 s\u1ea3n ph\u1ea9m nh\u1ea5t \u0111\u1ecbnh","description":"GI\u1ea2M 35K CHO HO\u00c1 \u0110\u01a0N T\u1eea 399K","depot_ids":"[\"161782\"]","start_date":"2025-04-04","end_date":"2025-05-31","from_value":399000,"number_of_codes":1,"total_used_time":91,"total_assign":0,"value_type":1,"value":"35.000","value_max":null,"status":1,"active":1,"id_nhanh":226,"created_at":"2025-04-10T07:50:38.000000Z","updated_at":"2025-05-30T13:50:05.000000Z","products_add":null,"ordering":null,"options":"1","total_using_voucher":4909,"time_end_voucher":"2","progressbar":1.82,"items":{"id":39,"code":"COCOLUX35K","voucher_id":57,"value":35000,"value_type":1,"value_max":null,"can_used_times":5000,"used_times":91,"status":1,"created_at":"2025-05-14T04:30:54.000000Z","updated_at":"2025-05-30T13:50:05.000000Z","ordering":null,"options":null}}'
                                                data-bs-toggle="modal"
                                                data-bs-target="#info-coupon-detail"
                                            >
                                                Chi tiết
                                            </button>
                                            <button
                                                type="button"
                                                class="btn btn-dark btn-copy"
                                                data-coupon="COCOLUX35K"
                                            >
                                                Sao chép
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="owl-item active" style="width: 330px;">
                            <div class="item-coupon">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div class="box-coupon box-coupon-left text-center">
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
                                            ></path>
                                        </svg>
                                    </div>
                                    <div class="box-coupon box-coupon-right w-100">
                                        <p class="sub-title-coupon">Giảm 25.000đ</p>
                                        <div class="voucher-detail pb-2">
                                            Website đơn từ 299K, áp dụng với một số sản phẩm nhất định
                                        </div>
                                        <div class="progress">
                                            <div
                                                class="progress-bar bg-danger"
                                                role="progressbar"
                                                style="width: 1.94%"
                                                aria-valuenow="1.94"
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                                aria-label="Progress: 1.94%"
                                            ></div>
                                        </div>

                                        <div class="d-flex justify-content-between align-items-center mt-1">
                                            <button
                                                type="button"
                                                class="btn btn-call-modal p-0 btn-value"
                                                data-value-coupon='{"id":58,"name":"Website \u0111\u01a1n t\u1eeb 299K, \u00e1p d\u1ee5ng v\u1edbi m\u1ed9t s\u1ed1 s\u1ea3n ph\u1ea9m nh\u1ea5t \u0111\u1ecbnh","description":"GI\u1ea2M 25K CHO HO\u00c1 \u0110\u01a0N T\u1eea 299K","depot_ids":"[\"161782\"]","start_date":"2025-04-04","end_date":"2025-05-31","from_value":299000,"number_of_codes":1,"total_used_time":96,"total_assign":0,"value_type":1,"value":"25.000","value_max":null,"status":1,"active":1,"id_nhanh":225,"created_at":"2025-04-10T07:50:38.000000Z","updated_at":"2025-06-02T07:26:12.000000Z","products_add":null,"ordering":null,"options":"1","total_using_voucher":4903,"time_end_voucher":"2","progressbar":1.94,"items":{"id":40,"code":"COCOLUX25K","voucher_id":58,"value":25000,"value_type":1,"value_max":null,"can_used_times":5000,"used_times":97,"status":1,"created_at":"2025-05-14T04:30:55.000000Z","updated_at":"2025-06-02T07:26:12.000000Z","ordering":null,"options":null}}'
                                                data-bs-toggle="modal"
                                                data-bs-target="#info-coupon-detail"
                                            >
                                                Chi tiết
                                            </button>
                                            <button
                                                type="button"
                                                class="btn btn-dark btn-copy"
                                                data-coupon="COCOLUX25K"
                                            >
                                                Sao chép
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="owl-nav disabled">
                    <button type="button" role="presentation" class="owl-prev">
                        <span aria-label="Previous">‹</span>
                    </button>
                    <button type="button" role="presentation" class="owl-next">
                        <span aria-label="Next">›</span>
                    </button>
                </div>
                <div class="owl-dots disabled"></div>
            </div>
        </div>
    </div>);
};
export default Voucher;
