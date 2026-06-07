import "bootstrap/dist/css/bootstrap.min.css";
import React, { useState } from "react";
import "./components.scss";

const ToolBar = ({ onSearchChange, title }) => {
  const [searchKeyword, setSearchKeyword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(searchKeyword);
    }
  };

  const handleChange = (e) => {
    setSearchKeyword(e.target.value);
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  return (
    <div className="tool-bar-style">
      <div className="tool-left" />

      <div className="tool-center">
        <h2 className="title">{title}</h2>
      </div>

      <div className="tool-right">
        {onSearchChange ? (
          <form
            className="d-flex"
            role="search"
            onSubmit={handleSubmit}
            style={{ maxWidth: "300px" }}
          >
            <input
              className="form-control me-2"
              type="search"
              placeholder="Tìm kiếm..."
              value={searchKeyword}
              onChange={handleChange}
            />
            <button className="btn btn-outline-success" type="submit">Tìm</button>
          </form>
        ) : null}
      </div>
    </div>
  );
};

export default ToolBar;
