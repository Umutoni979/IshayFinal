import api from './axios';

export const usersApi = {
  getAll:             (params) => api.get('/users', { params }),
  getById:            (id)     => api.get(`/users/${id}`),
  update:             (id, data) => api.put(`/users/${id}`, data),
  delete:             (id)     => api.delete(`/users/${id}`),
  deactivate:         (id)     => api.patch(`/users/${id}/deactivate`),
  getAttendanceSummary: (id)   => api.get(`/users/${id}/attendance-summary`),
  getAssignedRoles:   (id)     => api.get(`/users/${id}/assigned-roles`),
  uploadAvatar:       (id, formData) => api.patch(`/users/${id}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};
