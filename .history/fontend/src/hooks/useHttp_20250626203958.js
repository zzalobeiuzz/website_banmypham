import axios from "axios";
import { useCallback, useState } from "react";

const useHttp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, url, payload = null,mess) => {
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
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { request, loading, error };
};

export default useHttp;
