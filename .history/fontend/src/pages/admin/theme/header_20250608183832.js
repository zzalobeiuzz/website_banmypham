import React from "react";
import "./theme.scss";

const Header = () => {
    return (
        <header class="bg-light border-bottom">
            <div class="container d-flex justify-content-between align-items-center">
                <a href="/" class="me-3" className="logo">
                    <img src="/assets/images/logo.png" alt="" style={{ width: "80px" }} />
                </a>
                <div className="search">
                    <button className="btn_search">
                        <img src="./assets/icons/search-icon.png" alt=""  className="icon_search"/>
                    </button>
                    <input type="text" placeholder="Tìm kiếm..." className="input_search"/>
                </div>
                <div className="admin">
                    <button className="icon_admin"
                </div>
            </div>
        </header>
    );
};

export default Header;
