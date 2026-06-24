/**
 * 🔐 AUTH CONTEXT
 * -----------------------------------------
 * Quản lý đăng nhập toàn app
 * - Lưu user
 * - Login / Logout
 * - Sync localStorage
 */

import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();
const AUTH_SESSION_KEY = "authSessionActive";
const AUTH_REMEMBER_KEY = "authRemember";

const clearStoredAuth = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem(AUTH_REMEMBER_KEY);
  sessionStorage.removeItem(AUTH_SESSION_KEY);
};

const getStoredUser = () => {
  const rememberLogin = localStorage.getItem(AUTH_REMEMBER_KEY) === "true";
  const hasActiveSession = sessionStorage.getItem(AUTH_SESSION_KEY) === "true";

  // Nếu lần đăng nhập trước không tick "Ghi nhớ", token chỉ có hiệu lực trong phiên trình duyệt.
  // Khi đóng browser, sessionStorage mất đi; lần mở lại sẽ xoá token/user khỏi localStorage.
  if (localStorage.getItem(AUTH_REMEMBER_KEY) === "false" && !hasActiveSession) {
    clearStoredAuth();
    return null;
  }

  const stored = localStorage.getItem("user");
  if (!stored) return null;

  try {
    if (!rememberLogin) {
      sessionStorage.setItem(AUTH_SESSION_KEY, "true");
    }
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());

  const syncUser = (nextUser) => {
    if (nextUser) {
      localStorage.setItem("user", JSON.stringify(nextUser));
      sessionStorage.setItem(AUTH_SESSION_KEY, "true");
    } else {
      clearStoredAuth();
    }

    setUser(nextUser);
    window.dispatchEvent(new Event("user-updated"));
  };

  const login = (userData) => {
    syncUser(userData);
  };

  const updateUser = (nextUser) => {
    syncUser(nextUser);
  };

  const logout = () => {
    syncUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// 👉 hook dùng nhanh
export const useAuth = () => useContext(AuthContext);
