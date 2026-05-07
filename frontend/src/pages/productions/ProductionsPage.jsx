import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { productionsApi } from '../../api/productionsApi';
import { formatDate } from '../../utils/formatDate';
import usePermission from '../../hooks/usePermission';
import toast from 'react-hot-toast';
import { ArrowLeft, LayoutGrid, List, Search, ChevronRight } from 'lucide-react';
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
    <path d="M6 16C6 13.8 7.8 12 10 12H22L26 17H46C48.2 17 50 18.8 50 21V42C50 44.2 48.2 46 46 46H10C7.8 46 6 44.2 6 42V16Z" fill={color} opacity="0.85" />
    <path d="M6 22C6 19.8 7.8 18 10 18H46C48.2 18 50 19.8 50 22V42C50 44.2 48.2 46 46 46H10C7.8 46 6 44.2 6 42V22Z" fill={color} />
  </svg>
);

const EMPTY_FORM = { title: '', description: '', venue: '', start_date: '', end_date: '', status: 'planning' };
const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300';

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
  const filtered = (data || []).filter(p => p.title?.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <CardsSkeleton />;

  return (
    <div>
      {showCreate ? (
        /* ── Inline Create Form ── */
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-slate-700 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-xl font-bold text-slate-800">New Production</h2>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}>
            <div className="border-t border-gray-100">
              <div className="flex items-start py-4 border-b border-gray-100">
                <span className="w-44 shrink-0 text-sm font-bold text-slate-700 pt-2">Title <span className="text-red-400">*</span></span>
                <input required value={form.title} onChange={set('title')} placeholder="e.g. Romeo and Juliet 2025" className={inputCls} />
              </div>
              <div className="flex items-start py-4 border-b border-gray-100">
                <span className="w-44 shrink-0 text-sm font-bold text-slate-700 pt-2">Description</span>
                <textarea value={form.description} onChange={set('description')} rows={3}
                  placeholder="Short description of the production…"
                  className={`${inputCls} resize-none`} />
              </div>
              <div className="flex items-start py-4 border-b border-gray-100">
                <span className="w-44 shrink-0 text-sm font-bold text-slate-700 pt-2">Venue</span>
                <input value={form.venue} onChange={set('venue')} placeholder="e.g. Main Hall, Auditorium…" className={inputCls} />
              </div>
              <div className="flex items-start py-4 border-b border-gray-100">
                <span className="w-44 shrink-0 text-sm font-bold text-slate-700 pt-2">Start Date</span>
                <input type="date" value={form.start_date} onChange={set('start_date')} className={inputCls} />
              </div>
              <div className="flex items-start py-4">
                <span className="w-44 shrink-0 text-sm font-bold text-slate-700 pt-2">End Date</span>
                <input type="date" value={form.end_date} onChange={set('end_date')} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={createMutation.isPending}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors">
                {createMutation.isPending ? 'Creating…' : 'Create Production'}
              </button>
            </div>
          </form>
        </div>

      ) : (
        /* ── Normal Page View ── */
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-normal text-slate-800">Productions</h1>
              <p className="text-sm text-gray-400 mt-0.5">Manage all troup productions</p>
            </div>
            {canWrite && (
              <button onClick={() => setShowCreate(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">
                + Production
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mb-5 gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search productions…"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
            </div>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => setView('grid')}
                className={`p-2 transition-colors ${view === 'grid' ? 'bg-orange-500 text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}>
                <LayoutGrid size={16} />
              </button>
              <button onClick={() => setView('list')}
                className={`p-2 transition-colors ${view === 'list' ? 'bg-orange-500 text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}>
                <List size={16} />
              </button>
            </div>
          </div>

          {filtered.length === 0 && (
            <EmptyState type="productions" message="No productions found" sub={canWrite && !search ? 'Click + Production to create the first one.' : undefined} />
          )}

          {filtered.length > 0 && view === 'grid' && (
            <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filtered.map(p => {
                const cfg = statusConfig[p.status] ?? statusConfig.planning;
                return (
                  <Link key={p.id} to={`/productions/${p.id}`}
                    className="flex flex-col items-center p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group">
                    <FolderIcon color={cfg.color} size={56} />
                    <p className="mt-3 text-sm font-semibold text-slate-800 text-center leading-tight line-clamp-2 group-hover:text-orange-500 transition-colors">{p.title}</p>
                    <p className="mt-1 text-xs text-gray-400">{cfg.label}</p>
                    {p.start_date && <p className="text-[11px] text-gray-300 mt-0.5">{formatDate(p.start_date)}</p>}
                  </Link>
                );
              })}
            </div>
          )}

          {filtered.length > 0 && view === 'list' && (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
              {filtered.map(p => {
                const cfg = statusConfig[p.status] ?? statusConfig.planning;
                return (
                  <Link key={p.id} to={`/productions/${p.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                    <FolderIcon color={cfg.color} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-orange-500 transition-colors truncate">{p.title}</p>
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
        </>
      )}
    </div>
  );
};

export default ProductionsPage;
