import React from "react";
import "./theme.scss";

const Header = () => {
    return (
        <header className="bg-light border-bottom">
            <div className="container d-flex justify-content-between align-items-center">
                <a href="/" className="me-3 logo">
                    <img src="/assets/images/logo.png" alt="" style={{ width: "80px" }} />
                </a>
                <div className="search">
                    <button className="btn_search">
                        <img
                            src="./assets/icons/search-icon.png"
                            alt=""
                            className="icon_search"
                        />
                    </button>
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        className="input_search"
                    />
                </div>
                <ul className="nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0">
                    {" "}
                    <li>
                        <button className="mega_menu">
                            <img
                                src="./assets/icons/icons8-menu-50.png"
                                alt=""
                                className="icon_search"
                         
                            />  Mega 
                        </button>
                    </li>{" "}
                    <li>
                        <button className="chat">
                            <img
                                src="./assets/icons/icons8-chat.gif"
                                alt=""
                                className="icon_search"
                                
                            />  Inventory
                        </button>


                    </li>{" "}
                    <li>
                    <button className="notification">
                            <img
                                src="./assets/icons/icons8-bell.gif"
                                alt=""
                                className="icon_search"
                
                            />  Inventory
                        </button>
                        
                    </li>{" "}
                 
                </ul>
                <div className="admin">
                    <button className="btn_admin">
                        <img
                            src="./assets/icons/icons-admin.png"
                            alt=""
                            className="icon_admin"
                        />
                    </button>
                    <span className="name_admin">Tên ADMIN</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
