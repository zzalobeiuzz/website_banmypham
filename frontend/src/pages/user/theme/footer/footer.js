import "bootstrap/dist/css/bootstrap.min.css";
import { memo } from "react";
import { Link } from "react-router-dom";
import { UPLOAD_BASE } from "../../../../constants";
import "./footer.scss";

const STORE_ADDRESS = "405 Đường Trần Hưng Đạo, Sa Thầy, Quảng Ngãi";
const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(STORE_ADDRESS)}&output=embed`;
const MAP_DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_ADDRESS)}`;

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
              href={MAP_DIRECTIONS_URL}
              target="_blank"
              rel="noreferrer"
            >
              Chỉ đường
            </a>
          </div>
          <p>{STORE_ADDRESS}</p>
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
