import api from './axios';

export const authApi = {
  registrationStatus: ()                => api.get('/auth/registration-status'),
  register:           (data)            => api.post('/auth/register', data),
  login:          (data)            => api.post('/auth/login', data),
  logout:         ()                => api.post('/auth/logout'),
  getMe:          ()                => api.get('/auth/me'),
  refreshToken:   ()                => api.post('/auth/refresh-token'),
  forgotPassword: (email)           => api.post('/auth/forgot-password', { email }),
  resetPassword:  (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  verifyCode:     (userId, code)    => api.post('/auth/verify-code', { userId, code }),
  setPassword:    (userId, password)=> api.post('/auth/set-password', { userId, password }),
  getSessions:    ()                => api.get('/auth/sessions'),
  deleteSession:  (id)              => api.delete(`/auth/sessions/${id}`),
};
