import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import "./components.scss";

const ToolBar = ({ searchKeyword = "", setSearchKeyword = () => {} }) => {
  return (
    <div className="d-flex justify-content-between align-items-center tool-bar-style">
      {/* Left: Buttons */}
      <div className="btn-group" role="group">
        {/* Bạn có thể thêm nút ở đây */}
      </div>

      {/* Right: Search */}
      <form
        className="d-flex"
        role="search
