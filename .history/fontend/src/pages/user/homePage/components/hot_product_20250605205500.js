import React from "react";

const hot_product = () => {
    return (
        <div className="slide-template bg-white mb-4 pt-2">
            <div className="slide-top">
                <a href="/" className="slide-title d-flex align-items-center gap-2">
                    <img
                        data-src="https://cocolux.com/images/hot_tag.svg"
                        alt="flash deal icon"
                        className="img-fluid lazy entered loaded"
                        height="18"
                        width="18"
                        data-ll-status="loaded"
                        src="https://cocolux.com/images/hot_tag.svg"
                    ></img>
                    <h2>Sản phẩm hot</h2>{" "}
                </a>
                <a href="https://cocolux.com/item-hot" class="slide-more">
                    Xem tất cả
                </a>
            </div>
            <div className="slide-main">
                <div className="slide-template-slide owl-carousel owl-loaded owl-drag">
                    <div className="owl-stage-outer">
                        <div className="owl-stage">
                            <div className="owl-item">
                                <a href="/" className="product-template">
                                    <div className="product-thumbnail position-relative   image-frame1 ">
                                        <picture>
                                            <source
                                                srcSet="https://cocolux.com/storage/upload_image/images/cdn_images/8936217700841.webp"
                                                type="image/webp"
                                            />
                                            <img
                                                src="https://cocolux.com/storage/upload_image/images/cdn_images/8936217700841.jpg"
                                                alt="Nước Tẩy Trang Cocoon Winter Melon Micellar Water Chiết Xuất Bí Đao 50ml"
                                                className="img-fluid"
                                            />
                                        </picture>
                                    </div>
                                    <div className="product-price px-2">
                                    <div className="public-price">500.000đ'</div>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default hot_product;
