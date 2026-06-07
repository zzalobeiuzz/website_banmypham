import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import useHttp from "../../../../../hooks/useHttp";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import ToolBar from "../../ToolBar";
import AdminLoadingScreen from "../../shared/AdminLoadingScreen";
import Notification from "../../shared/Notification";
import useMinimumLoading from "../../useMinimumLoading";
import AvatarCropEditor from "./AvatarCropEditor";
import CreateCustomerPopup from "./CreateCustomerPopup";
import CustomerDetailModal from "./CustomerDetailModal";
import "./style.scss";

const TXT = {
  title: "Quản lý khách hàng",
  searchPlaceholder: "Tìm theo mã KH, tên, email, số điện thoại...",
  loading: "Đang tải...",
  noData: "Không có khách hàng nào",
  noAccount: "Khách hàng này chưa có tài khoản đăng nhập",
};

const CustomerPage = () => {
  const { request } = useHttp();
  const { customerId: routeCustomerIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const routeCustomerId = routeCustomerIdParam || searchParams.get("customerId");

  const [customers, setCustomers] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const showLoading = useMinimumLoading(loading, 500);
  const [customerDetail, setCustomerDetail] = useState(null);

  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordMessage, setResetPasswordMessage] = useState("");
  const [showResetPasswordPopup, setShowResetPasswordPopup] = useState(false);
  const [newResetPassword, setNewResetPassword] = useState("");

  const [activeDetailTab, setActiveDetailTab] = useState("info");
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [showUpdateConfirmPopup, setShowUpdateConfirmPopup] = useState(false);
  const [showUpdateSuccessPopup, setShowUpdateSuccessPopup] = useState(false);
  const [showDeleteConfirmPopup, setShowDeleteConfirmPopup] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [notify, setNotify] = useState({
    open: false,
    status: "info",
    message: "",
  });
  const [showCreateCustomerPopup, setShowCreateCustomerPopup] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [avatarEditorSource, setAvatarEditorSource] = useState("");
  const [createCustomerForm, setCreateCustomerForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
    createAccount: true,
    linkGoogle: true,
    password: "",
    displayName: "",
    avatarUrl: "",
    avatarFile: null,
    avatarPreview: "",
  });
  const [editForm, setEditForm] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
  });

  // --- UI helpers ---
  const showPopup = ({ status = "info", message = "" }) => {
    setNotify({ open: true, status, message: String(message || "") });
  };

  const closePopup = () => setNotify((prev) => ({ ...prev, open: false }));

  const handleSearchChange = (keyword) => setSearchKeyword(String(keyword || ""));

  const filteredCustomers = (customers || []).filter((customer) => {
    const keyword = String(searchKeyword || "").trim().toLowerCase();
    if (!keyword) return true;
    return (
      String(customer?.FullName || "").toLowerCase().includes(keyword) ||
      String(customer?.CustomerCode || "").toLowerCase().includes(keyword) ||
      String(customer?.CustomerID || "").toLowerCase().includes(keyword) ||
      String(customer?.Email || "").toLowerCase().includes(keyword) ||
      String(customer?.PhoneNumber || "").toLowerCase().includes(keyword) ||
      String(customer?.AccountEmail || "").toLowerCase().includes(keyword)
    );
  });

  const formatPrice = (price) => {
    const num = Number(price) || 0;
    return `${Math.round(num).toLocaleString("vi-VN")} ₫`;
  };

  const resolveAvatarSrc = (avatar) => {
    if (!avatar) return "";
    const v = String(avatar).trim();
    if (!v) return "";
    if (/^https?:\/\//i.test(v) || v.startsWith("data:")) return v;
    const normalized = v.replace(/^\/+/, "").replace(/^uploads\/?assets\/?/i, "");
    return `${UPLOAD_BASE}/${normalized}`;
  };

  const isAccountCustomer = (customer) => Boolean(customer?.HasAccount || customer?.AccountEmail);
  const getAccountStatusLabel = (customer) => (customer?.AccountStatus ? customer.AccountStatus : (isAccountCustomer(customer) ? "Đã có" : "Không có"));

  const resetCreateCustomerForm = () => {
    setCreateCustomerForm({
      fullName: "",
      email: "",
      phoneNumber: "",
      address: "",
      createAccount: true,
      linkGoogle: true,
      password: "",
      displayName: "",
      avatarUrl: "",
      avatarFile: null,
      avatarPreview: "",
    });
  };

  const openCreateCustomerPopup = () => {
    resetCreateCustomerForm();
    setShowCreateCustomerPopup(true);
  };

  const closeCreateCustomerPopup = () => {
    if (isCreatingCustomer) return;
    setShowCreateCustomerPopup(false);
    resetCreateCustomerForm();
  };

  const handleChangeCreateCustomerForm = (field, value) => {
    setCreateCustomerForm((prev) => ({ ...prev, [field]: value }));
  };

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Không thể đọc file ảnh."));
    reader.readAsDataURL(file);
  });

  const getDroppedImageUrl = (event) => {
    const uriList = String(event?.dataTransfer?.getData("text/uri-list") || "").trim();
    if (/^https?:\/\//i.test(uriList) || uriList.startsWith("data:")) return uriList;
    const plain = String(event?.dataTransfer?.getData("text/plain") || "").trim();
    if (/^https?:\/\//i.test(plain) || plain.startsWith("data:")) return plain;
    const html = String(event?.dataTransfer?.getData("text/html") || "").trim();
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    const imgSrc = String(imgMatch?.[1] || "").trim();
    if (/^https?:\/\//i.test(imgSrc) || imgSrc.startsWith("data:")) return imgSrc;
    return "";
  };

  const handleCreateAvatarFileChange = (event) => {
    const file = event?.target?.files?.[0];
    if (!file) {
      handleChangeCreateCustomerForm("avatarFile", null);
      handleChangeCreateCustomerForm("avatarPreview", "");
      return;
    }
    if (!String(file.type || "").startsWith("image/")) {
      showPopup({ status: "warning", message: "Vui lòng chọn file ảnh hợp lệ." });
      return;
    }
    readFileAsDataUrl(file).then((dataUrl) => {
      handleChangeCreateCustomerForm("avatarUrl", dataUrl);
      handleChangeCreateCustomerForm("avatarFile", null);
      handleChangeCreateCustomerForm("avatarPreview", dataUrl);
    }).catch((err) => showPopup({ status: "error", message: err?.message || "Không thể đọc ảnh đã chọn." }));
  };

  const handleCreateAvatarDrop = (event) => {
    const files = event?.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!String(file.type || "").startsWith("image/")) {
        showPopup({ status: "warning", message: "Vui lòng kéo file ảnh hợp lệ." });
        return;
      }
      readFileAsDataUrl(file).then((dataUrl) => {
        handleChangeCreateCustomerForm("avatarUrl", dataUrl);
        handleChangeCreateCustomerForm("avatarFile", null);
        handleChangeCreateCustomerForm("avatarPreview", dataUrl);
      }).catch((err) => showPopup({ status: "error", message: err?.message || "Không thể tải ảnh vừa kéo vào." }));
      return;
    }
    const droppedUrl = getDroppedImageUrl(event);
    if (droppedUrl) {
      handleChangeCreateCustomerForm("avatarUrl", droppedUrl);
      handleChangeCreateCustomerForm("avatarPreview", droppedUrl);
      return;
    }
    showPopup({ status: "warning", message: "Chỉ nhận ảnh kéo từ web hoặc liên kết ảnh." });
  };

  const handleOpenAvatarEditor = () => {
    if (isCreatingCustomer) return;
    const source = String(createCustomerForm.avatarPreview || createCustomerForm.avatarUrl || "").trim();
    if (!source) return showPopup({ status: "warning", message: "Bạn cần chọn ảnh trước khi chỉnh sửa." });
    setAvatarEditorSource(source);
    setShowAvatarEditor(true);
  };

  const getAuthHeaders = (token) => ({ Authorization: `Bearer ${token}` });

  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("Không tìm thấy refresh token");
    }

    const refreshRes = await request(
      "POST",
      `${API_BASE}/api/admin/refresh-token`,
      {
        refreshToken,
      },
    );

    if (!refreshRes?.accessToken) {
      throw new Error("Không thể làm mới access token");
    }

    localStorage.setItem("accessToken", refreshRes.accessToken);
    return refreshRes.accessToken;
  };

  /**
    Lấy danh sách tất cả khách hàng tự động khi vào trang
    có xử lý refresh token nếu cần thiết.
 */
const fetchCustomers = async () => {
  try {
    // bật loading
    setLoading(true);

    // lấy access token hiện tại
    let token = localStorage.getItem("accessToken");

    let res;

    try {
      // gọi API lấy danh sách khách hàng
      res = await request(
        "GET",
        `${API_BASE}/api/admin/customers`,
        null,
        getAuthHeaders(token),
      );
      console.log(" Dữ liệu láy thành công:", res);
    } catch (error) {
      // nếu lỗi không phải do token hết hạn, ném lỗi ra ngoài
      if (error?.status !== 401) throw error;

      // nếu là lỗi 401, thử refresh token
      token = await refreshAccessToken();

      // gọi lại API với token mới
      res = await request(
        "GET",
        `${API_BASE}/api/admin/customers`,
        null,
        getAuthHeaders(token),
      );
      console.log("Dữ liệu láy thành công sau khi refresh token:", res);
    }

    // nếu thành công, cập nhật state customers
    if (res?.success) {
      setCustomers(res.data || []);
    }
  } catch (error) {
    // log lỗi tổng
    console.error("Loi:", error);
  } finally {
    // luôn tắt loading
    setLoading(false);
  }
};

  const fetchCustomerDetail = async (customerId) => {
    try {
      setLoading(true);
      let token = localStorage.getItem("accessToken");

      let res;
      try {
        res = await request(
          "GET",
          `${API_BASE}/api/admin/customers/${encodeURIComponent(customerId)}`,
          null,
          getAuthHeaders(token),
        );
      } catch (error) {
        if (error?.status !== 401) throw error;
        token = await refreshAccessToken();
        res = await request(
          "GET",
          `${API_BASE}/api/admin/customers/${encodeURIComponent(customerId)}`,
          null,
          getAuthHeaders(token),
        );
      }

      if (res?.success) {
        const detailData = res.data || null;
        setCustomerDetail(detailData);
        setEditForm({
          fullName: detailData?.FullName || "",
          phoneNumber: detailData?.PhoneNumber || "",
          address: detailData?.Address || "",
        });
        setIsEditingCustomer(false);
        setIsSavingCustomer(false);
        setEditMessage("");
        setResetPasswordMessage("");
        setActiveDetailTab("info");
        setShowDetailPopup(true);
      }
    } catch (error) {
      console.error("Loi:", error);
    } finally {
      setLoading(false);
    }
  };

  // Xem chi tiết đơn hàng (khi bấm từ tab lịch sử đơn hàng)
  const [showOrderDetailPopup, setShowOrderDetailPopup] = useState(false);
  const [orderDetailData, setOrderDetailData] = useState(null);

  const handleViewOrderDetail = async (order) => {
    try {
      setLoading(true);
      // gọi API admin orders (từ BILL/BILL_DETAIL) và tìm order theo id
      const res = await request("GET", `${API_BASE}/api/admin/orders`);
      if (!res?.success) throw new Error("Không lấy được dữ liệu đơn hàng");
      const orders = Array.isArray(res.data) ? res.data : [];
      const found = orders.find((o) => String(o.id || o.OrderID || o.OrderId) === String(order.OrderID || order.OrderId || order.id));
      if (!found) {
        showPopup({ status: "warning", message: "Không tìm thấy đơn hàng" });
        return;
      }
      setOrderDetailData(found);
      setShowOrderDetailPopup(true);
    } catch (err) {
      console.error("Lỗi lấy chi tiết đơn hàng:", err);
      showPopup({ status: "error", message: err.message || "Lỗi khi lấy chi tiết đơn hàng" });
    } finally {
      setLoading(false);
    }
  };

  const closeOrderDetailPopup = () => {
    setShowOrderDetailPopup(false);
    setOrderDetailData(null);
  };

    useEffect(() => {
      fetchCustomers();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (routeCustomerId) {
        fetchCustomerDetail(routeCustomerId);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeCustomerId]);

  const handleApplyAvatarEdit = (dataUrl) => {
    handleChangeCreateCustomerForm("avatarUrl", dataUrl);
    handleChangeCreateCustomerForm("avatarFile", null);
    handleChangeCreateCustomerForm("avatarPreview", dataUrl);
    setAvatarEditorSource("");
    setShowAvatarEditor(false);
  };

  const handleCloseAvatarEditor = () => {
    setAvatarEditorSource("");
    setShowAvatarEditor(false);
  };

  // Simple Order detail popup JSX
  const OrderDetailPopup = ({ open, order, onClose }) => {
    if (!open || !order) return null;
    return (
      <div className="detail-popup-overlay" onClick={onClose}>
        <div className="detail-popup-shell" onClick={(e) => e.stopPropagation()}>
          <div className="detail-popup">
            <div className="popup-header">
              <h2>{`Chi tiết đơn ${order.id || order.OrderId || order.OrderID}`}</h2>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>
            <div className="popup-body">
              <div className="orders-table">
                <table>
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Số lượng</th>
                      <th>Giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.details || []).map((it, idx) => (
                      <tr key={idx}>
                        <td>{it.name}</td>
                        <td>{it.qty}</td>
                        <td>{it.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="order-meta">
                <div>Trạng thái: {order.status}</div>
                <div>Ngày: {order.date}</div>
                <div>Tổng: {order.total}</div>
                <div>Địa chỉ: {order.address}</div>
                <div>Điện thoại: {order.phone}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleCreateCustomer = async () => {
    const fullName = String(createCustomerForm.fullName || "").trim();
    const email = String(createCustomerForm.email || "")
      .trim()
      .toLowerCase();
    const phoneNumber = String(createCustomerForm.phoneNumber || "").trim();
    const address = String(createCustomerForm.address || "").trim();
    const createAccount = Boolean(createCustomerForm.createAccount);
    const linkGoogle = Boolean(createCustomerForm.linkGoogle);
    const password = String(createCustomerForm.password || "").trim();
    const displayName = String(createCustomerForm.displayName || "").trim();
    const avatarUrl = String(createCustomerForm.avatarUrl || "").trim();
    const avatarFile = createCustomerForm.avatarFile || null;

    if (!fullName || !email || !phoneNumber || !address) {
      showPopup({
        status: "warning",
        message: "Vui lòng nhập đầy đủ tên, email, số điện thoại và địa chỉ.",
      });
      return;
    }

    if (createAccount && !linkGoogle && password.length < 6) {
      showPopup({
        status: "warning",
        message: "Mật khẩu phải có ít nhất 6 ký tự.",
      });
      return;
    }

    try {
      setIsCreatingCustomer(true);
      let token = localStorage.getItem("accessToken");

      const payload = new FormData();
      payload.append("fullName", fullName);
      payload.append("email", email);
      payload.append("phoneNumber", phoneNumber);
      payload.append("address", address);
      payload.append("createAccount", String(createAccount));
      payload.append("linkGoogle", String(linkGoogle));
      payload.append("password", createAccount ? password : "");
      payload.append("displayName", displayName);
      payload.append("avatarUrl", avatarUrl);

      if (avatarFile) {
        payload.append("avatarFile", avatarFile);
      }

      let res;
      try {
        res = await request(
          "POST",
          `${API_BASE}/api/admin/customers`,
          payload,
          getAuthHeaders(token),
        );
      } catch (error) {
        if (error?.status !== 401) throw error;
        token = await refreshAccessToken();
        res = await request(
          "POST",
          `${API_BASE}/api/admin/customers`,
          payload,
          getAuthHeaders(token),
        );
      }

      if (!res?.success) {
        showPopup({
          status: "error",
          message: res?.message || "Tạo khách hàng thất bại.",
        });
        return;
      }

      setShowCreateCustomerPopup(false);
      resetCreateCustomerForm();
      await fetchCustomers();
      showPopup({
        status: "success",
        message: res?.message || "Tạo khách hàng thành công.",
      });
    } catch (error) {
      showPopup({
        status: "error",
        message: error?.message || "Tạo khách hàng thất bại.",
      });
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleResetPassword = async () => {
    if (!customerDetail?.AccountEmail) {
      setResetPasswordMessage("Khách hàng này chưa có tài khoản đăng nhập.");
      return;
    }

    const normalizedNewPassword = String(newResetPassword || "").trim();
    if (!normalizedNewPassword) {
      setResetPasswordMessage("Vui lòng nhập mật khẩu mới để reset.");
      return;
    }
    if (normalizedNewPassword.length < 6) {
      setResetPasswordMessage("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    try {
      setIsResettingPassword(true);
      setResetPasswordMessage("");

      let token = localStorage.getItem("accessToken");
      let res;
      try {
        res = await request(
          "PUT",
          `${API_BASE}/api/admin/customers/${encodeURIComponent(customerDetail.CustomerID)}/reset-password`,
          { newPassword: normalizedNewPassword },
          getAuthHeaders(token),
        );
      } catch (error) {
        if (error?.status !== 401) throw error;
        token = await refreshAccessToken();
        res = await request(
          "PUT",
          `${API_BASE}/api/admin/customers/${encodeURIComponent(customerDetail.CustomerID)}/reset-password`,
          { newPassword: normalizedNewPassword },
          getAuthHeaders(token),
        );
      }

      if (!res?.success) {
        setResetPasswordMessage(res?.message || "Reset mật khẩu thất bại.");
        return;
      }

      setResetPasswordMessage("Đã reset mật khẩu thành công.");
      setShowResetPasswordPopup(false);
      setNewResetPassword("");
    } catch (error) {
      setResetPasswordMessage(error?.message || "Reset mật khẩu thất bại.");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const closeDetailPopup = () => {
    setShowDetailPopup(false);
    setResetPasswordMessage("");
    setShowResetPasswordPopup(false);
    setShowUpdateConfirmPopup(false);
    setShowUpdateSuccessPopup(false);
    setNewResetPassword("");
    setIsEditingCustomer(false);
    setIsSavingCustomer(false);
    setEditMessage("");
    setActiveDetailTab("info");
  };

  const openResetPasswordPopup = () => {
    setResetPasswordMessage("");
    setNewResetPassword("");
    setShowResetPasswordPopup(true);
  };

  const closeResetPasswordPopup = () => {
    if (isResettingPassword) return;
    setShowResetPasswordPopup(false);
    setNewResetPassword("");
  };

  const closeUpdateSuccessPopup = () => {
    setShowUpdateSuccessPopup(false);
  };

  const openUpdateConfirmPopup = () => {
    if (isSavingCustomer) return;
    setEditMessage("");
    setShowUpdateConfirmPopup(true);
  };

  const closeUpdateConfirmPopup = () => {
    if (isSavingCustomer) return;
    setShowUpdateConfirmPopup(false);
  };

  const openDeleteConfirmPopup = (customer) => {
    setCustomerToDelete(customer || null);
    setShowDeleteConfirmPopup(true);
  };

  const closeDeleteConfirmPopup = () => {
    setShowDeleteConfirmPopup(false);
    setCustomerToDelete(null);
  };

  const handleDeleteCustomer = async () => {
    const targetCustomerId = customerToDelete?.CustomerID;
    if (!targetCustomerId) {
      showPopup({ status: "warning", message: "Không tìm thấy khách hàng để xóa." });
      closeDeleteConfirmPopup();
      return;
    }

    try {
      let token = localStorage.getItem("accessToken");
      let res;
      try {
        res = await request(
          "DELETE",
          `${API_BASE}/api/admin/customers/${encodeURIComponent(targetCustomerId)}`,
          null,
          getAuthHeaders(token),
        );
      } catch (error) {
        if (error?.status !== 401) throw error;
        token = await refreshAccessToken();
        res = await request(
          "DELETE",
          `${API_BASE}/api/admin/customers/${encodeURIComponent(targetCustomerId)}`,
          null,
          getAuthHeaders(token),
        );
      }

      if (!res?.success) {
        showPopup({
          status: "error",
          message: res?.message || "Xóa khách hàng thất bại.",
        });
        return;
      }

      showPopup({
        status: "success",
        message: res?.message || "Xóa khách hàng thành công.",
      });
      closeDeleteConfirmPopup();
      await fetchCustomers();
      if (showDetailPopup && customerDetail?.CustomerID === targetCustomerId) {
        closeDetailPopup();
      }
    } catch (error) {
      showPopup({
        status: "error",
        message: error?.message || "Xóa khách hàng thất bại.",
      });
    }
  };

  const openEditCustomerMode = () => {
    setEditMessage("");
    setIsEditingCustomer(true);
    setEditForm({
      fullName: customerDetail?.FullName || "",
      phoneNumber: customerDetail?.PhoneNumber || "",
      address: customerDetail?.Address || "",
    });
  };

  const cancelEditCustomerMode = () => {
    if (isSavingCustomer) return;
    setIsEditingCustomer(false);
    setEditMessage("");
    setEditForm({
      fullName: customerDetail?.FullName || "",
      phoneNumber: customerDetail?.PhoneNumber || "",
      address: customerDetail?.Address || "",
    });
  };

  const handleChangeEditForm = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveCustomerInfo = async () => {
    setShowUpdateConfirmPopup(false);
    const fullName = String(editForm.fullName || "").trim();
    const phoneNumber = String(editForm.phoneNumber || "").trim();
    const address = String(editForm.address || "").trim();

    if (!fullName) return setEditMessage("Tên khách hàng không được để trống.");
    if (!phoneNumber)
      return setEditMessage("Số điện thoại không được để trống.");
    if (!address) return setEditMessage("Địa chỉ không được để trống.");

    try {
      setIsSavingCustomer(true);
      setEditMessage("");

      let token = localStorage.getItem("accessToken");
      let res;
      try {
        res = await request(
          "PUT",
          `${API_BASE}/api/admin/customers/${encodeURIComponent(customerDetail.CustomerID)}`,
          { fullName, phoneNumber, address },
          getAuthHeaders(token),
        );
      } catch (error) {
        if (error?.status !== 401) throw error;
        token = await refreshAccessToken();
        res = await request(
          "PUT",
          `${API_BASE}/api/admin/customers/${encodeURIComponent(customerDetail.CustomerID)}`,
          { fullName, phoneNumber, address },
          getAuthHeaders(token),
        );
      }

      if (!res?.success) {
        showPopup({
          status: "error",
          message: res?.message || "Cập nhật thông tin thất bại.",
        });
        return;
      }

      const latestCustomer = res?.data || {
        ...customerDetail,
        FullName: fullName,
        PhoneNumber: phoneNumber,
        Address: address,
      };

      setCustomerDetail(latestCustomer);
      setEditForm({
        fullName: latestCustomer?.FullName || fullName,
        phoneNumber: latestCustomer?.PhoneNumber || phoneNumber,
        address: latestCustomer?.Address || address,
      });
      setEditMessage("");
      setShowUpdateSuccessPopup(true);
      setIsEditingCustomer(false);
      await fetchCustomers();
    } catch (error) {
      showPopup({
        status: "error",
        message: error?.message || "Cập nhật thông tin thất bại.",
      });
    } finally {
      setIsSavingCustomer(false);
    }
  };

  return (
    <div className="customer-page">
      <Notification
        open={notify.open}
        status={notify.status}
        message={notify.message}
        onClose={closePopup}
      />
      <ToolBar
        title={TXT.title}
        onSearchChange={handleSearchChange}
      />
      <div className="customer-container">
        <div className="customer-top-actions">
          <button
            type="button"
            className="btn-action create-customer admin-create-btn"
            onClick={openCreateCustomerPopup}
          >
            <span className="admin-create-btn__icon" />
            {"Tạo khách hàng"}
          </button>
        </div>

        <div className="customer-list">
          {showLoading ? (
            <AdminLoadingScreen message={TXT.loading} compact />
          ) : filteredCustomers.length === 0 ? (
            <div className="no-data">{TXT.noData}</div>
          ) : (
            <table className="customer-table">
              <thead>
                <tr>
                  <th className="th-customer-code">Mã KH</th>
                  <th className="th-avatar">Ảnh</th>
                  <th>Tên khách hàng</th>
                  <th className="th-email">Email</th>
                  <th>Số điện thoại</th>
                  <th className="th-orders">Đơn hàng</th>
                  <th>Trạng thái tài khoản</th>
                  <th>Hành động</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer, idx) => (
                  <tr key={idx} className="customer-row">
                    <td className="td-customer-code">
                      <span className="customer-code-field">
                        {customer.CustomerCode ?? "N/A"}
                      </span>
                    </td>

                    <td className="td-avatar">
                      {customer.Avatar ? (
                        <img
                          src={resolveAvatarSrc(customer.Avatar)}
                          alt="avatar"
                          className="avatar-thumb"
                        />
                      ) : (
                        <div className="avatar-placeholder">?</div>
                      )}
                    </td>

                    <td className="td-full-name cell-wrap">
                      <span className="customer-field-text">
                        {customer.FullName || "N/A"}
                      </span>
                    </td>

                    <td className="td-email cell-wrap">
                      <span className="customer-field-text">
                        {customer.Email || customer.CustomerID || "N/A"}
                      </span>
                    </td>

                    <td className="td-phone cell-wrap">
                      <span className="customer-field-text">
                        {customer.PhoneNumber || "N/A"}
                      </span>
                    </td>

                    <td className="td-orders">
                      <div className="orders-summary">
                        <div className="orders-count">
                          {customer.OrderCount ?? 0} đơn
                        </div>

                        <div className="orders-total">
                          {formatPrice(customer.Total || 0)}
                        </div>
                      </div>
                    </td>

                    <td className="td-account-status">
                      <span
                        className={`type-badge ${
                          isAccountCustomer(customer) ? "account" : "guest"
                        }`}
                      >
                        {getAccountStatusLabel(customer)}
                      </span>
                    </td>

                    <td className="actions-cell td-actions">
                      <button
                        className="btn-action detail"
                        onClick={() => fetchCustomerDetail(customer.CustomerID)}
                      >
                        Chi tiết
                      </button>
                      <button
                        className="btn-action delete"
                        onClick={() => openDeleteConfirmPopup(customer)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CustomerDetailModal
        open={showDetailPopup}
        customerDetail={customerDetail}
        onClose={closeDetailPopup}
        formatPrice={formatPrice}
        resolveAvatarSrc={resolveAvatarSrc}
        openResetPasswordPopup={openResetPasswordPopup}
        isResettingPassword={isResettingPassword}
        resetPasswordMessage={resetPasswordMessage}
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
        onViewOrderDetail={handleViewOrderDetail}
      />

      <OrderDetailPopup open={showOrderDetailPopup} order={orderDetailData} onClose={closeOrderDetailPopup} />

      {showResetPasswordPopup && (
        <div
          className="confirm-popup-overlay"
          onClick={closeResetPasswordPopup}
        >
          <div className="confirm-popup" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-popup-title">
              {"Xác nhận reset mật khẩu"}
            </div>
            <div className="confirm-popup-desc">
              {"Bạn có chắc muốn reset mật khẩu cho tài khoản này không?"}
            </div>
            <div className="confirm-popup-field">
              <label>{"Mật khẩu mới"}</label>
              <input
                type="password"
                value={newResetPassword}
                onChange={(e) => setNewResetPassword(e.target.value)}
                placeholder={"Nhập mật khẩu mới (ít nhất 6 ký tự)"}
                disabled={isResettingPassword}
              />
            </div>
            <div className="confirm-popup-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={closeResetPasswordPopup}
                disabled={isResettingPassword}
              >
                {"Hủy"}
              </button>
              <button
                type="button"
                className="btn-confirm"
                onClick={handleResetPassword}
                disabled={isResettingPassword}
              >
                {isResettingPassword ? "Đang xử lý..." : "Xác nhận reset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateConfirmPopup && (
        <div
          className="confirm-popup-overlay"
          onClick={closeUpdateConfirmPopup}
        >
          <div className="confirm-popup" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-popup-title">{"Xác nhận chỉnh sửa"}</div>
            <div className="confirm-popup-desc">
              {"Bạn có chắc muốn lưu thay đổi thông tin khách hàng không?"}
            </div>
            <div className="confirm-popup-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={closeUpdateConfirmPopup}
                disabled={isSavingCustomer}
              >
                {"Hủy"}
              </button>
              <button
                type="button"
                className="btn-confirm"
                onClick={handleSaveCustomerInfo}
                disabled={isSavingCustomer}
              >
                {isSavingCustomer ? "Đang lưu..." : "Xác nhận lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateSuccessPopup && (
        <div
          className="confirm-popup-overlay"
          onClick={closeUpdateSuccessPopup}
        >
          <div className="confirm-popup" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-popup-title">{"Cập nhật thành công"}</div>
            <div className="confirm-popup-desc">
              {"Thông tin khách hàng đã được cập nhật thành công."}
            </div>
            <div className="confirm-popup-actions">
              <button
                type="button"
                className="btn-ok"
                onClick={closeUpdateSuccessPopup}
              >
                {"Đóng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirmPopup && (
        <div className="confirm-popup-overlay" onClick={closeDeleteConfirmPopup}>
          <div className="confirm-popup" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-popup-title">{"Xác nhận xóa khách hàng"}</div>
            <div className="confirm-popup-desc">
              {customerToDelete?.FullName
                ? `Bạn có chắc muốn xóa khách hàng ${customerToDelete.FullName} không?`
                : "Bạn có chắc muốn xóa khách hàng này không?"}
            </div>
            <div className="confirm-popup-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={closeDeleteConfirmPopup}
              >
                {"Hủy"}
              </button>
              <button
                type="button"
                className="btn-confirm"
                onClick={handleDeleteCustomer}
              >
                {"Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateCustomerPopup
        open={showCreateCustomerPopup}
        isCreating={isCreatingCustomer}
        form={createCustomerForm}
        onClose={closeCreateCustomerPopup}
        onChangeField={handleChangeCreateCustomerForm}
        onAvatarFileChange={handleCreateAvatarFileChange}
        onAvatarDrop={handleCreateAvatarDrop}
        onEditAvatar={handleOpenAvatarEditor}
        onSubmit={handleCreateCustomer}
      />

      <AvatarCropEditor
        open={showAvatarEditor}
        source={avatarEditorSource}
        onClose={handleCloseAvatarEditor}
        onApply={handleApplyAvatarEdit}
      />
    </div>
  );
};

export default CustomerPage;
