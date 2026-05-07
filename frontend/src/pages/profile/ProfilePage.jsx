import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { usersApi } from '../../api/usersApi';
import { authApi } from '../../api/authApi';
import { rolesApi } from '../../api/rolesApi';
import toast from 'react-hot-toast';
import { Camera, User, Monitor, Smartphone, Globe, Trash2, Theater } from 'lucide-react';

const BASIC_ROLES = ['actor', 'crew', 'guest'];
const statusStyle = {
  open:     'bg-gray-100 text-gray-600',
  assigned: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
};

const parseDevice = (ua = '') => {
  if (!ua) return { icon: 'globe', label: 'Unknown device' };
  if (/mobile|android|iphone|ipad/i.test(ua)) return { icon: 'phone', label: 'Mobile' };
  return { icon: 'monitor', label: 'Desktop' };
};

const parseBrowser = (ua = '') => {
  if (/Chrome/i.test(ua) && !/Edge|OPR/i.test(ua)) return 'Chrome';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  if (/Edge/i.test(ua)) return 'Edge';
  if (/OPR|Opera/i.test(ua)) return 'Opera';
  return 'Unknown browser';
};

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const isBasic = BASIC_ROLES.includes(user?.role);

  const { data: myRoles = [] } = useQuery({
    queryKey: ['my-roles', user?.id],
    queryFn: () => rolesApi.getAll().then(r =>
      r.data.data.roles.filter(role => role.assigned_to?.id === user?.id)
    ),
    enabled: isBasic && !!user?.id,
  });

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['my-sessions'],
    queryFn: () => authApi.getSessions().then(r => r.data.data.sessions),
  });

  const revokeSession = useMutation({
    mutationFn: (id) => authApi.deleteSession(id),
    onSuccess: () => { queryClient.invalidateQueries(['my-sessions']); toast.success('Session revoked'); },
    onError: () => toast.error('Failed to revoke session'),
  });

  const avatarMutation = useMutation({
    mutationFn: (formData) => usersApi.uploadAvatar(user.id, formData),
    onSuccess: (res) => {
      const newUrl = res.data.data.profile_image;
      setUser((prev) => ({ ...prev, profile_image: newUrl }));
      queryClient.invalidateQueries(['admin-users']);
      setPreview(null);
      toast.success('Profile picture updated!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Upload failed'),
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append('avatar', file);
    avatarMutation.mutate(formData);
  };

  const avatarSrc = preview
    ? preview
    : user?.profile_image
      ? `${API_BASE}${user.profile_image}`
      : null;

  return (
    <div>
      <h1 className="text-2xl font-normal text-slate-800 mb-1">My Profile</h1>
      <p className="text-sm text-gray-600 mb-8">View and update your profile information</p>

      <div className="bg-white border border-gray-200 rounded-sm p-8 max-w-lg">
        {/* Avatar section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center border-2 border-gray-200">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-orange-500">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Overlay button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarMutation.isPending}
              className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-wait"
            >
              <Camera size={20} className="text-white" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarMutation.isPending}
            className="mt-3 text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors disabled:opacity-50"
          >
            {avatarMutation.isPending ? 'Uploading…' : 'Change photo'}
          </button>
          <p className="text-xs text-gray-600 mt-1">JPG, PNG or WEBP · Max 2 MB</p>
        </div>

        {/* User info (read-only fields) */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded px-3 py-2 bg-gray-50">
              <User size={14} className="text-gray-600 shrink-0" />
              <span className="text-sm text-slate-800">{user?.name}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <div className="border border-gray-200 rounded px-3 py-2 bg-gray-50">
              <span className="text-sm text-slate-800">{user?.email}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
              <div className="border border-gray-200 rounded px-3 py-2 bg-gray-50">
                <span className="text-sm text-slate-800">{user?.role}</span>
              </div>
            </div>
            {user?.member_type && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <div className="border border-gray-200 rounded px-3 py-2 bg-gray-50">
                  <span className="text-sm text-slate-800">{user.member_type}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* My Roles — only for actor/crew/guest */}
      {isBasic && (
        <div className="bg-white border border-gray-200 rounded-sm p-8 max-w-lg mt-6">
          <h2 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Theater size={16} className="text-indigo-500" /> My Production Roles
          </h2>
          <p className="text-xs text-gray-600 mb-4">Parts you have been assigned to in productions.</p>

          {myRoles.length === 0 ? (
            <p className="text-xs text-gray-600">No roles assigned to you yet.</p>
          ) : (
            <div className="space-y-2">
              {myRoles.map(role => (
                <div key={role.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{role.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{role.Production?.title || '—'}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle[role.status]}`}>
                    {role.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sessions */}
      <div className="bg-white border border-gray-200 rounded-sm p-8 max-w-lg mt-6">
        <h2 className="text-base font-bold text-slate-800 mb-1">Active Sessions</h2>
        <p className="text-xs text-gray-600 mb-4">These are devices currently signed into your account.</p>

        {sessionsLoading ? (
          <p className="text-xs text-gray-600">Loading…</p>
        ) : !sessionsData?.length ? (
          <p className="text-xs text-gray-600">No session records yet.</p>
        ) : (
          <div className="space-y-2">
            {sessionsData.map(s => {
              const dev     = parseDevice(s.user_agent);
              const browser = parseBrowser(s.user_agent);
              const DevIcon = dev.icon === 'phone' ? Smartphone : dev.icon === 'monitor' ? Monitor : Globe;
              return (
                <div key={s.id} className={`flex items-center gap-3 p-3 rounded border ${s.is_current ? 'border-orange-200 bg-orange-50' : 'border-gray-100'}`}>
                  <DevIcon size={18} className={s.is_current ? 'text-orange-400' : 'text-gray-600'} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-700">{browser} · {dev.label}</span>
                      {s.is_current && <span className="text-[10px] bg-orange-100 text-orange-600 font-semibold px-1.5 py-0.5 rounded">Current</span>}
                    </div>
                    <div className="text-[11px] text-gray-600 mt-0.5">
                      {s.ip_address || 'Unknown IP'} · {new Date(s.created_at).toLocaleString()}
                    </div>
                  </div>
                  {!s.is_current && (
                    <button
                      onClick={() => revokeSession.mutate(s.id)}
                      disabled={revokeSession.isPending}
                      className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Revoke session"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
