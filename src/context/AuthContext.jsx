import React, { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('admin_token');
      if (token) {
        try {
          const { data } = await client.get('/auth/me');
          if (data.user.role !== 'admin') {
            throw new Error('Not an admin');
          }
          setUser(data.user);
        } catch {
          localStorage.removeItem('admin_token');
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (phone, password) => {
    const { data } = await client.post('/auth/login', { phone, password });
    if (data.user.role !== 'admin') {
      throw new Error('الحساب ده مش أدمن');
    }
    localStorage.setItem('admin_token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
