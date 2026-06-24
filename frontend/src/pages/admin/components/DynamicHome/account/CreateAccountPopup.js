import React from "react";

const CreateAccountPopup = ({
  open,
  isCreating,
  form,
  onClose,
  onChangeField,
  onSubmit,
}) => {
  if (!open) return null;

  const handleOverlayClick = () => {
    if (isCreating) return;
    onClose();
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    if (isCreating) return;
    onSubmit();
  };

  return (
    <div className="account-create-popup-overlay" onClick={handleOverlayClick}>
      <div className="account-create-popup" onClick={(event) => event.stopPropagation()}>
        <div className="account-create-popup-head">
          <div>
            <h3 className="account-create-popup-title">Tạo tài khoản mới</h3>
            <p className="account-create-popup-subtitle">Điền thông tin để khởi tạo tài khoản quản trị hoặc khách hàng.</p>
          </div>
          <button
            type="button"
            className="account-create-popup-close"
            onClick={onClose}
            disabled={isCreating}
            aria-label="Đóng popup"
            title="Đóng"
          >
            x
          </button>
        </div>

        <form className="account-create-form" onSubmit={handleFormSubmit}>
          <div className="account-create-field account-create-field-full">
            <label htmlFor="account-create-email">Email</label>
            <input
              id="account-create-email"
              type="email"
              value={form.email}
              onChange={(event) => onChangeField("email", event.target.value)}
              placeholder="example@gmail.com"
              disabled={isCreating}
              autoFocus
            />
          </div>

          <div className="account-create-field">
            <label htmlFor="account-create-display-name">Tên hiển thị</label>
            <input
              id="account-create-display-name"
              type="text"
              value={form.displayName}
              onChange={(event) => onChangeField("displayName", event.target.value)}
              placeholder="Nhập tên hiển thị"
              disabled={isCreating}
            />
          </div>

          <div className="account-create-field">
            <label htmlFor="account-create-password">Mật khẩu</label>
            <input
              id="account-create-password"
              type="password"
              value={form.password}
              onChange={(event) => onChangeField("password", event.target.value)}
              placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
              disabled={isCreating}
            />
          </div>

          <div className="account-create-field">
            <label htmlFor="account-create-role">Vai trò</label>
            <select
              id="account-create-role"
              value={String(form.role)}
              onChange={(event) => onChangeField("role", Number(event.target.value))}
              disabled={isCreating}
            >
              <option value="0">Khách hàng</option>
              <option value="1">Admin</option>
            </select>
          </div>

          <div className="account-create-field">
            <label htmlFor="account-create-avatar-file">Ảnh từ máy</label>
            <input
              id="account-create-avatar-file"
              type="file"
              accept="image/*"
              onChange={(event) => onChangeField("avatarFile", event.target.files?.[0] || null)}
              disabled={isCreating}
            />
          </div>

          <div className="account-create-field">
            <label htmlFor="account-create-avatar-url">Ảnh từ web</label>
            <input
              id="account-create-avatar-url"
              type="url"
              value={form.avatarUrl || ""}
              onChange={(event) => onChangeField("avatarUrl", event.target.value)}
              placeholder="https://example.com/avatar.png"
              disabled={isCreating}
            />
          </div>
          <div className="account-create-hint">Mẹo: Chọn vai trò Admin chỉ cho tài khoản quản trị nội bộ.</div>

          <div className="account-create-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isCreating}>
              Hủy
            </button>
            <button type="submit" className="btn-confirm" disabled={isCreating}>
              {isCreating ? "Đang tạo..." : "Tạo tài khoản"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAccountPopup;
