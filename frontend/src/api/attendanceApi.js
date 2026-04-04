import api from './axios';

export const attendanceApi = {
  getByRehearsal:       (rehearsalId)  => api.get(`/attendance/rehearsal/${rehearsalId}`),
  getByMember:          (memberId)     => api.get(`/attendance/member/${memberId}`),
  getSummaryByProduction: (productionId) => api.get(`/attendance/summary/${productionId}`),
  mark:                 (data)         => api.post('/attendance/mark', data),
  update:               (id, data)     => api.put(`/attendance/${id}`, data),
  selfCheckin:          (rehearsalId, status) => api.post(`/attendance/self-checkin/${rehearsalId}`, { status }),
};
