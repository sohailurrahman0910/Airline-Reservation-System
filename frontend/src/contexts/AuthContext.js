import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Shared axios instance with Bearer token
const api = axios.create({ baseURL: API_URL });

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, try refreshing once
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) return Promise.reject(error);

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(orig));
      }

      orig._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refresh_token: refreshToken });
        localStorage.setItem('access_token', data.access_token);
        processQueue(null);
        return api(orig);
      } catch (e) {
        processQueue(e);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return Promise.reject(e);
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
  if (!context) throw new Error('useAuth must be used within AuthProvider');
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
    const token = localStorage.getItem('access_token');
    if (!token) { setUser(false); setLoading(false); return; }
    try {
      const { data } = await api.get('/api/auth/me');
      setUser(data);
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const register = useCallback(async (email, password, name) => {
    try {
      const { data } = await api.post('/api/auth/register', { email, password, name });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setUser({ id: data.id, email: data.email, name: data.name, role: data.role });
      return { success: true };
    } catch (error) {
      return { success: false, error: formatApiErrorDetail(error.response?.data?.detail) || error.message };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setUser({ id: data.id, email: data.email, name: data.name, role: data.role });
      return { success: true };
    } catch (error) {
      return { success: false, error: formatApiErrorDetail(error.response?.data?.detail) || error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/api/auth/logout'); } catch {}
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(false);
  }, []);

  const value = useMemo(
    () => ({ user, loading, register, login, logout, checkAuth }),
    [user, loading, register, login, logout, checkAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};