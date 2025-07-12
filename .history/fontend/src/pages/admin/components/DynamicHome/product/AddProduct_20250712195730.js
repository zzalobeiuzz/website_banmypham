import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.scss";

const AddProduct = () => {
  const navigate = useNavigate();
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState("/assets/images/preview-placeholder.png");
  const [imageFile, setImageFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Thêm sản phẩm:", { barcode, name, price, description, imageFile });

    // Reset
    setBarcode("");
    setName("");
    setPrice("");
    setDescription("");
    setImagePreview("/assets/images/preview-placeholder.png");
    setImageFile(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGoBack = () => {
    navigate(-1); // hoặc navigate("/admin/product") tùy đường dẫn bạn muốn
  };

  const handleScanBarcode = () => {
    alert("Chức năng quét mã sẽ được thêm sau!");
  };

  return (
    <div className="form-add-product-wrapper">
      {/* 🔎 Barcode & action buttons */}
      <div className="barcode-wrapper">
        <div className="barcode-actions">
          <button className="btn-back" onClick={handleGoBack}>← Quay lại</button>
          <button className="btn-scan" onClick={handleScanBarcode}>Quét mã</button>
        </div>
        <label>Mã barcode (quét hoặc nhập):</label>
        <input
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Quét hoặc nhập mã barcode"
        />
      </div>

      <div className="left-panel">
        <h3>Hình ảnh sản phẩm</h3>
        <p>Chọn ảnh để xem trước sản phẩm.</p>
        <img src={imagePreview} alt="Preview" />
        <input type="file" accept="image/*" onChange={handleImageChange} />
      </div>

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
