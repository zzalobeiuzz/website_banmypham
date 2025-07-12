import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import "./components.scss";

const ToolBar = () => {
  const [searchKeyword, setSearchKeyword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Từ khóa tìm kiếm:", searchKeyword);
    // Ở đây bạn có thể thực hiện logic search nếu cần
  };

  return (
    <div className="d-flex justify-content-between align-items-center tool-bar-style">
      {/* Left: Buttons */}
      <div className="btn-group" role="group">
        {/* Thêm nút ở đây nếu muốn */}
      </div>

      {/* Right: Search */}
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
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        <button className="btn btn-outline-success" type="submit">Tìm</button>
      </form>
    </div>
  );
};

export default ToolBar;
