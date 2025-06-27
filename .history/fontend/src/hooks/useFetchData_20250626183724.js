import { useEffect, useState } from 'react';

/**
 * useFetchData là một custom hook dùng để gọi API GET và xử lý dữ liệu trả về.
 * Nó tự động fetch dữ liệu khi component mount hoặc URL thay đổi.
 *
 * @param {string} url - Đường dẫn API cần fetch.
 * @returns {{
 *   data: any[],          // Dữ liệu trả về từ API
 *   loading: boolean,     // Trạng thái đang tải
 *   error: string|null    // Thông báo lỗi nếu xảy ra
 * }}
 */
const useFetchData = (url) => {
  // Khởi tạo state cho dữ liệu, trạng thái loading và lỗi
  const [data, setData] = useState([]);             // Dữ liệu lấy được từ API
  const [loading, setLoading] = useState(true);     // Cờ loading (true khi đang fetch)
  const [error, setError] = useState(null);         // Thông báo lỗi nếu có

  useEffect(() => {
    // Hàm fetch dữ liệu từ API
    const fetchData = async () => {
      try {
        // Gọi API với phương thức GET
        const response = await fetch(url);

        // Nếu response không thành công (status !== 200-299) thì ném lỗi
        if (!response.ok) {
          throw new Error('Lỗi khi tải dữ liệu');
        }

        // Chuyển response sang JSON và cập nhật state
        const result = await response.json();
        setData(result);
      } catch (error) {
        // Nếu có lỗi thì gán vào state error
        setError(error.message);
      } finally {
        // Dù thành công hay thất bại cũng set loading về false
        setLoading(false);
      }
    };

    // Gọi hàm fetch khi hook mount hoặc khi url thay đổi
    fetchData();
  }, [url]); // Mỗi lần url thay đổi thì fetch lại

  // Trả về kết quả cho component sử dụng
  return { data, loading, error };
};

export default useFetchData;
