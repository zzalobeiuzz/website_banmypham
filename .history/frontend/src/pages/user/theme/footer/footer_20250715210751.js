import "bootstrap/dist/css/bootstrap.min.css";
import { memo } from "react";
import { Link } from "react-router-dom";
import "./footer.scss";
import {UPLOAD_BASE} from "../../../../constants"
const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-col">
            <Link to="/">
              <img
                className="logo-img"
                src=`$UPLOAD_BASE/assets/images/logo-removebg.png`
                alt="logo"
                loading="lazy"
              />
            </Link>
            <p className="mt-4">
              Cocolux là hệ thống phân phối mỹ phẩm chính hãng uy tín và dịch vụ
              chăm sóc khách hàng tận tâm.
            </p>
            <p className="mt-4">
              Đến với Cocolux bạn có thể hoàn toàn yên tâm khi lựa chọn cho mình
              những bộ sản phẩm phù hợp và ưng ý từ các nhãn hàng nổi tiếng trên
              toàn thế giới.
            </p>
          </div>
          <div className="footer-col">
            <p className="title">VỀ TINY SHOP</p>
            <Link className="mt-2">Về chúng tôi</Link>
            <Link className="mt-2">Câu chuyện thương hiệu</Link>
            <Link className="mt-2">Liên hệ</Link>
          </div>
          <div className="footer-col">
            <p className="title">CHÍNH SÁCH</p>
            <Link className="mt-2">Chính sách và giao nhận thanh toán</Link>
            <Link className="mt-2">Chính sách bảo mật thông tin cá nhân</Link>
            <Link className="mt-2">Điều khoản sử dụng</Link>
            <Link className="mt-2">Chính sách và quy định chung</Link>
            <Link className="mt-2">Khách hàng thân thiết</Link>
          </div>
          <div className="footer-col">
            <iframe
              name="zaloFrame"
              width="380"
              height="130"
              src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fprofile.php%3Fid%3D100092350185509&tabs=timeline&width=340&height=70&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true&appId=1110895930215923"
              style={{ border: "none", overflow: "hidden" }} // Control border and scrolling with CSS
              allowFullScreen
              title="Facebook Page Plugin" // Thêm thuộc tính title
            />
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-col">
            <p className="title-2">
              Cocolux.com thuộc bản quyền của Cocolux -<br />
              Hệ thống phân phối mỹ phẩm chính hãng
            </p>
            <p>
              Hệ thống cửa hàng của TINY:
              <Link>Website: TINY Store</Link>
              <Link>Hotline: 0988888825</Link>
              <Link>Email: cskh@cocolux.com</Link>
            </p>
          </div>
          <div className="footer-col">
            <p className="title-2">
              Địa Chỉ Cửa Hàng Chính: Số 405, Trần Hưng Đạo, Thành phố Kon Tum,
              Việt Nam
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default memo(Footer);
