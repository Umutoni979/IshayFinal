import api from './axios';

export const rehearsalsApi = {
  getAll:        (params)     => api.get('/rehearsals', { params }),
  getById:       (id)         => api.get(`/rehearsals/${id}`),
  getForMember:  (memberId)   => api.get(`/rehearsals/member/${memberId}`),
  create:        (data)       => api.post('/rehearsals', data),
  update:        (id, data)   => api.put(`/rehearsals/${id}`, data),
  delete:        (id)         => api.delete(`/rehearsals/${id}`),
};
