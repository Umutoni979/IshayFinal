import api from './axios';

export const reportsApi = {
  getAttendance:      (params)        => api.get('/reports/attendance', { params }),
  getProduction:      (productionId)  => api.get(`/reports/production/${productionId}`),
  getMemberPerformance: (memberId)    => api.get(`/reports/member/${memberId}`),
};
