import { UPLOAD_BASE } from "../../../constants";
import "./contact.scss";

const STORE = {
  name: "TINY Store",
  phoneLabel: "0364 670 752",
  hotlineLabel: "0334 383 068",
  email: "storetiny82@gmail.com",
  address: "405 Đường Trần Hưng Đạo, Sa Thầy, Quảng Ngãi",
  hours: "08:00 - 21:30",
};

const ContactPage = () => {
  return (
    <main className="contact-page contact-page--store contact-page--static">
      <section className="contact-hero store-hero">
        <div className="contact-hero__content">
          <span className="contact-eyebrow">Thông tin shop</span>
          <h1>{STORE.name}</h1>
          <p>
            Thông tin chính thức của cửa hàng được trình bày gọn gàng để khách hàng
            dễ kiểm tra địa chỉ, số điện thoại, email và thời gian hoạt động.
          </p>
        </div>

        <div className="store-hero__card" aria-label={STORE.name}>
          <img src={`${UPLOAD_BASE}/images/logo-removebg.png`} alt={STORE.name} loading="lazy" />
          <div>
            <strong>{STORE.name}</strong>
            <span>Mỹ phẩm bán lẻ chính hãng</span>
          </div>
        </div>
      </section>

      <section className="shop-profile">
        <div className="shop-profile__heading">
          <span>Hồ sơ cửa hàng</span>
          <h2>Thông tin liên hệ chính thức</h2>
          <p>Tất cả thông tin dưới đây chỉ dùng để khách hàng kiểm tra và lưu lại khi cần.</p>
        </div>

        <div className="shop-profile__body">
          <div className="shop-profile__identity">
            <img src={`${UPLOAD_BASE}/images/logo-removebg.png`} alt={STORE.name} loading="lazy" />
            <strong>{STORE.name}</strong>
            <span>Thông tin shop</span>
          </div>

          <div className="shop-profile__grid">
            <article>
              <span>Địa chỉ</span>
              <strong>{STORE.address}</strong>
            </article>
            <article>
              <span>Số điện thoại</span>
              <strong>{STORE.phoneLabel}</strong>
            </article>
            <article>
              <span>Hotline</span>
              <strong>{STORE.hotlineLabel}</strong>
            </article>
            <article>
              <span>Email</span>
              <strong>{STORE.email}</strong>
            </article>
            <article>
              <span>Thời gian mở cửa</span>
              <strong>{STORE.hours}</strong>
            </article>
            <article>
              <span>Tên cửa hàng</span>
              <strong>{STORE.name}</strong>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ContactPage;
