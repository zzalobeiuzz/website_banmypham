import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const useHttp = (method = "GET", url = "", payload = null, autoExecute = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoExecute);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios({
        method: method.toLowerCase(),
        url,
        data: payload,
      });

      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [method, url, payload]);

  useEffect(() => {
    if (autoExecute) {
      execute();
    }
  }, [execute, autoExecute]);

  return { data, loading, error, execute };
};

export default useHttp;
