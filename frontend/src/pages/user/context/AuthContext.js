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

const getStoredUser = () => {
  const stored = localStorage.getItem("user");
  if (!stored) return null;

  try {
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
    } else {
      localStorage.removeItem("user");
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