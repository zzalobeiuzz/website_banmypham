import React, { useState } from "react";

const AddProduct = () => {
  // State để quản lý form
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  // Submit form
  const handleSubmit = (e) => {
    e.preventDefault();
    // Gửi dữ liệu lên server hoặc log ra
    console.log("Thêm sản phẩm:", { name, price, description });

    // Reset form
    setName("");
    setPrice("");
    setDescription("");
  };

  return (
    <div>
      <h2>Thêm sản phẩm mới</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: "500px" }}>
        <div className="form-group">
          <label>Tên sản phẩm</label>
          <input
            type="text"
            className="form-control"
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
            className="form-control"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Nhập giá"
            required
          />
        </div>

        <div className="form-group">
          <label>Mô tả</label>
          <textarea
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả sản phẩm"
          />
        </div>

        <button type="submit" className="btn btn-primary mt-2">
          Thêm sản phẩm
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
