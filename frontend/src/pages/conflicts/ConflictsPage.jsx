import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conflictsApi } from '../../api/conflictsApi';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';
import SearchFilters from '../../components/common/SearchFilters';

const severityColor = { low: 'bg-blue-100 text-blue-700', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-red-100 text-red-700' };

const ConflictsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatus]     = useState('');
  const [severityFilter, setSeverity] = useState('');

  const { data: conflicts = [], isLoading } = useQuery({
    queryKey: ['conflicts'],
    queryFn: () => conflictsApi.getAll().then(r => r.data.data.conflicts),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolution }) => conflictsApi.resolve(id, resolution),
    onSuccess: () => { queryClient.invalidateQueries(['conflicts']); toast.success('Conflict resolved'); },
  });

  const ignoreMutation = useMutation({
    mutationFn: (id) => conflictsApi.ignore(id),
    onSuccess: () => { queryClient.invalidateQueries(['conflicts']); toast.success('Conflict ignored'); },
  });

  const filtered = conflicts.filter(c => {
    const matchSearch   = !search         || c.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus   = !statusFilter   || c.status === statusFilter;
    const matchSeverity = !severityFilter || c.severity === severityFilter;
    return matchSearch && matchStatus && matchSeverity;
  });

  return (
    <div>
      <h1 className="text-2xl font-black text-slate-800 mb-1">Conflict Detection</h1>
      <p className="text-sm text-gray-400 mb-6">Schedule and role conflicts detected across productions</p>

      <SearchFilters
        search={search}
        onSearch={setSearch}
        placeholder="Search conflicts…"
        filters={[
          { label: 'Status',   value: statusFilter,   onChange: setStatus,   options: ['open','resolved','ignored'] },
          { label: 'Severity', value: severityFilter, onChange: setSeverity, options: ['low','medium','high'] },
        ]}
      />

      {isLoading ? <div className="text-gray-400">Loading…</div> : (
        <div className="space-y-3">
          {filtered.length === 0 && <div className="text-gray-400 bg-white rounded-sm border border-gray-200 p-6 text-center">No conflicts found.</div>}
          {filtered.map(conflict => (
            <div key={conflict.id} className="bg-white rounded-sm border border-gray-200 p-5">
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityColor[conflict.severity]}`}>{conflict.severity}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{conflict.type}</span>
                </div>
                <span className={`text-xs font-medium ${conflict.status === 'open' ? 'text-red-500' : 'text-green-500'}`}>{conflict.status}</span>
              </div>
              <p className="text-gray-700 text-sm mb-3">{conflict.description}</p>
              <p className="text-xs text-gray-400 mb-3">Members: {conflict.members?.map(m => m.name).join(', ') || '—'}</p>
              {conflict.status === 'open' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => resolveMutation.mutate({ id: conflict.id, resolution: 'Manually resolved by coordinator' })}
                    className="flex items-center gap-1 text-xs bg-slate-500 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors"
                  >
                    <CheckCircle size={13} /> Resolve
                  </button>
                  <button
                    onClick={() => ignoreMutation.mutate(conflict.id)}
                    className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded transition-colors"
                  >
                    <XCircle size={13} /> Ignore
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConflictsPage;
