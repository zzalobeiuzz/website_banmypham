import React from "react";

const Header = () => {
    return (
        <header class="bg-light border-bottom">
            <div class="container d-flex justify-content-between align-items-center">
                <a href="/" class="me-3">
                    <img src="/assets/images/logo.png" alt="" style={{ width: "80px" }} />
                </a>
                <div className="search">
                <button className="btn_search">
                <img src="./assets/icons/search-icon.png" alt=""/></img>
                </button>
                    <input type="text" placeholder="Tìm kiếm..." />
                </div>
                <nav>
                    <a href="/" class="me-3">
                        Home
                    </a>
                    <a href="/about">About</a>
                </nav>
            </div>
        </header>
    );
};

export default Header;
