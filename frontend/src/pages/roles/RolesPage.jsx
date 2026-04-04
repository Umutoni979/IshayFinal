import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '../../api/rolesApi';
import usePermission from '../../hooks/usePermission';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';
import SearchFilters from '../../components/common/SearchFilters';
import DataTable from '../../components/common/DataTable';

const statusColor = { open: 'bg-gray-100 text-gray-600', assigned: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700' };

const RolesPage = () => {
  const canApprove = usePermission('roles:approve');
  const queryClient = useQueryClient();
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');
  const [typeFilter, setType]     = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll().then(r => r.data.data.roles),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => rolesApi.approve(id),
    onSuccess: () => { queryClient.invalidateQueries(['roles']); toast.success('Role approved!'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  const filtered = (data ?? []).filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.Production?.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    const matchType   = !typeFilter   || r.requires_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const columns = [
    { key: 'title',       label: 'Role',        render: r => <span className="font-medium text-slate-800">{r.title}</span> },
    { key: 'production',  label: 'Production',  render: r => <span className="text-gray-500">{r.Production?.title ?? '—'}</span> },
    { key: 'assigned_to', label: 'Assigned To', render: r => r.assigned_to?.name ?? <span className="text-gray-300">Unassigned</span> },
    { key: 'requires_type', label: 'Type',      render: r => <span className="text-gray-500">{r.requires_type ?? '—'}</span> },
    { key: 'status', label: 'Status', render: r => <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[r.status]}`}>{r.status}</span> },
    ...(canApprove ? [{
      key: 'action', label: 'Action',
      render: r => r.status === 'assigned' ? (
        <button
          onClick={() => approveMutation.mutate(r.id)}
          className="flex items-center gap-1 bg-slate-500 hover:bg-slate-600 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
        >
          <CheckCircle size={13} /> Approve
        </button>
      ) : null,
    }] : []),
  ];

  if (isLoading) return <div className="text-gray-400 text-sm">Loading…</div>;

  return (
    <div>
      <h1 className="text-2xl font-black text-slate-800 mb-1">Role Assignments</h1>
      <p className="text-sm text-gray-400 mb-6">Manage and approve production role assignments</p>

      <SearchFilters
        search={search}
        onSearch={setSearch}
        placeholder="Search by role title or production…"
        resultCount={filtered.length}
        filters={[
          { label: 'Status', value: statusFilter, onChange: setStatus, options: ['open','assigned','approved'] },
          { label: 'Type',   value: typeFilter,   onChange: setType,   options: ['actor','crew'] },
        ]}
      />

      <DataTable columns={columns} data={filtered} />
    </div>
  );
};

export default RolesPage;
