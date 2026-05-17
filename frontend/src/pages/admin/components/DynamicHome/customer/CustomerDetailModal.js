import React from "react";
import "./style.scss";
import CustomerDetailTabs from "./CustomerDetailTabs";

const CustomerDetailModal = ({
  open,
  customerDetail,
  onClose,
  formatPrice,
  resolveAvatarSrc,
  openResetPasswordPopup,
  isResettingPassword,
  resetPasswordMessage,
  activeDetailTab,
  setActiveDetailTab,
  onViewOrderDetail,
  isEditingCustomer,
  openEditCustomerMode,
  cancelEditCustomerMode,
  editForm,
  handleChangeEditForm,
  isSavingCustomer,
  openUpdateConfirmPopup,
  editMessage,
}) => {
  if (!open || !customerDetail) return null;

  return (
    <div className="detail-popup-overlay" onClick={onClose}>
      <div className="detail-popup-shell" onClick={(e) => e.stopPropagation()}>
        <div className="detail-popup">
          <div className="popup-header">
            <h2>{"Chi tiết khách hàng"}</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>

          <div className="popup-body">
            <div className="info-section">
              {customerDetail.AccountEmail ? (
                <div className="account-detail-card">
                  {customerDetail.Avatar && (
                    <img
                      src={resolveAvatarSrc(customerDetail.Avatar)}
                      alt="avatar"
                      className="account-detail-avatar"
                    />
                  )}
                  <div className="account-detail-info">
                    <div className="account-detail-name">
                      {customerDetail.DisplayName || customerDetail.AccountEmail}
                    </div>
                    <div className="account-detail-email">
                      {customerDetail.AccountEmail}
                    </div>
                    <div className="account-detail-role">
                      {"Vai trò: "}
                      {customerDetail.Role === 0 ? "Khách hàng" : (customerDetail.Role ?? "N/A")}
                    </div>
                  </div>
                  <div className="account-action-wrap">
                    <button
                      className="btn-action reset-password"
                      onClick={openResetPasswordPopup}
                      disabled={isResettingPassword}
                    >
                      {isResettingPassword ? "Đang reset..." : "Reset mật khẩu"}
                    </button>
                    <div className="account-action-note">{"Nhập mật khẩu mới khi xác nhận reset."}</div>
                  </div>
                </div>
              ) : (
                <div className="no-account">{"Khách hàng này chưa có tài khoản đăng nhập"}</div>
              )}

              {resetPasswordMessage && (
                <div className="reset-password-message">{resetPasswordMessage}</div>
              )}
            </div>

            <CustomerDetailTabs
              activeDetailTab={activeDetailTab}
              setActiveDetailTab={setActiveDetailTab}
              isEditingCustomer={isEditingCustomer}
              openEditCustomerMode={openEditCustomerMode}
              cancelEditCustomerMode={cancelEditCustomerMode}
              editForm={editForm}
              handleChangeEditForm={handleChangeEditForm}
              isSavingCustomer={isSavingCustomer}
              openUpdateConfirmPopup={openUpdateConfirmPopup}
              editMessage={editMessage}
              formatPrice={formatPrice}
              customerDetail={customerDetail}
              resolveAvatarSrc={resolveAvatarSrc}
              onViewOrderDetail={onViewOrderDetail}
            />
            </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailModal;
