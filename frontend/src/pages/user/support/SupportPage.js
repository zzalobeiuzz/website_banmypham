import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../../../constants";
import { UPLOAD_BASE } from "../../../constants";
import { ROUTERS } from "../../../utils/router";
import { useAuth } from "../context/AuthContext";
import "../contact/contact.scss";

const SUPPORT_PHONE = "0364670752";
const SUPPORT_PHONE_LABEL = "0364 670 752";
const FACEBOOK_MESSAGE_URL = "https://www.messenger.com/t/112296541854958";

const openWebChat = () => {
  try {
    window.dispatchEvent(new Event("open-web-chat"));
  } catch (error) {
    console.error(error);
  }
};

const openLoginPopup = () => {
  try {
    window.dispatchEvent(new Event("open-login"));
  } catch (error) {
    console.error(error);
  }
};

const SupportPage = () => {
  const { user } = useAuth();
  const isLoggedIn = Boolean(user && localStorage.getItem("accessToken"));
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    issueType: "",
    orderCode: "",
    message: "",
  });
  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const updateForm = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const submitSupportRequest = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("accessToken");

    if (!user || !token) {
      setSubmitStatus({ type: "error", message: "Bạn cần đăng nhập để gửi yêu cầu hỗ trợ." });
      openLoginPopup();
      return;
    }

    const message = String(form.message || "").trim();

    if (!message) {
      setSubmitStatus({ type: "error", message: "Vui lòng nhập nội dung cần hỗ trợ." });
      return;
    }

    setSubmitting(true);
    setSubmitStatus({ type: "", message: "" });

    try {
      const response = await fetch(`${API_BASE}/api/support-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || "Không thể gửi yêu cầu hỗ trợ.");
      }

      setForm({
        fullName: "",
        phone: "",
        issueType: "",
        orderCode: "",
        message: "",
      });
      setSubmitStatus({ type: "success", message: "Đã gửi yêu cầu hỗ trợ. Admin sẽ nhận được thông báo." });
    } catch (error) {
      setSubmitStatus({ type: "error", message: error.message || "Không thể gửi yêu cầu hỗ trợ." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="contact-page support-page">
      <section className="support-hero">
        <div className="support-hero__content">
          <div className="contact-breadcrumb">
            <Link to="/">Trang chủ</Link>
            <span>/</span>
            <strong>Hỗ trợ khách hàng</strong>
          </div>
          <span className="contact-eyebrow">Trung tâm hỗ trợ</span>
          <h1>Bạn cần hỗ trợ vấn đề gì?</h1>
          <p>
            Chọn kênh tương tác nhanh hoặc gửi nội dung vấn đề để TINY Store nắm rõ
            tình trạng bạn đang gặp và phản hồi phù hợp hơn.
          </p>
          <div className="support-hero__quick">
            <a href={FACEBOOK_MESSAGE_URL} target="_blank" rel="noopener noreferrer">Nhắn fanpage</a>
            <a href={`tel:${SUPPORT_PHONE}`}>Gọi hỗ trợ</a>
            <button type="button" onClick={openWebChat}>Chat trực tiếp</button>
          </div>
        </div>

        <div className="support-status-card">
          <img src={`${UPLOAD_BASE}/images/logo-removebg.png`} alt="TINY Store" loading="lazy" />
          <span>CSKH</span>
          <strong>Sẵn sàng tiếp nhận yêu cầu</strong>
          <p>Ưu tiên xử lý các nội dung có mã đơn hàng và mô tả rõ vấn đề.</p>
        </div>
      </section>

      <section className="support-action-grid">
        <a className="support-action support-action--facebook" href={FACEBOOK_MESSAGE_URL} target="_blank" rel="noopener noreferrer">
          <span>01</span>
          <strong>Nhắn fanpage</strong>
          <small>Gửi ảnh, câu hỏi, thông tin đơn hàng hoặc nội dung cần tư vấn.</small>
        </a>

        <a className="support-action support-action--phone" href={`tel:${SUPPORT_PHONE}`}>
          <span>02</span>
          <strong>Gọi hỗ trợ</strong>
          <small>{SUPPORT_PHONE_LABEL}</small>
        </a>

        <button type="button" className="support-action support-action--chat" onClick={openWebChat}>
          <span>03</span>
          <strong>Chat trực tiếp</strong>
          <small>Mở khung chat ngay trên website.</small>
        </button>

        <Link className="support-action support-action--order" to={`/${ROUTERS.USER.ORDER_LOOKUP}`}>
          <span>04</span>
          <strong>Tra cứu đơn</strong>
          <small>Kiểm tra trạng thái đơn hàng bằng mã đơn.</small>
        </Link>
      </section>

      <section className="support-workspace">
        <form className="contact-form contact-form--issue" onSubmit={submitSupportRequest}>
          <div className="contact-section-title">
            <span>Gặp vấn đề?</span>
            <h2>Viết nội dung cần hỗ trợ</h2>
            <p>Mô tả càng rõ thì cửa hàng càng dễ kiểm tra và phản hồi đúng vấn đề của bạn.</p>
          </div>

          <div className="contact-form__row">
            <label>
              Họ tên
              <input type="text" placeholder="Nhập họ tên của bạn" value={form.fullName} onChange={updateForm("fullName")} />
            </label>
            <label>
              Số điện thoại
              <input type="tel" placeholder="Nhập số điện thoại" value={form.phone} onChange={updateForm("phone")} />
            </label>
          </div>

          <div className="contact-form__row">
            <label>
              Loại vấn đề
              <select value={form.issueType} onChange={updateForm("issueType")}>
                <option value="" disabled>Chọn vấn đề bạn đang gặp</option>
                <option value="order">Đơn hàng</option>
                <option value="payment">Thanh toán</option>
                <option value="shipping">Giao hàng</option>
                <option value="product">Sản phẩm</option>
                <option value="return">Đổi trả</option>
                <option value="other">Khác</option>
              </select>
            </label>
            <label>
              Mã đơn hàng nếu có
              <input type="text" placeholder="VD: DH178..." value={form.orderCode} onChange={updateForm("orderCode")} />
            </label>
          </div>

          <label>
            Nội dung cần hỗ trợ
            <textarea rows="7" placeholder="Hãy mô tả vấn đề bạn gặp, sản phẩm liên quan, thời điểm phát sinh hoặc thông tin cần kiểm tra..." value={form.message} onChange={updateForm("message")} />
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? "Đang gửi..." : isLoggedIn ? "Gửi yêu cầu hỗ trợ" : "Đăng nhập để gửi yêu cầu"}
          </button>
          {submitStatus.message && (
            <div className={`support-submit-message support-submit-message--${submitStatus.type}`}>
              {submitStatus.message}
            </div>
          )}
          <small>
            Form này dùng để khách hàng ghi rõ vấn đề. Nếu cần phản hồi ngay,
            hãy dùng fanpage, điện thoại hoặc chat trực tiếp.
          </small>
        </form>

        <aside className="support-guide">
          <span>Gợi ý mô tả</span>
          <h2>Viết gì để được hỗ trợ nhanh hơn?</h2>
          <ul>
            <li>Mã đơn hàng nếu vấn đề liên quan đến đơn mua.</li>
            <li>Tên sản phẩm hoặc ảnh sản phẩm nếu cần tư vấn.</li>
            <li>Thời điểm phát sinh lỗi thanh toán/giao hàng.</li>
            <li>Số điện thoại để nhân viên liên hệ lại.</li>
          </ul>
        </aside>
      </section>
    </main>
  );
};

export default SupportPage;
