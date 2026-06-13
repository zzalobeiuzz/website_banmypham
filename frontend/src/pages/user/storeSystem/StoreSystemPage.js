import { UPLOAD_BASE } from "../../../constants";
import "./store_system.scss";

const store = {
  name: "Tiny Cosmetics Sa Thầy",
  address: "405 Đường Trần Hưng Đạo, Sa Thầy, Quảng Ngãi",
  phone: "0737238721",
  email: "storetiny82@gmail.com",
  hours: "08:00 - 21:00",
};

const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(store.address)}&output=embed`;

const StoreSystemPage = () => {
  return (
    <main className="store-system-page">
      <section className="store-system-hero">
        <div className="store-system-hero__content">
          <span>Hệ thống cửa hàng</span>
          <h1>Ghé Tiny Cosmetics tại Sa Thầy</h1>
          <p>
            Hiện tại cửa hàng có 1 cơ sở phục vụ khách mua mỹ phẩm, chăm sóc da,
            trang điểm và các sản phẩm làm đẹp hằng ngày.
          </p>
        </div>

        <div className="store-system-hero__logo" aria-label="Tiny Cosmetics">
          <img src={`${UPLOAD_BASE}/images/logo-removebg.png`} alt="Tiny Cosmetics" loading="lazy" />
        </div>
      </section>

      <section className="store-system-overview">
        <article className="store-system-card store-system-card--main">
          <div className="store-system-card__top">
            <span>Cơ sở 01</span>
            <strong>Đang hoạt động</strong>
          </div>
          <h2>{store.name}</h2>
          <p>{store.address}</p>

          <div className="store-system-info-grid">
            <div>
              <span>Giờ mở cửa</span>
              <strong>{store.hours}</strong>
            </div>
            <div>
              <span>Điện thoại</span>
              <a href={`tel:${store.phone}`}>{store.phone}</a>
            </div>
            <div>
              <span>Email</span>
              <a href={`mailto:${store.email}`}>{store.email}</a>
            </div>
          </div>

          <div className="store-system-actions">
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`} target="_blank" rel="noreferrer">
              Chỉ đường
            </a>
            <a href={`tel:${store.phone}`}>Gọi cửa hàng</a>
          </div>
        </article>

        <div className="store-system-services">
          <article>
            <span>01</span>
            <h3>Tư vấn trực tiếp</h3>
            <p>Hỗ trợ chọn sản phẩm phù hợp với nhu cầu chăm sóc da và làm đẹp.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Kiểm tra sản phẩm</h3>
            <p>Khách có thể xem hình ảnh, mã sản phẩm, giá và tình trạng còn hàng.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Nhận ưu đãi</h3>
            <p>Các chương trình khuyến mãi đang diễn ra được cập nhật thường xuyên.</p>
          </article>
        </div>
      </section>

      <section className="store-system-map-section">
        <div className="store-system-section-title">
          <span>Bản đồ</span>
          <h2>Địa chỉ cửa hàng</h2>
          <p>{store.address}</p>
        </div>

        <div className="store-system-map">
          <iframe
            title="Bản đồ Tiny Cosmetics Sa Thầy"
            src={mapSrc}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </main>
  );
};

export default StoreSystemPage;
