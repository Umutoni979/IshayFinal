import api from './axios';

export const adminApi = {
  getAllUsers:         ()                        => api.get('/admin/users'),
  createUser:         (data)                    => api.post('/admin/users', data),
  setStatus:          (id, is_active)           => api.patch(`/admin/users/${id}/status`, { is_active }),
  changeRole:         (id, role)                => api.patch(`/admin/users/${id}/role`, { role }),
  updatePermissions:  (id, custom_permissions)  => api.patch(`/admin/users/${id}/permissions`, { custom_permissions }),
  updateUser:          (id, data)                 => api.put(`/admin/users/${id}`, data),
  deleteUser:          (id)                       => api.delete(`/admin/users/${id}`),
  resendVerification:  (id)                       => api.post(`/admin/users/${id}/resend-verification`),
  toggleRegistration:   (enable) => api.post('/admin/settings/registration', { enable }),
  getSelfCheckinStatus:  ()              => api.get('/admin/settings/self-checkin'),
  toggleSelfCheckin:     (enable)        => api.post('/admin/settings/self-checkin', { enable }),
  openSelfCheckin:       (windowMinutes) => api.post('/admin/settings/self-checkin/open', { windowMinutes }),
};
