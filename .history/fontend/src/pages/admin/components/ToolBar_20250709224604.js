import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import "./components.scss";

const ToolBar = ({ searchKeyword, setSearchKeyword }) => {
  return (
    <div className="d-flex justify-content-between align-items-center tool-bar-style">
      <form className="d-flex" role="search" onSubmit={(e) => e.preventDefault()}>
        <input 
          className="form-control me-2" 
          type="search" 
          placeholder="Tìm kiếm..." 
          aria-label="Search" 
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        <button className="btn btn-outline-success" type="submit">Tìm</button>
      </form>
    </div>
  );
};

export default ToolBar;
