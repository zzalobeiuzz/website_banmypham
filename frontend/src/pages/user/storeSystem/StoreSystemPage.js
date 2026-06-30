import {
  FaCheckCircle,
  FaClock,
  FaDirections,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaStore,
  FaTags,
} from "react-icons/fa";
import "./store_system.scss";

const store = {
  name: "Tiny Cosmetics Sa Thầy",
  address: "405 Đường Trần Hưng Đạo, Sa Thầy, Quảng Ngãi",
  phone: "0737238721",
  email: "storetiny82@gmail.com",
  hours: "08:00 - 21:00",
};

const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(store.address)}&output=embed`;
const directionUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`;

const serviceItems = [
  {
    icon: <FaCheckCircle />,
    title: "Tư vấn trực tiếp",
    text: "Hỗ trợ chọn sản phẩm phù hợp với nhu cầu chăm sóc da và làm đẹp.",
  },
  {
    icon: <FaStore />,
    title: "Kiểm tra sản phẩm",
    text: "Khách có thể xem mã sản phẩm, giá và tình trạng còn hàng tại cửa hàng.",
  },
  {
    icon: <FaTags />,
    title: "Nhận ưu đãi",
    text: "Các chương trình khuyến mãi được cập nhật thường xuyên theo từng đợt.",
  },
];

const StoreSystemPage = () => {
  return (
    <main className="store-system-page store-locator">
      <section className="store-locator__intro">
        <div>
          <h1>Điểm bán Tiny Cosmetics</h1>
          <p>Tra cứu vị trí, giờ mở cửa và thông tin liên hệ của cửa hàng đang hoạt động.</p>
        </div>
        <a href={directionUrl} target="_blank" rel="noreferrer">
          <FaDirections />
          Chỉ đường
        </a>
      </section>

      <section className="store-locator__workspace">
        <div className="store-locator__map">
          <iframe
            title="Bản đồ Tiny Cosmetics Sa Thầy"
            src={mapSrc}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <aside className="store-locator__panel">
          <div className="store-locator__status">
            <span>Đang hoạt động</span>
            <strong>Cơ sở 01</strong>
          </div>

          <div className="store-locator__store">
            <div className="store-locator__store-icon">
              <FaStore />
            </div>
            <div>
              <h2>{store.name}</h2>
              <p>{store.address}</p>
            </div>
          </div>

          <div className="store-locator__facts">
            <div>
              <FaClock />
              <span>Giờ mở cửa</span>
              <strong>{store.hours}</strong>
            </div>
            <a href={`tel:${store.phone}`}>
              <FaPhoneAlt />
              <span>Điện thoại</span>
              <strong>{store.phone}</strong>
            </a>
            <a href={`mailto:${store.email}`}>
              <FaEnvelope />
              <span>Email</span>
              <strong>{store.email}</strong>
            </a>
          </div>

          <div className="store-locator__actions">
            <a href={directionUrl} target="_blank" rel="noreferrer">
              <FaMapMarkerAlt />
              Mở bản đồ
            </a>
            <a href={`tel:${store.phone}`}>
              <FaPhoneAlt />
              Gọi cửa hàng
            </a>
          </div>
        </aside>
      </section>

      <section className="store-locator__services" aria-label="Dịch vụ tại cửa hàng">
        {serviceItems.map((item) => (
          <article key={item.title}>
            <span>{item.icon}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
};

export default StoreSystemPage;
