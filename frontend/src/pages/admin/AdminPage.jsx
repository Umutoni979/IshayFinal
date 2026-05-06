import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import { authApi } from '../../api/authApi';
import toast from 'react-hot-toast';
import { X, ShieldCheck, UserPlus, Lock, Pencil, Trash2, MoreVertical, ScanLine } from 'lucide-react';
import { ROLES } from '../../utils/constants';
import SearchFilters from '../../components/common/SearchFilters';
import DataTable from '../../components/common/DataTable';
import { TableSkeleton } from '../../components/common/Skeleton';

const PERMISSION_GROUPS = [
  { page: 'Admin Page',        path: '/admin',        perms: ['users:read', 'users:write', 'admin:manage'] },
  { page: 'Productions',       path: '/productions',  perms: ['productions:write', 'productions:delete'] },
  { page: 'Roles & Casting',   path: '/roles',        perms: ['roles:write', 'roles:approve'] },
  { page: 'Rehearsals',        path: '/rehearsals',   perms: ['rehearsals:write', 'rehearsals:delete'] },
  { page: 'Attendance',        path: '/attendance',   perms: ['attendance:write'] },
  { page: 'Reports',           path: '/reports',      perms: ['reports:read', 'reports:export'] },
  { page: 'Conflicts',         path: '/conflicts',    perms: ['conflicts:resolve'] },
  { page: 'Notifications',     path: '/notifications',perms: ['notifications:send'] },
];

// Pages basic members can be granted view access to (stored as page:view permission)
const MEMBER_PAGE_ACCESS = [
  { label: 'Productions',  perm: 'productions:view',  desc: 'Can browse productions list' },
  { label: 'Rehearsals',   perm: 'rehearsals:view',   desc: 'Can see rehearsal schedule' },
  { label: 'Reports',      perm: 'reports:read',      desc: 'Can read reports' },
  { label: 'Notifications',perm: 'notifications:view',desc: 'Can receive notifications' },
];

const BASIC_ROLES = ['actor', 'crew', 'guest'];

// Mirrors backend src/config/roles.js — which permissions each role has by default
const ROLE_DEFAULT_PERMISSIONS = {
  director:    ['users:read','users:write','productions:write','productions:delete','roles:write','roles:approve','rehearsals:write','rehearsals:delete','attendance:write','reports:read','reports:export','conflicts:resolve','notifications:send','admin:manage'],
  coordinator: ['users:read','roles:write','rehearsals:write','attendance:write','reports:read','conflicts:resolve','notifications:send'],
  actor:       [],
  crew:        [],
  guest:       [],
};

const EMPTY_FORM = { name: '', email: '', temp_password: '', role: 'actor', member_type: '', phone: '', custom_permissions: [] };

const EMPTY_EDIT = { name: '', phone: '', member_type: '' };

const AdminPage = () => {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showCheckinSettings, setShowCheckinSettings] = useState(false);
  const [showPermissions, setShowPermissions] = useState(null);
  const [showEdit, setShowEdit] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [permEdit, setPermEdit] = useState([]);
  const [search, setSearch]           = useState('');
  const [roleFilter, setRoleFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null); // { id, top, left }

  useEffect(() => {
    if (!openDropdown) return;
    const close = () => setOpenDropdown(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [openDropdown]);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.getAllUsers().then(r => r.data.data.users),
  });

  const { data: regStatus } = useQuery({
    queryKey: ['registration-status'],
    queryFn: () => authApi.registrationStatus().then(r => r.data.data.enabled),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const { data: selfCheckinData } = useQuery({
    queryKey: ['self-checkin-status'],
    queryFn: () => adminApi.getSelfCheckinStatus().then(r => r.data.data),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const selfCheckinStatus = selfCheckinData?.enabled;
  const selfCheckinClosesAt = selfCheckinData?.closesAt || null;

  const [windowInput, setWindowInput] = useState('0');
  const [extendInput, setExtendInput] = useState('');

  const toggleRegMutation = useMutation({
    mutationFn: (enable) => adminApi.toggleRegistration(enable),
    onSuccess: (_, enable) => {
      queryClient.invalidateQueries(['registration-status']);
      toast.success(`Sign up ${enable ? 'enabled' : 'disabled'}`);
    },
    onError: () => toast.error('Failed to update setting'),
  });

  const closeSelfCheckinMutation = useMutation({
    mutationFn: () => adminApi.toggleSelfCheckin(false),
    onSuccess: () => {
      queryClient.invalidateQueries(['self-checkin-status']);
      queryClient.invalidateQueries(['self-checkin-status-member']);
      setShowCheckinSettings(false);
      toast.success('Self check-in closed');
    },
    onError: () => toast.error('Failed to close check-in'),
  });

  const openSelfCheckinMutation = useMutation({
    mutationFn: (windowMinutes) => adminApi.openSelfCheckin(windowMinutes),
    onSuccess: () => {
      queryClient.invalidateQueries(['self-checkin-status']);
      queryClient.invalidateQueries(['self-checkin-status-member']);
      setShowCheckinSettings(false);
      toast.success('Self check-in opened!');
    },
    onError: () => toast.error('Failed to open check-in'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => adminApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('User created! Credentials sent to their email.');
      setShowCreate(false);
      setForm(EMPTY_FORM);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create user'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, is_active }) => adminApi.setStatus(id, is_active),
    onSuccess: () => { queryClient.invalidateQueries(['admin-users']); toast.success('Status updated'); },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => adminApi.changeRole(id, role),
    onSuccess: () => { queryClient.invalidateQueries(['admin-users']); toast.success('Role updated'); },
  });

  const permMutation = useMutation({
    mutationFn: ({ id, perms }) => adminApi.updatePermissions(id, perms),
    onSuccess: () => { queryClient.invalidateQueries(['admin-users']); toast.success('Permissions saved'); setShowPermissions(null); },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateUser(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['admin-users']); toast.success('User updated'); setShowEdit(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteUser(id),
    onSuccess: () => { queryClient.invalidateQueries(['admin-users']); toast.success('User deleted'); setDeleteConfirm(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const togglePerm = (perm, arr, setArr) => {
    setArr(arr.includes(perm) ? arr.filter(p => p !== perm) : [...arr, perm]);
  };

  const openPermissions = (user) => {
    setPermEdit(user.custom_permissions || []);
    setShowPermissions(user); // store full user to know role
  };

  const openEdit = (user) => {
    setEditForm({ name: user.name, phone: user.phone || '', member_type: user.member_type || '' });
    setShowEdit(user);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-normal text-slate-800">Admin</h1>
          <p className="text-sm text-gray-400">User management and system settings</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCheckinSettings(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors text-white ${selfCheckinStatus ? 'bg-orange-500 hover:bg-orange-600' : 'bg-orange-500 hover:bg-orange-600'}`}
          >
            <ScanLine size={15} />
            Self check-in: {selfCheckinStatus ? 'On' : 'Off'}
          </button>
          <button
            onClick={() => toggleRegMutation.mutate(!regStatus)}
            disabled={toggleRegMutation.isPending}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
            title={regStatus ? 'Click to disable sign-up' : 'Click to enable sign-up'}
          >
            {regStatus ? <UserPlus size={15} /> : <Lock size={15} />}
            Sign up: {regStatus ? 'On' : 'Off'}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            + User
          </button>
        </div>
      </div>

      {/* ── Self Check-in Settings Modal ── */}
      {showCheckinSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ScanLine size={18} /> Self Check-in
              </h2>
              <button onClick={() => setShowCheckinSettings(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            {selfCheckinStatus ? (
              /* ── Currently OPEN ── */
              <div>
                <div className="text-center mb-4">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ScanLine size={24} className="text-green-600" />
                  </div>
                  <p className="font-semibold text-slate-800 mb-1">Check-in is open</p>
                  {selfCheckinClosesAt ? (
                    <p className="text-sm text-gray-500">
                      Closes at <strong>{new Date(selfCheckinClosesAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">No time limit</p>
                  )}
                </div>

                {/* Extend time */}
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Extend by</p>
                  <div className="flex gap-2 mb-2">
                    {[15, 30, 60].map(mins => (
                      <button
                        key={mins}
                        onClick={() => {
                          const base = selfCheckinClosesAt ? new Date(selfCheckinClosesAt).getTime() : Date.now();
                          openSelfCheckinMutation.mutate(Math.round((base + mins * 60 * 1000 - Date.now()) / 60000));
                        }}
                        disabled={openSelfCheckinMutation.isPending}
                        className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 py-2 rounded-lg text-xs font-semibold disabled:opacity-60 transition-colors"
                      >
                        +{mins < 60 ? `${mins}m` : '1h'}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Custom minutes…"
                      value={extendInput}
                      onChange={e => setExtendInput(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <button
                      onClick={() => {
                        const mins = parseInt(extendInput);
                        if (!mins || mins < 1) return;
                        const base = selfCheckinClosesAt ? new Date(selfCheckinClosesAt).getTime() : Date.now();
                        openSelfCheckinMutation.mutate(Math.round((base + mins * 60 * 1000 - Date.now()) / 60000));
                        setExtendInput('');
                      }}
                      disabled={!extendInput || openSelfCheckinMutation.isPending}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 rounded-lg text-sm font-semibold disabled:opacity-40 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => closeSelfCheckinMutation.mutate()}
                  disabled={closeSelfCheckinMutation.isPending}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 transition-colors"
                >
                  {closeSelfCheckinMutation.isPending ? 'Closing…' : 'Close Check-in Now'}
                </button>
              </div>
            ) : (
              /* ── Currently CLOSED — pick window and open ── */
              <div>
                <p className="text-sm font-medium text-gray-600 mb-3">How long will check-in be open?</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: 'No limit', value: '0' },
                    { label: '15 min',   value: '15' },
                    { label: '30 min',   value: '30' },
                    { label: '1 hour',   value: '60' },
                    { label: '2 hours',  value: '120' },
                    { label: '3 hours',  value: '180' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setWindowInput(opt.value)}
                      className={`py-2.5 rounded-lg text-xs font-semibold border transition-colors ${
                        windowInput === opt.value
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => openSelfCheckinMutation.mutate(parseInt(windowInput))}
                  disabled={openSelfCheckinMutation.isPending}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 transition-colors"
                >
                  {openSelfCheckinMutation.isPending ? 'Opening…' : 'Open Check-in'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Create User Modal ── */}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-800">Create New User</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                  <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="user@email.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Role *</label>
                  <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
                    {Object.values(ROLES).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Member Type</label>
                  <select value={form.member_type} onChange={e => setForm({...form, member_type: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
                    <option value="">— None —</option>
                    <option value="actor">Actor</option>
                    <option value="crew">Crew</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="+250 7XX XXX XXX" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Temporary Password *</label>
                  <input required value={form.temp_password} onChange={e => setForm({...form, temp_password: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="Give this to the user" />
                  <p className="text-xs text-gray-400 mt-0.5">Share this with the user — they'll set their own password on first login.</p>
                </div>
              </div>

              {/* Basic roles: simple page toggles. Advanced roles: full permission checkboxes */}
              {BASIC_ROLES.includes(form.role) ? (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Extra page access <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <p className="text-[11px] text-gray-400 mb-2">
                    By default <strong className="capitalize">{form.role}</strong> can only see their own profile & dashboard. Grant access to extra pages below.
                  </p>
                  <div className="space-y-2">
                    {MEMBER_PAGE_ACCESS.map(({ label, perm, desc }) => (
                      <label key={perm} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={form.custom_permissions.includes(perm)}
                          onChange={() => togglePerm(perm, form.custom_permissions, (v) => setForm({...form, custom_permissions: v}))}
                          className="accent-slate-700 w-4 h-4"
                        />
                        <span>
                          <span className="text-sm font-medium text-slate-700">{label}</span>
                          <span className="text-xs text-gray-400 ml-2">{desc}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Extra Permissions <span className="text-gray-400 font-normal">(beyond role defaults)</span>
                  </label>
                  <p className="text-[10px] text-gray-400 mb-1">Greyed items are already included by the selected role.</p>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded p-2 space-y-2">
                    {PERMISSION_GROUPS.map(group => {
                      const roleDefaults = ROLE_DEFAULT_PERMISSIONS[form.role] || [];
                      return (
                        <div key={group.page}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{group.page}</span>
                            <span className="text-[10px] text-gray-300">{group.path}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-0.5 pl-1">
                            {group.perms.map(perm => {
                              const isDefault = roleDefaults.includes(perm);
                              return (
                                <label key={perm} className={`flex items-center gap-2 text-xs py-0.5 ${isDefault ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                  <input
                                    type="checkbox"
                                    checked={isDefault || form.custom_permissions.includes(perm)}
                                    disabled={isDefault}
                                    onChange={() => !isDefault && togglePerm(perm, form.custom_permissions, (v) => setForm({...form, custom_permissions: v}))}
                                    className="accent-slate-800"
                                  />
                                  <span className={isDefault ? 'text-gray-400' : 'text-gray-600'}>{perm.split(':')[1]}</span>
                                  {isDefault && <span className="text-[9px] text-blue-400 font-medium">role</span>}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded text-sm font-medium disabled:opacity-60 transition-colors">
                  {createMutation.isPending ? 'Creating…' : 'Create & Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Permissions Modal ── */}
      {showPermissions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><ShieldCheck size={18} /> Extra Permissions</h2>
              <button onClick={() => setShowPermissions(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Role: <span className="font-semibold text-slate-600 capitalize">{showPermissions?.role}</span>
            </p>

            {BASIC_ROLES.includes(showPermissions?.role) ? (
              <div className="mb-4 space-y-2">
                <p className="text-xs text-gray-500 mb-3">Choose which pages this member can access:</p>
                {MEMBER_PAGE_ACCESS.map(({ label, perm, desc }) => (
                  <label key={perm} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permEdit.includes(perm)}
                      onChange={() => togglePerm(perm, permEdit, setPermEdit)}
                      className="accent-slate-700 w-4 h-4"
                    />
                    <span>
                      <span className="text-sm font-medium text-slate-700">{label}</span>
                      <span className="text-xs text-gray-400 ml-2">{desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto border border-gray-200 rounded p-3 mb-4 space-y-3">
                {PERMISSION_GROUPS.map(group => {
                  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[showPermissions?.role] || [];
                  return (
                    <div key={group.page}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{group.page}</span>
                        <span className="text-[10px] text-gray-300">{group.path}</span>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>
                      <div className="grid grid-cols-2 gap-0.5 pl-1">
                        {group.perms.map(perm => {
                          const isDefault = roleDefaults.includes(perm);
                          return (
                            <label key={perm} className={`flex items-center gap-2 text-xs py-0.5 ${isDefault ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                              <input type="checkbox"
                                checked={isDefault || permEdit.includes(perm)}
                                disabled={isDefault}
                                onChange={() => !isDefault && togglePerm(perm, permEdit, setPermEdit)}
                                className="accent-slate-800" />
                              <span className={isDefault ? 'text-gray-400' : 'text-gray-600'}>{perm.split(':')[1]}</span>
                              {isDefault && <span className="text-[9px] text-blue-400 font-medium">role</span>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setShowPermissions(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded text-sm font-medium transition-colors">
                Cancel
              </button>
              <button onClick={() => permMutation.mutate({ id: showPermissions.id, perms: permEdit })}
                disabled={permMutation.isPending}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded text-sm font-medium disabled:opacity-60 transition-colors">
                {permMutation.isPending ? 'Saving…' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-slate-800">Edit User</h2>
              <button onClick={() => setShowEdit(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); editMutation.mutate({ id: showEdit.id, data: editForm }); }} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+250 7XX XXX XXX"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Member Type</label>
                <select value={editForm.member_type} onChange={e => setEditForm(f => ({ ...f, member_type: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
                  <option value="">— None —</option>
                  <option value="actor">Actor</option>
                  <option value="crew">Crew</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowEdit(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded text-sm font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={editMutation.isPending}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded text-sm font-medium disabled:opacity-60 transition-colors">
                  {editMutation.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Delete User</h2>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete <span className="font-semibold text-slate-700">{deleteConfirm.name}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded text-sm font-medium transition-colors">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded text-sm font-medium disabled:opacity-60 transition-colors">
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Search & Filters ── */}
      {(() => {
        const filtered = users.filter(u => {
          const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
          const matchRole   = !roleFilter   || u.role === roleFilter;
          const matchStatus = !statusFilter || String(u.is_active) === statusFilter;
          return matchSearch && matchRole && matchStatus;
        });
        return (
          <>
            <SearchFilters
              search={search}
              onSearch={setSearch}
              placeholder="Search users by name or email…"
              resultCount={isLoading ? undefined : filtered.length}
              filters={[
                { label: 'Role',   value: roleFilter,   onChange: setRoleFilter,   options: Object.values(ROLES) },
                { label: 'Status', value: statusFilter, onChange: setStatusFilter, options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] },
              ]}
            />
            {/* ── Users Table ── */}
            {isLoading ? (
              <TableSkeleton rows={4} />
            ) : (
              <DataTable
                columns={[
                  { key: 'name',    label: 'Name',        render: u => <span className="font-medium text-slate-800">{u.name}</span> },
                  { key: 'email',   label: 'Email',       render: u => <span className="text-gray-500 text-xs">{u.email}</span> },
                  { key: 'role',    label: 'Role',        render: u => (
                    <select value={u.role} onChange={e => roleMutation.mutate({ id: u.id, role: e.target.value })}
                      className="border border-gray-200 rounded px-2 py-1 text-xs">
                      {Object.values(ROLES).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  )},
                  { key: 'is_verified', label: 'Verified', render: u => u.is_verified
                    ? <span className="text-xs text-green-600 font-medium">✓ Verified</span>
                    : <span className="text-xs text-orange-500">Pending</span>
                  },
                  { key: 'is_active', label: 'Status', render: u => (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  )},
                  { key: 'permissions', label: 'Permissions', render: u => (
                    <button onClick={() => openPermissions(u)}
                      className="flex items-center gap-1 text-xs bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1 rounded transition-colors">
                      <ShieldCheck size={12} />
                      {u.custom_permissions?.length > 0 ? `${u.custom_permissions.length} extra` : 'Set'}
                    </button>
                  )},
                  { key: 'toggle', label: 'Toggle', render: u => (
                    <button onClick={() => statusMutation.mutate({ id: u.id, is_active: !u.is_active })}
                      className={`text-xs px-2.5 py-1 rounded transition-colors text-white ${u.is_active ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600'}`}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  )},
                  { key: 'actions', label: 'Actions', render: u => (
                    <div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (openDropdown?.id === u.id) { setOpenDropdown(null); return; }
                          const rect = e.currentTarget.getBoundingClientRect();
                          setOpenDropdown({ id: u.id, top: rect.bottom + window.scrollY, left: rect.right - 144 + window.scrollX });
                        }}
                        className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-gray-100 rounded transition-colors"
                      >
                        <MoreVertical size={15} />
                      </button>
                    </div>
                  )},
                ]}
                data={filtered}
              />
            )}
          </>
        );
      })()}

      {/* ── Actions dropdown portal (fixed, escapes overflow) ── */}
      {openDropdown && (() => {
        const u = users.find(x => x.id === openDropdown.id);
        if (!u) return null;
        return (
          <div
            style={{ position: 'fixed', top: openDropdown.top, left: openDropdown.left, zIndex: 9999 }}
            className="w-36 bg-white border border-gray-200 rounded shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => { openEdit(u); setOpenDropdown(null); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-gray-50 transition-colors"
            >
              <Pencil size={12} /> Edit
            </button>
            <button
              onClick={() => { setDeleteConfirm(u); setOpenDropdown(null); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        );
      })()}
    </div>
  );
};

export default AdminPage;
