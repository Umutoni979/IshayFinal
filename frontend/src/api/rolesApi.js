import api from './axios';

export const rolesApi = {
  getAll:   (params)      => api.get('/roles', { params }),
  getById:  (id)          => api.get(`/roles/${id}`),
  create:   (data)        => api.post('/roles', data),
  update:   (id, data)    => api.put(`/roles/${id}`, data),
  delete:   (id)          => api.delete(`/roles/${id}`),
  assign:   (id, memberId) => api.post(`/roles/${id}/assign`, { member_id: memberId }),
  approve:  (id)          => api.post(`/roles/${id}/approve`),
};
