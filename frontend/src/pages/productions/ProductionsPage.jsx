import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { productionsApi } from '../../api/productionsApi';
import { formatDate } from '../../utils/formatDate';
import usePermission from '../../hooks/usePermission';
import toast from 'react-hot-toast';
import { X, LayoutGrid, List, Search, ChevronRight } from 'lucide-react';
import { CardsSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

const statusConfig = {
  planning:  { label: 'Planning',  color: '#f97316' },
  active:    { label: 'Active',    color: '#22c55e' },
  completed: { label: 'Completed', color: '#3b82f6' },
  cancelled: { label: 'Cancelled', color: '#f87171' },
};

const FolderIcon = ({ color = '#f59e0b', size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6 16C6 13.8 7.8 12 10 12H22L26 17H46C48.2 17 50 18.8 50 21V42C50 44.2 48.2 46 46 46H10C7.8 46 6 44.2 6 42V16Z"
      fill={color}
      opacity="0.85"
    />
    <path
      d="M6 22C6 19.8 7.8 18 10 18H46C48.2 18 50 19.8 50 22V42C50 44.2 48.2 46 46 46H10C7.8 46 6 44.2 6 42V22Z"
      fill={color}
    />
  </svg>
);

const EMPTY_FORM = { title: '', description: '', venue: '', start_date: '', end_date: '', status: 'planning' };

const ProductionsPage = () => {
  const canWrite = usePermission('productions:write');
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['productions'],
    queryFn: () => productionsApi.getAll().then(r => r.data.data.productions),
  });

  const createMutation = useMutation({
    mutationFn: (data) => productionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['productions']);
      toast.success('Production created!');
      setShowCreate(false);
      setForm(EMPTY_FORM);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create production'),
  });

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const filtered = (data || []).filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <CardsSkeleton />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-normal text-slate-800">Productions</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage all troup productions</p>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
          >
            + Production
          </button>
        )}
      </div>

      {/* Toolbar: search + view toggle */}
      <div className="flex items-center justify-between mb-5 gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search productions…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
          />
        </div>
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setView('grid')}
            className={`p-2 transition-colors ${view === 'grid' ? 'bg-orange-500 text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
            title="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 transition-colors ${view === 'list' ? 'bg-orange-500 text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
            title="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-slate-800">New Production</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                <input required value={form.title} onChange={set('title')} placeholder="e.g. Romeo and Juliet 2025"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Short description of the production…"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Venue</label>
                <input value={form.venue} onChange={set('venue')} placeholder="e.g. Main Hall, Auditorium…"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                  <input type="date" value={form.start_date} onChange={set('start_date')}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                  <input type="date" value={form.end_date} onChange={set('end_date')}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select value={form.status} onChange={set('status')}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded text-sm font-medium disabled:opacity-60 transition-colors">
                  {createMutation.isPending ? 'Creating…' : 'Create Production'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <EmptyState type="productions" message="No productions found" sub={canWrite && !search ? 'Click + Production to create the first one.' : undefined} />
      )}

      {/* Grid view */}
      {filtered.length > 0 && view === 'grid' && (
        <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map(p => {
            const cfg = statusConfig[p.status] ?? statusConfig.planning;
            return (
              <Link
                key={p.id}
                to={`/productions/${p.id}`}
                className="flex flex-col items-center p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group"
              >
                <FolderIcon color={cfg.color} size={56} />
                <p className="mt-3 text-sm font-semibold text-slate-800 text-center leading-tight line-clamp-2 group-hover:text-orange-500 transition-colors">
                  {p.title}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {cfg.label}
                </p>
                {p.start_date && (
                  <p className="text-[11px] text-gray-300 mt-0.5">{formatDate(p.start_date)}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* List view */}
      {filtered.length > 0 && view === 'list' && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
          {filtered.map(p => {
            const cfg = statusConfig[p.status] ?? statusConfig.planning;
            return (
              <Link
                key={p.id}
                to={`/productions/${p.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
              >
                <FolderIcon color={cfg.color} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-orange-500 transition-colors truncate">
                    {p.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {cfg.label}{p.start_date ? ` · ${formatDate(p.start_date)}` : ''}
                    {p.director?.name ? ` · ${p.director.name}` : ''}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductionsPage;
