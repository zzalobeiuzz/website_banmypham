import React from "react";

const Homepage = () => {
  return (
    <div className="row h-100">
      <div className="col-2 bg-black">
        <div className="btn_top">
          <ul>
            <li>
              <button>
                <img src="./assets/icons/icons8-home-50.png" alt="" />
                <span>Trang chủ</span>
              </button>
            </li>
          </ul>
        </div>
        <div className="btn_mid">
          <div className="line">
          <span></span>
          </div>
        </div>
      </div>
      <div className="col-10">{/* Cột phải - 9 phần */}</div>
    </div>
  );
};

export default Homepage;
