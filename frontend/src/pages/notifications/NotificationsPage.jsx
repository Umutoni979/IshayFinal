import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../api/notificationsApi';
import { timeAgo } from '../../utils/formatDate';
import toast from 'react-hot-toast';
import { Bell, CheckCheck } from 'lucide-react';

const NotificationsPage = () => {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll().then(r => r.data.data.notifications),
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => { queryClient.invalidateQueries(['notifications']); toast.success('All marked as read'); },
  });

  const markMutation = useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  });

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Bell size={24} /> Notifications
        </h1>
        <button
          onClick={() => markAllMutation.mutate()}
          className="flex items-center gap-1.5 bg-slate-500 hover:bg-slate-600 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors"
        >
          <CheckCheck size={15} /> Mark all read
        </button>
      </div>

      <div className="space-y-2">
        {isLoading && <div className="text-gray-400">Loading…</div>}
        {!isLoading && notifications.length === 0 && (
          <div className="text-center text-gray-400 py-12">No notifications yet.</div>
        )}
        {notifications.map(n => (
          <div
            key={n.id}
            onClick={() => !n.is_read && markMutation.mutate(n.id)}
            className={`bg-white rounded-xl border p-4 cursor-pointer transition-colors ${n.is_read ? 'border-gray-100' : 'border-slate-200 bg-slate-50'}`}
          >
            <div className="flex justify-between items-start mb-1">
              <p className={`text-sm font-semibold ${n.is_read ? 'text-gray-700' : 'text-slate-800'}`}>{n.title}</p>
              <span className="text-xs text-gray-400">{timeAgo(n.created_at)}</span>
            </div>
            <p className="text-sm text-gray-500">{n.body}</p>
            <p className="text-xs text-gray-400 mt-1">{n.type.replace('_', ' ')}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
