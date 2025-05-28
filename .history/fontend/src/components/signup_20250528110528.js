import React from "react";
import "./auth.scss"; // Giả sử bạn sẽ viết CSS trong file này

const Signup = () => {
  return (
    <div
      className="frame-1"
      style={{
        background: "url('./../') center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="frame-2">
        <div className="frame-4">
          <img className="logo-removebg-1" src="logo-removebg-10.png" alt="Logo" />
          <div className="ng-k-ngay-nh-n-c">Đăng kí ngay để nhận được</div>
          <div className="group-1">
            <div className="m-ph-m-ch-nh-h-ng-gi-t-t-t-v-n-chuy-n-s-u">
              Mỹ phẩm chính hãng
              <br />
              giá tốt
              <br />
              tư vấn chuyên sâu
            </div>
            <img className="icons-8-tick-1" src="icons-8-tick-10.png" alt="tick 1" />
            <img className="icons-8-tick-2" src="icons-8-tick-20.png" alt="tick 2" />
            <img className="icons-8-tick-3" src="icons-8-tick-30.png" alt="tick 3" />
          </div>
        </div>
        <div className="frame-5">
          <div className="rectangle-1"></div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
