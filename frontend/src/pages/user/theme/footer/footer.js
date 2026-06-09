import "bootstrap/dist/css/bootstrap.min.css";
import { memo } from "react";
import { Link } from "react-router-dom";
import { UPLOAD_BASE } from "../../../../constants";
import "./footer.scss";

const MAP_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d87446.40016390059!2d107.80578528435586!3d14.391302934621212!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x316bf7b43a4b4d47%3A0x95fc9633e9f89e08!2zTeG7uSBwaOG6qW0gVElOWSggVGlueSBjb3NtZXRpY3Mp!5e0!3m2!1svi!2sus!4v1781018937862!5m2!1svi!2sus";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <section className="footer__brand">
          <Link to="/" className="footer__logo-link" aria-label="Về trang chủ">
            <img
              className="footer__logo"
              src={`${UPLOAD_BASE}/images/logo-removebg.png`}
              alt="TINY Store"
              loading="lazy"
            />
          </Link>
          <p>
            TINY Store phân phối mỹ phẩm chính hãng, tập trung vào sản phẩm
            chất lượng, tư vấn rõ ràng và trải nghiệm mua sắm đáng tin cậy.
          </p>
          <div className="footer__contact-list">
            <a href="tel:0334383068">Hotline: 0334 383 068</a>
            <a href="mailto:storetiny82@gmail.com">Email: storetiny82@gmail.com</a>
            <span>Thời gian hỗ trợ: 8:00 - 21:30</span>
          </div>
        </section>

        <section className="footer__links">
          <div>
            <h3>Về TINY Shop</h3>
            <Link to="/">Về chúng tôi</Link>
            <Link to="/">Câu chuyện thương hiệu</Link>
            <Link to="/">Liên hệ</Link>
          </div>
          <div>
            <h3>Chính sách</h3>
            <Link to="/">Giao nhận và thanh toán</Link>
            <Link to="/">Bảo mật thông tin</Link>
            <Link to="/">Điều khoản sử dụng</Link>
            <Link to="/">Khách hàng thân thiết</Link>
          </div>
        </section>

        <section className="footer__social">
          <div className="footer__section-head">
            <h3>Facebook</h3>
          </div>
          <div className="footer__facebook-card">
            <img
              className="footer__facebook-logo"
              src={`${UPLOAD_BASE}/images/logo-removebg.png`}
              alt="TINY Store"
              loading="lazy"
            />
            <div className="footer__facebook-info">
              <div className="footer__facebook-name">TINY Store</div>
              <p>Fanpage chính thức của cửa hàng.</p>
            </div>
          </div>
        </section>

        <section className="footer__map">
          <div className="footer__section-head">
            <h3>Địa chỉ cửa hàng</h3>
            <a
              href="https://www.google.com/maps/search/?api=1&query=405%20Tr%E1%BA%A7n%20H%C6%B0ng%20%C4%90%E1%BA%A1o%2C%20Kon%20Tum%2C%20Vi%E1%BB%87t%20Nam"
              target="_blank"
              rel="noreferrer"
            >
              Chỉ đường
            </a>
          </div>
          <p>Số 405, Trần Hưng Đạo, Sa Thầy, Kon Tum, Việt Nam</p>
          <div className="footer__map-frame">
            <iframe
              title="Bản đồ TINY Store"
              src={MAP_EMBED_URL}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </section>

        <div className="footer__bottom">
          <span>
            TINY Store - Hệ thống phân phối mỹ phẩm chính hãng.
          </span>
          <span>© 2026 TINY Store. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};

export default memo(Footer);
