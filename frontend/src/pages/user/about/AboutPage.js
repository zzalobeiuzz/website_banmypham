import { Link } from "react-router-dom";
import { UPLOAD_BASE } from "../../../constants";
import { ROUTERS } from "../../../utils/router";
import "./about.scss";

const AboutPage = () => {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="about-hero__content">
          <span className="about-eyebrow">Về chúng tôi</span>
          <h1>Đồng hành cùng bạn trong hành trình làm đẹp mỗi ngày</h1>
          <p>
            Chúng tôi là cửa hàng bán lẻ mỹ phẩm và sản phẩm chăm sóc sắc đẹp,
            tập trung vào những lựa chọn dễ dùng, rõ nguồn gốc và phù hợp với
            nhu cầu chăm sóc cá nhân hằng ngày.
          </p>
          <div className="about-hero__actions">
            <Link to="/all-products/all">Khám phá sản phẩm</Link>
            <Link to={`/${ROUTERS.USER.PROMOTIONS}`}>Xem khuyến mãi</Link>
          </div>
        </div>

        <div className="about-hero__brand" aria-label="Logo cửa hàng">
          <div className="about-hero__logo-card">
            <img
              src={`${UPLOAD_BASE}/images/logo-removebg.png`}
              alt="Logo cửa hàng"
              loading="lazy"
            />
          </div>
          <div className="about-hero__note">
            <strong>Mỹ phẩm bán lẻ</strong>
            <span>Chăm sóc da, trang điểm, chăm sóc cơ thể và nhiều hơn nữa.</span>
          </div>
        </div>
      </section>

      <section className="about-intro">
        <div className="about-section-title">
          <span>Câu chuyện</span>
          <h2>Một cửa hàng nhỏ với tiêu chuẩn chọn hàng rõ ràng</h2>
        </div>
        <div className="about-intro__text">
          <p>
            Chúng tôi bắt đầu từ một nhu cầu rất quen thuộc: tìm được mỹ phẩm
            phù hợp mà không phải lạc giữa quá nhiều lựa chọn. Vì vậy, cửa hàng
            được xây dựng như một nơi mua sắm gọn gàng, dễ hiểu và thực tế, nơi
            khách hàng có thể xem sản phẩm, so sánh giá, kiểm tra tồn kho và
            chọn món mình cần một cách nhanh chóng.
          </p>
          <p>
            Danh mục của chúng tôi bao gồm sản phẩm chăm sóc da, sữa rửa mặt,
            kem dưỡng, chống nắng, trang điểm, nước hoa, chăm sóc tóc và cơ thể.
            Mỗi sản phẩm được ưu tiên theo các tiêu chí: thông tin minh bạch,
            giá hợp lý, tình trạng hàng rõ ràng và trải nghiệm mua hàng thuận
            tiện.
          </p>
        </div>
      </section>

      <section className="about-values">
        <article>
          <span>01</span>
          <h3>Sản phẩm dễ chọn</h3>
          <p>
            Thông tin sản phẩm được trình bày rõ ràng để khách hàng nhanh chóng
            tìm được món phù hợp với nhu cầu làm đẹp của mình.
          </p>
        </article>
        <article>
          <span>02</span>
          <h3>Giá bán minh bạch</h3>
          <p>
            Giá gốc, giá sale, tồn kho và chương trình khuyến mãi được hiển thị
            trực tiếp để việc mua sắm không bị rối.
          </p>
        </article>
        <article>
          <span>03</span>
          <h3>Dịch vụ gần gũi</h3>
          <p>
            Chúng tôi hướng tới trải nghiệm bán lẻ thân thiện: tư vấn dễ hiểu,
            xử lý đơn rõ ràng và hỗ trợ khách hàng khi cần.
          </p>
        </article>
      </section>

      <section className="about-highlight">
        <div>
          <span>Điểm khác biệt</span>
          <h2>Không chỉ bán mỹ phẩm, chúng tôi giúp việc lựa chọn trở nên nhẹ hơn</h2>
        </div>
        <ul>
          <li>Danh mục sản phẩm được sắp xếp theo nhu cầu chăm sóc sắc đẹp.</li>
          <li>Các chương trình sale có banner, thời gian và sản phẩm rõ ràng.</li>
          <li>Khách hàng có thể tra cứu đơn hàng mà không cần đăng nhập.</li>
          <li>Hàng mới về được cập nhật theo các lô nhập mới nhất.</li>
        </ul>
      </section>

      <section className="about-commitment">
        <div className="about-section-title">
          <span>Cam kết</span>
          <h2>Những điều chúng tôi luôn giữ trong cách vận hành</h2>
        </div>
        <div className="about-commitment__grid">
          <div>
            <strong>Rõ nguồn thông tin</strong>
            <p>Sản phẩm có mã, hình ảnh, giá và trạng thái tồn kho để khách dễ kiểm tra.</p>
          </div>
          <div>
            <strong>Cập nhật thường xuyên</strong>
            <p>Hàng mới, sale và chương trình khuyến mãi được cập nhật theo dữ liệu cửa hàng.</p>
          </div>
          <div>
            <strong>Tôn trọng trải nghiệm mua sắm</strong>
            <p>Giao diện được thiết kế để khách xem nhanh, chọn nhanh và đặt hàng thuận tiện.</p>
          </div>
          <div>
            <strong>Hỗ trợ sau mua</strong>
            <p>Khách hàng có thể kiểm tra đơn hàng và liên hệ hỗ trợ khi cần thông tin thêm.</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
