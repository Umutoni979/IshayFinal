import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../api/usersApi';
import { formatDate } from '../../utils/formatDate';
import SearchFilters from '../../components/common/SearchFilters';
import DataTable from '../../components/common/DataTable';
import { TableSkeleton } from '../../components/common/Skeleton';

const columns = [
  { key: 'name',        label: 'Name',   render: r => <span className="font-medium text-slate-800">{r.name}</span> },
  { key: 'email',       label: 'Email',  render: r => <span className="text-gray-600 text-xs">{r.email}</span> },
  { key: 'role',        label: 'Role',   render: r => <span className="text-gray-700">{r.role}</span> },
  { key: 'member_type', label: 'Type',   render: r => <span className="text-gray-600">{r.member_type ?? '—'}</span> },
  {
    key: 'is_active', label: 'Status',
    render: r => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {r.is_active ? 'Active' : 'Inactive'}
      </span>
    ),
  },
  { key: 'created_at', label: 'Joined', render: r => <span className="text-gray-600 text-xs">{formatDate(r.created_at)}</span> },
];

const MembersListPage = () => {
  const [search, setSearch]         = useState('');
  const [roleFilter, setRole]       = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [typeFilter, setType]       = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll().then(r => r.data.data.users),
  });

  const filtered = (data ?? []).filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = !roleFilter   || u.role === roleFilter;
    const matchStatus = !statusFilter || String(u.is_active) === statusFilter;
    const matchType   = !typeFilter   || u.member_type === typeFilter;
    return matchSearch && matchRole && matchStatus && matchType;
  });

  if (isLoading) return <TableSkeleton />;

  return (
    <div>
      <h1 className="text-2xl font-normal text-slate-800 mb-1">Members</h1>
      <p className="text-sm text-gray-600 mb-6">All registered members of ISHYA Culture Troup</p>

      <SearchFilters
        search={search}
        onSearch={setSearch}
        placeholder="Search members by name or email…"
        resultCount={filtered.length}
        filters={[
          { label: 'Role',   value: roleFilter,   onChange: setRole,   options: ['director','coordinator','actor','crew','guest'] },
          { label: 'Status', value: statusFilter, onChange: setStatus, options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] },
          { label: 'Type',   value: typeFilter,   onChange: setType,   options: ['actor','crew'] },
        ]}
      />

      <DataTable columns={columns} data={filtered} />
    </div>
  );
};

export default MembersListPage;
