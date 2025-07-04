import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';

const ToolBar = () => {
  return (
    <div className="d-flex justify-content-between align-items-center mb-3">
      {/* Left: Buttons */}
      <div className="btn-group" role="group">
        <button type="button" className="btn btn-primary">Thêm</button>
        <button type="button" className="btn btn-warning">Sửa</button>
        <button type="button" className="btn btn-danger">Xóa</button>
      </div>

      {/* Right: Search */}
      <form className="d-flex" role="search">
        <input 
          className="form-control me-2" 
          type="search" 
          placeholder="Tìm kiếm..." 
          aria-label="Search" 
        />
        <button className="btn btn-outline-success" type="submit">Tìm</button>
      </form>
    </div>
  );
};

export default ToolBar;
