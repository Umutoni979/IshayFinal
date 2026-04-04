import api from './axios';

export const productionsApi = {
  // Core
  getAll:     ()          => api.get('/productions'),
  getById:    (id)        => api.get(`/productions/${id}`),
  getMembers: (id)        => api.get(`/productions/${id}/members`),
  create:     (data)      => api.post('/productions', data),
  update:     (id, data)  => api.put(`/productions/${id}`, data),
  delete:     (id)        => api.delete(`/productions/${id}`),

  // Milestones
  getMilestones:   (id)            => api.get(`/productions/${id}/milestones`),
  seedMilestones:  (id)            => api.post(`/productions/${id}/milestones/seed`),
  createMilestone: (id, data)      => api.post(`/productions/${id}/milestones`, data),
  updateMilestone: (id, mid, data) => api.put(`/productions/${id}/milestones/${mid}`, data),
  deleteMilestone: (id, mid)       => api.delete(`/productions/${id}/milestones/${mid}`),

  // Events
  getEvents:   (id)            => api.get(`/productions/${id}/events`),
  createEvent: (id, data)      => api.post(`/productions/${id}/events`, data),
  updateEvent: (id, eid, data) => api.put(`/productions/${id}/events/${eid}`, data),
  deleteEvent: (id, eid)       => api.delete(`/productions/${id}/events/${eid}`),

  // Performance Report
  getPerformanceReport:  (id)       => api.get(`/productions/${id}/performance-report`),
  savePerformanceReport: (id, data) => api.post(`/productions/${id}/performance-report`, data),

  // Rehearsal Attendance
  getRehearsalAttendance: (id) => api.get(`/productions/${id}/rehearsal-attendance`),
};
