import axios from "axios";
import { useCallback, useState } from "react";

/**
 * Custom hook để thực hiện HTTP request sử dụng axios.
 * Tự động quản lý trạng thái loading và error trong khi gửi request.
 */
const useHttp = () => {
  // Trạng thái đang tải (true khi đang gửi request)
  const [loading, setLoading] = useState(false);

  // Trạng thái lỗi (lưu thông điệp lỗi khi request thất bại)
  const [error, setError] = useState(null);

  /**
   * Hàm gửi HTTP request.
   *
   * @param {string} method - Phương thức HTTP (GET, POST, PUT, DELETE, ...)
   * @param {string} url - URL của endpoint cần gọi
   * @param {object|null} payload - Dữ liệu gửi đi (body hoặc query), mặc định là null
   * @returns {Promise<any>} - Dữ liệu trả về từ response nếu thành công
   */
  const request = useCallback(async (method, url, payload = null, headers = {}) => {
    setLoading(true);     // Bắt đầu hiển thị trạng thái loading
    setError(null);       // Reset lỗi cũ (nếu có)

    try {
      const safeHeaders = headers && typeof headers === "object" && !Array.isArray(headers) ? headers : {};
      const mergedHeaders = { ...safeHeaders };

      // Tự gắn access token cho toàn bộ API admin nếu caller chưa truyền Authorization.
      if (typeof url === "string" && url.includes("/api/admin/") && !mergedHeaders.Authorization) {
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken) {
          mergedHeaders.Authorization = `Bearer ${accessToken}`;
        }
      }

      // Gửi request với cấu hình từ axios
      const response = await axios({
        method: method.toLowerCase(),  // Chuyển method về lowercase để axios hiểu đúng
        url,                           // Endpoint API
        data: payload,                  // Dữ liệu gửi đi (body)
        headers: mergedHeaders,         // Header gửi lên server
        withCredentials: true, // 👈👈👈 Thêm dòng này để gửi cookie session
      });

      // Nếu thành công, trả về dữ liệu từ response
      return response.data;
    } catch (err) {
      // Nếu lỗi xảy ra, lấy thông báo lỗi trả về từ server hoặc dùng thông báo mặc định
      const message = err.response?.data?.message || "Có lỗi xảy ra";
      const status = err.response?.status || 500;

      // Cập nhật lỗi vào state để component có thể hiển thị
      setError(message);

      // Ném lỗi ra ngoài để nơi gọi xử lý tiếp (ví dụ: alert, toast, ...)
      // 🔥 Tạo error object đúng chuẩn
      const customError = new Error(message);
      customError.status = status;

      throw customError;
    } finally {
      // Dù thành công hay thất bại, cũng kết thúc trạng thái loading
      setLoading(false);
    }
  }, []);

  // Trả về hàm request cùng với trạng thái loading và error
  return { request, loading, error };
};

export default useHttp;
