import React, { useState } from "react";
import "./style.scss";

const AddProduct = () => {
  // State quản lý form
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  // Submit form
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Thêm sản phẩm:", { name, price, description });

    // Reset form
    setName("");
    setPrice("");
    setDescription("");
  };

  return (
    <div className="form-add-product-wrapper">
      {/* Panel bên trái */}
      <div className="left-panel">
        <h3>Thông tin hỗ trợ</h3>
        <p>Điền đầy đủ thông tin sản phẩm để thêm mới vào hệ thống.</p>
        <img src="/assets/images/preview-placeholder.png" alt="Preview" />
      </div>

      {/* Panel bên phải */}
      <div className="right-panel">
        <h2>Thêm sản phẩm mới</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên sản phẩm</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên sản phẩm"
              required
            />
          </div>

          <div className="form-group">
            <label>Giá</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Nhập giá"
              required
            />
          </div>

          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả sản phẩm"
            />
          </div>

          <button type="submit" className="btn-primary">
            Thêm sản phẩm
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
