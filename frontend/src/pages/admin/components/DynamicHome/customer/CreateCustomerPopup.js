import React, { useRef } from "react";

const getInitials = (value) => {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "KH";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const CreateCustomerPopup = ({
  open,
  isCreating,
  form,
  onClose,
  onChangeField,
  onAvatarFileChange,
  onAvatarDrop,
  onEditAvatar,
  onSubmit,
}) => {
  const avatarFileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  if (!open) return null;

  const handleChooseAvatar = () => {
    if (isCreating) return;
    avatarFileInputRef.current?.click();
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (isCreating) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    if (isCreating) return;
    if (typeof onAvatarDrop === "function") {
      onAvatarDrop(event);
    }
  };

  return (
    <div className="confirm-popup-overlay" onClick={onClose}>
      <div className="confirm-popup customer-create-popup" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-popup-title">{"Tạo khách hàng mới"}</div>

        <div className="customer-create-top-grid">
          <div className="confirm-popup-field">
            <label>{"Họ và tên"}</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => onChangeField("fullName", e.target.value)}
              placeholder={"Nhập họ tên khách hàng"}
              disabled={isCreating}
            />
          </div>

          <div className="confirm-popup-field">
            <label>{"Email"}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => onChangeField("email", e.target.value)}
              placeholder={"example@gmail.com"}
              disabled={isCreating}
            />
          </div>

          <div className="confirm-popup-field">
            <label>{"Số điện thoại"}</label>
            <input
              type="text"
              value={form.phoneNumber}
              onChange={(e) => onChangeField("phoneNumber", e.target.value)}
              placeholder={"Nhập số điện thoại"}
              disabled={isCreating}
            />
          </div>

          <div className="confirm-popup-field">
            <label>{"Địa chỉ"}</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => onChangeField("address", e.target.value)}
              placeholder={"Nhập địa chỉ khách hàng"}
              disabled={isCreating}
            />
          </div>
        </div>

        <div className="customer-create-options">
          <label>
            <input
              type="checkbox"
              checked={form.createAccount}
              onChange={(e) => onChangeField("createAccount", e.target.checked)}
              disabled={isCreating}
            />
            {"Tạo tài khoản đăng nhập"}
          </label>

          <label>
            <input
              type="checkbox"
              checked={form.linkGoogle}
              onChange={(e) => onChangeField("linkGoogle", e.target.checked)}
              disabled={isCreating || !form.createAccount}
            />
            {"Liên kết đăng nhập Google theo email"}
          </label>
        </div>

        {form.createAccount && (
          <>
            <div className="customer-create-bottom-flex">
              {!form.linkGoogle && (
                <div className="confirm-popup-field">
                  <label>{"Mật khẩu tài khoản"}</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => onChangeField("password", e.target.value)}
                    placeholder={"Nhập mật khẩu (ít nhất 6 ký tự)"}
                    disabled={isCreating}
                  />
                </div>
              )}

              <div className="confirm-popup-field">
                <label>{"Tên hiển thị tài khoản"}</label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => onChangeField("displayName", e.target.value)}
                  placeholder={"Mặc định lấy theo họ tên"}
                  disabled={isCreating}
                />
              </div>
            </div>

            <div className="confirm-popup-field customer-create-field-span-2">
              <label>{"Hình ảnh đại diện"}</label>
              <div className="customer-create-avatar-layout">
                <div className="customer-create-avatar-box">
                  <div className="customer-create-avatar-shell">
                    <button
                      type="button"
                      className={`customer-create-avatar-btn ${isDragOver ? "drag-over" : ""}`}
                      onClick={handleChooseAvatar}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      disabled={isCreating}
                      title={"Bấm để chọn ảnh từ máy"}
                    >
                      {form.avatarPreview ? (
                        <img
                          src={form.avatarPreview}
                          alt="avatar preview"
                          className="customer-create-avatar-image"
                        />
                      ) : (
                        <div className="customer-create-avatar-fallback">
                          {getInitials(form.displayName || form.fullName || form.email)}
                        </div>
                      )}
                    </button>

                    {form.avatarPreview && (
                      <button
                        type="button"
                        className="customer-create-avatar-edit-btn"
                        onClick={onEditAvatar}
                        disabled={isCreating}
                      >
                        {"Chỉnh sửa ảnh"}
                      </button>
                    )}
                  </div>
                </div>

                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onAvatarFileChange}
                  disabled={isCreating}
                  className="customer-create-avatar-input-hidden"
                />
              </div>
            </div>
          </>
        )}

        <div className="confirm-popup-actions">
          <button type="button" className="btn-cancel" onClick={onClose} disabled={isCreating}>
            {"Hủy"}
          </button>
          <button type="button" className="btn-confirm" onClick={onSubmit} disabled={isCreating}>
            {isCreating ? "Đang tạo..." : "Tạo mới"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCustomerPopup;
