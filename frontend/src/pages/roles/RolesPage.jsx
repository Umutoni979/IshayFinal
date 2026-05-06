import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '../../api/rolesApi';
import { productionsApi } from '../../api/productionsApi';
import { usersApi } from '../../api/usersApi';
import usePermission from '../../hooks/usePermission';
import toast from 'react-hot-toast';
import { X, Plus, Trash2, Pencil, ChevronDown, ChevronRight } from 'lucide-react';
import SearchFilters from '../../components/common/SearchFilters';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

const statusColor = { open: 'bg-gray-100 text-gray-600', assigned: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700' };

const newRow = () => ({ id: Date.now(), title: '', assigned_to_id: '', description: '' });

// Searchable member picker
const MemberPicker = ({ value, onChange, members }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const ref               = useRef(null);
  const selected          = members.find(m => m.id === value);
  const filtered          = members.filter(m =>
    !query || m.name.toLowerCase().includes(query.toLowerCase()) ||
    m.email?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-slate-300 flex items-center justify-between bg-white">
        <span className={selected ? 'text-slate-800' : 'text-gray-400'}>
          {selected ? selected.name : 'Select member…'}
        </span>
        <span className="text-gray-300 text-xs">▼</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input autoFocus type="text" placeholder="Search name or email…"
              value={query} onChange={e => setQuery(e.target.value)}
              className="w-full text-sm px-2 py-1 focus:outline-none" />
          </div>
          <ul className="max-h-44 overflow-y-auto">
            <li>
              <button type="button" onClick={() => { onChange(''); setOpen(false); setQuery(''); }}
                className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-gray-50">
                — No assignment yet
              </button>
            </li>
            {filtered.length === 0 && <li className="px-3 py-2 text-xs text-gray-400">No members found</li>}
            {filtered.map(m => (
              <li key={m.id}>
                <button type="button"
                  onClick={() => { onChange(m.id); setOpen(false); setQuery(''); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${value === m.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700'}`}>
                  {m.name}
                  <span className="text-xs text-gray-400 ml-2 capitalize">{m.role}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const RolesPage = () => {
  const canWrite    = usePermission('roles:write');
  const queryClient = useQueryClient();
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [typeFilter, setType]       = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [productionId, setProductionId] = useState('');
  const [rows, setRows]             = useState([newRow()]);

  // Edit modal state
  const [editRole, setEditRole]     = useState(null); // { id, title, assigned_to_id, extraRows: [] }
  const [expanded, setExpanded]     = useState({});
  const toggleExpand = (key) => setExpanded(e => ({ ...e, [key]: !e[key] }));

  const { data, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll().then(r => r.data.data.roles),
  });

  const { data: productions = [] } = useQuery({
    queryKey: ['productions'],
    queryFn: () => productionsApi.getAll().then(r => r.data.data.productions),
    enabled: showCreate,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll().then(r =>
      r.data.data.users.filter(u => ['actor','crew','guest'].includes(u.role))
    ),
    enabled: showCreate || !!editRole,
  });

  const invalidate = () => {
    queryClient.invalidateQueries(['roles']);
    queryClient.invalidateQueries(['my-roles']);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      for (const row of rows) {
        if (!row.title.trim()) continue;
        const res = await rolesApi.create({ title: row.title, description: row.description, production_id: productionId });
        const roleId = res.data.data.role.id;
        if (row.assigned_to_id) await rolesApi.assign(roleId, row.assigned_to_id);
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success('Roles created!');
      setShowCreate(false);
      setProductionId('');
      setRows([newRow()]);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create roles'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, title, description, assigned_to_id, productionId, extraRows }) => {
      await rolesApi.update(id, { title, description });
      if (assigned_to_id) await rolesApi.assign(id, assigned_to_id, false);
      for (const row of (extraRows ?? [])) {
        if (!row.title.trim()) continue;
        const res = await rolesApi.create({ title: row.title, production_id: productionId });
        if (row.assigned_to_id) await rolesApi.assign(res.data.data.role.id, row.assigned_to_id);
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success('Saved!');
      setEditRole(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const unassignMutation = useMutation({
    mutationFn: (id) => rolesApi.update(id, { assigned_to_id: null, suggested_by_id: null, approved_by_id: null, status: 'open' }),
    onSuccess: () => { invalidate(); toast.success('Role unassigned'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to unassign'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rolesApi.delete(id),
    onSuccess: () => { invalidate(); toast.success('Role deleted'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete role'),
  });

  const updateRow = (id, field, val) =>
    setRows(rs => rs.map(r => r.id === id ? { ...r, [field]: val } : r));

  const removeRow = (id) => setRows(rs => rs.filter(r => r.id !== id));

  const filtered = (data ?? []).filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.Production?.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    const matchType   = !typeFilter   || r.requires_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  // Group filtered roles by member (unassigned kept separate)
  const grouped = filtered.reduce((acc, r) => {
    const key = r.assigned_to?.id ?? '__unassigned__';
    if (!acc[key]) acc[key] = { member: r.assigned_to ?? null, roles: [] };
    acc[key].roles.push(r);
    return acc;
  }, {});

  if (isLoading) return <TableSkeleton cols={5} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-normal text-slate-800">Role Assignments</h1>
        {canWrite && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">
            <Plus size={15} /> Add Roles
          </button>
        )}
      </div>
      <p className="text-sm text-gray-400 mb-6">Manage and approve production role assignments</p>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-slate-800">Assign Roles</h2>
              <button onClick={() => { setShowCreate(false); setProductionId(''); setRows([newRow()]); }}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-600 mb-1">Production *</label>
              <select required value={productionId} onChange={e => setProductionId(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
                <option value="">Select production…</option>
                {productions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-gray-500 px-1">
                <span>Role / Task</span>
                <span>Assign to</span>
                <span></span>
              </div>
              {rows.map(row => (
                <div key={row.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <input
                    type="text"
                    placeholder="e.g. Romeo, Lead Dancer…"
                    value={row.title}
                    onChange={e => updateRow(row.id, 'title', e.target.value)}
                    className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                  <MemberPicker
                    value={row.assigned_to_id}
                    onChange={val => updateRow(row.id, 'assigned_to_id', val)}
                    members={members}
                  />
                  <button type="button" onClick={() => removeRow(row.id)}
                    className="p-2 text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <button type="button" onClick={() => setRows(rs => [...rs, newRow()])}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-6 transition-colors">
              <Plus size={14} /> Add another role
            </button>

            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowCreate(false); setProductionId(''); setRows([newRow()]); }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded text-sm font-medium transition-colors">
                Cancel
              </button>
              <button
                onClick={() => { if (!productionId) { toast.error('Select a production first'); return; } createMutation.mutate(); }}
                disabled={createMutation.isPending || rows.every(r => !r.title.trim())}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded text-sm font-medium disabled:opacity-60 transition-colors">
                {createMutation.isPending ? 'Saving…' : 'Save All Roles'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-slate-800">Edit Role</h2>
              <button onClick={() => setEditRole(null)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role Title</label>
                <input
                  type="text"
                  value={editRole.title}
                  onChange={e => setEditRole(er => ({ ...er, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editRole.description ?? ''}
                  onChange={e => setEditRole(er => ({ ...er, description: e.target.value }))}
                  placeholder="Role description or notes…"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Assigned To</label>
                <MemberPicker
                  value={editRole.assigned_to_id}
                  onChange={val => setEditRole(er => ({ ...er, assigned_to_id: val }))}
                  members={members}
                />
              </div>

              {/* Extra roles */}
              {editRole.extraRows.length > 0 && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <p className="text-xs font-medium text-gray-500">Additional Roles</p>
                  {editRole.extraRows.map(row => (
                    <div key={row.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Role title…"
                        value={row.title}
                        onChange={e => setEditRole(er => ({ ...er, extraRows: er.extraRows.map(r => r.id === row.id ? { ...r, title: e.target.value } : r) }))}
                        className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                      />
                      <MemberPicker
                        value={row.assigned_to_id}
                        onChange={val => setEditRole(er => ({ ...er, extraRows: er.extraRows.map(r => r.id === row.id ? { ...r, assigned_to_id: val } : r) }))}
                        members={members}
                      />
                      <button type="button"
                        onClick={() => setEditRole(er => ({ ...er, extraRows: er.extraRows.filter(r => r.id !== row.id) }))}
                        className="p-2 text-gray-300 hover:text-red-400 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button type="button"
                onClick={() => setEditRole(er => ({ ...er, extraRows: [...er.extraRows, newRow()] }))}
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                <Plus size={14} /> Add another role
              </button>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setEditRole(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded text-sm font-medium transition-colors">
                Cancel
              </button>
              <button
                onClick={() => updateMutation.mutate(editRole)}
                disabled={updateMutation.isPending || !editRole.title.trim()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded text-sm font-medium disabled:opacity-60 transition-colors">
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <SearchFilters search={search} onSearch={setSearch}
        placeholder="Search by role title or production…"
        resultCount={filtered.length}
        filters={[
          { label: 'Status', value: statusFilter, onChange: setStatus, options: ['open','assigned','approved'] },
          { label: 'Type',   value: typeFilter,   onChange: setType,   options: ['actor','crew'] },
        ]}
      />
      {/* Grouped roles table */}
      <div className="border border-gray-200 rounded-sm overflow-hidden">
        {Object.keys(grouped).length === 0 && (
          <EmptyState type="roles" message="No roles found." />
        )}
        {Object.entries(grouped).map(([key, { member, roles }]) => {
          const isOpen = !!expanded[key];
          return (
            <div key={key} className="border-b border-gray-100 last:border-b-0">
              {/* Member header row */}
              <button
                type="button"
                onClick={() => toggleExpand(key)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                  <span className="font-semibold text-slate-800 text-sm">
                    {member ? member.name : <span className="text-gray-400 font-normal">Unassigned</span>}
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {roles.length} {roles.length === 1 ? 'role' : 'roles'}
                  </span>
                </div>
                <span className="text-xs text-gray-400 capitalize">{member?.role ?? ''}</span>
              </button>

              {/* Expanded role rows */}
              {isOpen && (
                <div className="bg-gray-50 border-t border-gray-100">
                  {roles.map(r => (
                    <div key={r.id} className="flex items-center justify-between px-8 py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-slate-700 text-sm">{r.title}</span>
                        <span className="text-xs text-gray-400">{r.Production?.title ?? '—'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[r.status]}`}>{r.status}</span>
                      </div>
                      {canWrite && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditRole({ id: r.id, title: r.title, description: r.description ?? '', assigned_to_id: r.assigned_to?.id ?? '', productionId: r.production_id ?? '', extraRows: [] })}
                            className="p-1.5 text-gray-400 hover:text-slate-600 transition-colors">
                            <Pencil size={13} />
                          </button>
                          {r.assigned_to && (
                            <button
                              onClick={() => { if (window.confirm(`Unassign ${r.assigned_to.name} from "${r.title}"?`)) unassignMutation.mutate(r.id); }}
                              className="px-2 py-1 text-xs text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded transition-colors font-medium">
                              Unassign
                            </button>
                          )}
                          <button
                            onClick={() => { if (window.confirm(`Delete role "${r.title}"?`)) deleteMutation.mutate(r.id); }}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RolesPage;
