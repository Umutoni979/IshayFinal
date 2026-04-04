import api from './axios';

export const notificationsApi = {
  getAll:      ()           => api.get('/notifications'),
  send:        (data)       => api.post('/notifications/send', data),
  markRead:    (id)         => api.put(`/notifications/${id}/read`),
  markAllRead: ()           => api.put('/notifications/mark-all-read'),
  delete:      (id)         => api.delete(`/notifications/${id}`),
};
