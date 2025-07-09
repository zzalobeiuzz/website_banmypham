import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import "./components.scss";
const ToolBar = () => {
  return (
    <div className="d-flex justify-content-between align-items-center tool-bar-style">
      {/* Left: Buttons */}
      

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
