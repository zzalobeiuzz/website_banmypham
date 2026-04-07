import React from "react";
import ReactQuill from "react-quill";

const BrandCreatePopup = ({
  visible,
  creating,
  createForm,
  isDraggingLogo,
  logoPreview,
  quillModules,
  onClose,
  onSubmit,
  onChangeForm,
  onLogoDragOver,
  onLogoDragLeave,
  onLogoDrop,
  onLogoFileChange,
}) => {
  if (!visible) return null;

  return (
    <form className="brand-create-form" onSubmit={onSubmit}>
      <div className="brand-create-form__grid">
        <div className="brand-field">
          <label>ID Brand</label>
          <input
            type="text"
            value={createForm.idBrand}
            onChange={(e) => onChangeForm("idBrand", e.target.value)}
            placeholder="VD: BR_001"
            required
          />
        </div>

        <div className="brand-field">
          <label>Tên thương hiệu</label>
          <input
            type="text"
            value={createForm.Brand}
            onChange={(e) => onChangeForm("Brand", e.target.value)}
            placeholder="VD: Cetaphil"
            required
          />
        </div>

        <div className="brand-field">
          <label>Trạng thái</label>
          <select
            value={createForm.status}
            onChange={(e) => onChangeForm("status", e.target.value)}
          >
            <option value="1">Hoạt động</option>
            <option value="0">Không hoạt động</option>
          </select>
        </div>

        <div className="brand-create-form__media-row brand-field--full">
          <div className="brand-field logo-brand">
            <div
              className={`brand-logo-dropzone ${isDraggingLogo ? "dragging" : ""}`}
              onDragOver={onLogoDragOver}
              onDragLeave={onLogoDragLeave}
              onDrop={onLogoDrop}
            >
              {logoPreview ? (
                <img className="brand-logo-preview" src={logoPreview} alt="Logo preview" />
              ) : (
                <div className="brand-logo-placeholder">
                  Kéo ảnh vào đây hoặc bấm nút bên dưới để tải từ máy
                </div>
              )}

              <input
                className="image-logo"
                type="file"
                accept="image/*"
                onChange={(e) => onLogoFileChange(e.target.files?.[0])}
              />
            </div>
          </div>

          <div className="brand-field brand-field--description">
            <label>Mô tả</label>
            <ReactQuill
              theme="snow"
              modules={quillModules}
              value={createForm.description}
              onChange={(value) => onChangeForm("description", value)}
              placeholder="Nhập mô tả thương hiệu..."
            />
          </div>
        </div>
      </div>

      <div className="brand-create-form__actions">
        <button type="button" className="brand-btn-detail-close" onClick={onClose}>
          Đóng
        </button>
        <button type="submit" className="brand-btn-submit" disabled={creating}>
          {creating ? "Đang tạo..." : "Lưu thương hiệu"}
        </button>
      </div>
    </form>
  );
};

export default BrandCreatePopup;
