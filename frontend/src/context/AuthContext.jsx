import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // True while checking stored token

  // On mount, verify stored token and fetch fresh user data
  useEffect(() => {
    const token = storage.get('token');
    let mounted = true;
    const fallbackTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 8000);

    if (token) {
      authAPI.getMe()
        .then(({ data }) => {
          if (mounted) setUser(data.user);
        })
        .catch((err) => {
          // Only clear token on explicit 401 Unauthorized — not on network errors
          if (err?.response?.status === 401) {
            storage.remove('token');
            storage.remove('user');
          }
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    storage.set('token', data.token);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData);
    storage.set('token', data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    storage.remove('token');
    storage.remove('user');
    setUser(null);
  }, []);

  // Refresh user data after trades/balance changes
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
    } catch (_) {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
