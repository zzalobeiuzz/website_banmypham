import React, { useCallback, useEffect, useMemo, useState } from "react";

import GlobalAlertPopup from "./components/GlobalAlertPopup";
import { API_BASE } from "./constants";

const CHECK_INTERVAL_MS = 1200;
const REQUEST_TIMEOUT_MS = 6000;

const checkDatabaseConnection = async () => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}/api/health/database`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data?.success || data?.status !== "connected") {
      throw new Error(data?.message || "Database is not ready");
    }

    return data;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const AppBootstrap = ({ children }) => {
  const [state, setState] = useState({
    ready: false,
    checking: true,
    attempts: 0,
    error: "",
  });

  const verifyConnection = useCallback(async () => {
    setState((current) => ({
      ...current,
      checking: true,
      error: "",
    }));

    try {
      await checkDatabaseConnection();
      setState((current) => ({
        ...current,
        ready: true,
        checking: false,
        error: "",
      }));
    } catch (err) {
      setState((current) => ({
        ready: false,
        checking: false,
        attempts: current.attempts + 1,
        error:
          err.name === "AbortError"
            ? "Kết nối dữ liệu quá lâu, hệ thống đang thử lại."
            : "Chưa kết nối được dữ liệu, hệ thống đang thử lại.",
      }));
    }
  }, []);

  useEffect(() => {
    if (state.ready) return undefined;

    const timerId = window.setTimeout(verifyConnection, state.attempts === 0 ? 0 : CHECK_INTERVAL_MS);
    return () => window.clearTimeout(timerId);
  }, [state.attempts, state.ready, verifyConnection]);

  const statusText = useMemo(() => {
    if (state.checking) return "Đang kết nối dữ liệu...";
    return state.error || "Đang chờ dữ liệu sẵn sàng...";
  }, [state.checking, state.error]);

  if (state.ready) {
    return children;
  }

  return (
    <>
      <main className="app-bootstrap" role="status" aria-live="polite">
        <section className="app-bootstrap__card">
          <div className="app-bootstrap__mark" aria-hidden="true">
            <span />
          </div>
          <p className="app-bootstrap__eyebrow">TINY Store</p>
          <h1>Đang chuẩn bị dữ liệu</h1>
          <p className="app-bootstrap__message">{statusText}</p>
          <button type="button" className="app-bootstrap__retry" onClick={verifyConnection}>
            Thử lại ngay
          </button>
        </section>
      </main>
      <GlobalAlertPopup />
    </>
  );
};

export default AppBootstrap;
