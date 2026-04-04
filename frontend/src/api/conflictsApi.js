import api from './axios';

export const conflictsApi = {
  getAll:       (params)   => api.get('/conflicts', { params }),
  getById:      (id)       => api.get(`/conflicts/${id}`),
  getForMember: (memberId) => api.get(`/conflicts/member/${memberId}`),
  resolve:      (id, resolution) => api.put(`/conflicts/${id}/resolve`, { resolution }),
  ignore:       (id)       => api.put(`/conflicts/${id}/ignore`),
  detect:       ()         => api.post('/conflicts/detect'),
};
