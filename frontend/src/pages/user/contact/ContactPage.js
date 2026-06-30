import { useState } from "react";
import { FaClipboardList, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt } from "react-icons/fa";
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
  const [form, setForm] = useState({
    name: "",
    phone: "",
    topic: "Tư vấn sản phẩm",
    message: "",
  });

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitContactForm = (event) => {
    event.preventDefault();
    const subject = encodeURIComponent(`[Liên hệ] ${form.topic}`);
    const body = encodeURIComponent(
      `Họ tên: ${form.name}\nSố điện thoại: ${form.phone}\nNội dung:\n${form.message}`,
    );
    window.location.href = `mailto:${STORE.email}?subject=${subject}&body=${body}`;
  };

  return (
    <main className="contact-page contact-redesign">
      <section className="contact-redesign__intro">
        <div>
          <span>Liên hệ</span>
          <h1>Kết nối với TINY Store</h1>
          <p>
            Chọn kênh phù hợp để được tư vấn sản phẩm, hỗ trợ đơn hàng hoặc gửi góp ý cho cửa hàng.
          </p>
        </div>

        <div className="contact-redesign__status">
          <span>Đang mở cửa</span>
          <strong>{STORE.hours}</strong>
        </div>
      </section>

      <section className="contact-redesign__hub" aria-label="Kênh liên hệ nhanh">
        <a className="contact-redesign__tile contact-redesign__tile--primary" href={`tel:${STORE.hotlineLabel.replace(/\s/g, "")}`}>
          <span>Hotline</span>
          <i className="contact-redesign__tile-icon" aria-hidden="true">
            <FaPhoneAlt />
          </i>
          <div>
            <strong>{STORE.hotlineLabel}</strong>
            <small>Tư vấn sản phẩm và hỗ trợ đơn hàng nhanh nhất.</small>
          </div>
        </a>

        <a className="contact-redesign__tile" href={`mailto:${STORE.email}`}>
          <span>Email</span>
          <i className="contact-redesign__tile-icon" aria-hidden="true">
            <FaEnvelope />
          </i>
          <div>
            <strong>{STORE.email}</strong>
            <small>Gửi thông tin chi tiết, hình ảnh hoặc góp ý dịch vụ.</small>
          </div>
        </a>

        <div className="contact-redesign__tile">
          <span>Cửa hàng</span>
          <i className="contact-redesign__tile-icon" aria-hidden="true">
            <FaMapMarkerAlt />
          </i>
          <div>
            <strong>{STORE.address}</strong>
            <small>Ghé trực tiếp trong khung giờ hoạt động của TINY Store.</small>
          </div>
        </div>

        <div className="contact-redesign__route">
          <span aria-hidden="true">
            <FaClipboardList />
          </span>
          <strong>Chuẩn bị mã đơn hoặc tên sản phẩm trước khi liên hệ</strong>
          <p>Thông tin càng cụ thể thì đội ngũ hỗ trợ xử lý yêu cầu càng nhanh.</p>
        </div>
      </section>

      <section className="contact-redesign__workspace">
        <form className="contact-redesign__form" onSubmit={submitContactForm}>
          <div className="contact-redesign__section-title">
            <span>Gửi yêu cầu</span>
            <h2>Để lại thông tin liên hệ</h2>
            <p>Điền vài thông tin cơ bản, hệ thống sẽ mở email để bạn gửi trực tiếp cho cửa hàng.</p>
          </div>

          <div className="contact-redesign__form-row">
            <label>
              Họ và tên
              <input
                type="text"
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
                placeholder="Nhập họ tên"
                required
              />
            </label>
            <label>
              Số điện thoại
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => updateForm("phone", event.target.value)}
                placeholder="Nhập số điện thoại"
                required
              />
            </label>
          </div>

          <label>
            Chủ đề
            <select value={form.topic} onChange={(event) => updateForm("topic", event.target.value)}>
              <option>Tư vấn sản phẩm</option>
              <option>Hỗ trợ đơn hàng</option>
              <option>Đổi trả và bảo hành</option>
              <option>Góp ý dịch vụ</option>
            </select>
          </label>

          <label>
            Nội dung
            <textarea
              value={form.message}
              onChange={(event) => updateForm("message", event.target.value)}
              placeholder="Bạn cần TINY Store hỗ trợ điều gì?"
              required
            />
          </label>

          <button type="submit">Gửi yêu cầu</button>
        </form>

        <aside className="contact-redesign__info">
          <div className="contact-redesign__section-title">
            <span>Thông tin cửa hàng</span>
            <h2>{STORE.name}</h2>
          </div>

          <div className="contact-redesign__info-list">
            <div>
              <span>Địa chỉ</span>
              <strong>{STORE.address}</strong>
            </div>
            <div>
              <span>Số điện thoại</span>
              <strong>{STORE.phoneLabel}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{STORE.email}</strong>
            </div>
          </div>

          <div className="contact-redesign__map">
            <iframe
              title="Bản đồ TINY Store"
              loading="lazy"
              src={`https://www.google.com/maps?q=${encodeURIComponent(STORE.address)}&output=embed`}
            />
          </div>
        </aside>
      </section>
    </main>
  );
};

export default ContactPage;
