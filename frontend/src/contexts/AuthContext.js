import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Create a shared axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Interceptor: on 401, try refreshing the token once, then retry
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { api };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.get('/api/auth/me');
      setUser(data);
    } catch (error) {
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const register = useCallback(async (email, password, name) => {
    try {
      const { data } = await api.post('/api/auth/register', { email, password, name });
      setUser(data);
      return { success: true };
    } catch (error) {
      const message = formatApiErrorDetail(error.response?.data?.detail) || error.message;
      return { success: false, error: message };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      setUser(data);
      return { success: true };
    } catch (error) {
      const message = formatApiErrorDetail(error.response?.data?.detail) || error.message;
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
      setUser(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, register, login, logout, checkAuth }),
    [user, loading, register, login, logout, checkAuth]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};