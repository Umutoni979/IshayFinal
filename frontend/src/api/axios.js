import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// Attach JWT access token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401 — but only for protected routes, never for auth/me or refresh-token itself
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const url = original?.url || '';

    // Don't retry on these endpoints — just reject
    const skipRetry =
      original._retry ||
      url.includes('/auth/me') ||
      url.includes('/auth/refresh-token') ||
      url.includes('/auth/login') ||
      url.includes('/auth/registration-status');

    if (error.response?.status === 401 && !skipRetry) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        localStorage.setItem('accessToken', data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
