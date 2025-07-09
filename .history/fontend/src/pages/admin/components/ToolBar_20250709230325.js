import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import "./components.scss";

const ToolBar = ({ searchKeyword, setSearchKeyword }) => {
  return (
    <div className="d-flex justify-content-between align-items-center tool-bar-style">
      {/* Left: Buttons */}
      <div className="btn-group" role="group">
        {/* Bạn có thể thêm các nút khác nếu muốn */}
      </div>

      {/* Right: Search */}
      <form className="d-flex" role="search" onSubmit={(e) => e.preventDefault()}>
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
