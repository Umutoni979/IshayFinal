import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await authApi.getMe();
        setUser(data.data.user);
      } catch {
        localStorage.removeItem('accessToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (credentials) => {
    try {
      const { data } = await authApi.login(credentials);
      localStorage.setItem('accessToken', data.data.accessToken);
      setUser(data.data.user);
      return { user: data.data.user };
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.code === 'MUST_CHANGE_PASSWORD') {
        return { code: 'MUST_CHANGE_PASSWORD', userId: errData.userId, message: errData.message };
      }
      throw err;
    }
  };

  const logout = async () => {
    await authApi.logout().catch(() => {});
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
