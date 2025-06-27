import axios from "axios";
import { useState } from "react";

const useHttp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Gửi request theo method, url và data động.
   * @param {"GET" | "POST" | "PUT" | "DELETE"} method 
   * @param {string} url 
   * @param {object} [payload] 
   * @returns {Promise<any>} Dữ liệu trả về từ server
   */
  const request = async (method, url, payload = null) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios({
        method: method.toLowerCase(),
        url,
        data: payload,
      });

      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || "Có lỗi xảy ra";
      setError(message);
      throw new Error(message); // Cho phép phía gọi xử lý tiếp
    } finally {
      setLoading(false);
    }
  };

  return { request, loading, error };
};

export default useHttp;
