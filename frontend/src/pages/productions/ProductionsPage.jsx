import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { productionsApi } from '../../api/productionsApi';
import { formatDate } from '../../utils/formatDate';
import usePermission from '../../hooks/usePermission';
import toast from 'react-hot-toast';
import { Clapperboard, X } from 'lucide-react';
import { CardsSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

const statusConfig = {
  planning:  { label: 'Planning',  badge: 'text-orange-600', icon: 'bg-orange-500', accent: '#f97316' },
  active:    { label: 'Active',    badge: 'text-green-600',  icon: 'bg-green-500',  accent: '#22c55e' },
  completed: { label: 'Completed', badge: 'text-blue-600',   icon: 'bg-blue-500',   accent: '#3b82f6' },
  cancelled: { label: 'Cancelled', badge: 'text-red-500',    icon: 'bg-red-400',    accent: '#f87171' },
};

// Wavy topographic lines — like card 1 in reference
const DecoWave = ({ color }) => (
  <svg viewBox="0 0 160 200" className="absolute right-0 top-0 h-full w-1/2" preserveAspectRatio="xMaxYMid slice" aria-hidden>
    <path d="M160 20 C120 40 80 60 100 100 C120 140 60 160 80 200" stroke={color} strokeWidth="16" fill="none" strokeLinecap="round" opacity="0.18"/>
    <path d="M160 40 C125 58 85 75 108 115 C130 155 68 172 90 200" stroke={color} strokeWidth="12" fill="none" strokeLinecap="round" opacity="0.22"/>
    <path d="M160 60 C130 76 92 90 115 128 C138 166 76 180 100 200" stroke={color} strokeWidth="9"  fill="none" strokeLinecap="round" opacity="0.26"/>
    <path d="M160 80 C135 95 100 106 122 142 C144 178 84 188 110 200" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.3"/>
    <path d="M160 100 C140 112 108 122 130 156 C150 188 92 196 118 200" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.35"/>
  </svg>
);

// Dot/particle wave — like card 2 in reference
const DecoDots = ({ color }) => (
  <svg viewBox="0 0 160 200" className="absolute right-0 top-0 h-full w-1/2" preserveAspectRatio="xMaxYMid slice" aria-hidden>
    {[...Array(40)].map((_, i) => {
      const t   = i / 39;
      const cx  = 80 + Math.sin(t * Math.PI * 2.5) * 50;
      const cy  = t * 200;
      const r   = 2.5 + Math.sin(t * Math.PI) * 2;
      return <circle key={i} cx={cx} cy={cy} r={r} fill={color} opacity={0.15 + t * 0.3} />;
    })}
  </svg>
);

// Stacked chevrons — like card 3 in reference
const DecoChevrons = ({ color }) => (
  <svg viewBox="0 0 140 120" className="absolute bottom-0 right-0 w-36 h-28" aria-hidden>
    {[0,1,2,3,4].map(i => (
      <polyline key={i}
        points={`${30 - i*10},${110 - i*18} ${90},${50 - i*18} ${140},${110 - i*18}`}
        fill="none" stroke={color} strokeWidth="12" strokeLinecap="square"
        opacity={0.10 + i * 0.07}
      />
    ))}
  </svg>
);

const decoMap = {
  planning:  (c) => <DecoWave color={c} />,
  active:    (c) => <DecoDots color={c} />,
  completed: (c) => <DecoChevrons color={c} />,
  cancelled: (c) => <DecoWave color={c} />,
};

const EMPTY_FORM = { title: '', description: '', venue: '', start_date: '', end_date: '', status: 'planning' };

const ProductionsPage = () => {
  const canWrite = usePermission('productions:write');
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

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

  if (isLoading) return <CardsSkeleton />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            Productions
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage all troup productions</p>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-slate-500 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            + Production
          </button>
        )}
      </div>

      {/* ── Create Modal ── */}
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
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Short description of the production…"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Venue</label>
                <input value={form.venue} onChange={set('venue')} placeholder="e.g. Main Hall, Auditorium…"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                  <input type="date" value={form.start_date} onChange={set('start_date')}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                  <input type="date" value={form.end_date} onChange={set('end_date')}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select value={form.status} onChange={set('status')}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
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
                  className="flex-1 bg-slate-500 hover:bg-slate-600 text-white py-2 rounded text-sm font-medium disabled:opacity-60 transition-colors">
                  {createMutation.isPending ? 'Creating…' : 'Create Production'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Productions grid ── */}
      {!data || data.length === 0 ? (
        <div>
          <EmptyState type="productions" message="No productions yet" sub={canWrite ? 'Click + Production to create the first one.' : undefined} />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {data.map(p => {
            const cfg  = statusConfig[p.status] ?? statusConfig.planning;
            const deco = decoMap[p.status] ?? decoMap.planning;
            return (
              <Link
                key={p.id}
                to={`/productions/${p.id}`}
                className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl flex flex-col justify-between min-h-[240px] hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                {/* Decorative graphic — fills right portion, behind content */}
                {deco(cfg.accent)}

                {/* Top row: icon + date */}
                <div className="relative z-10 flex items-start justify-between p-5 pb-0">
                  <div className={`w-11 h-11 rounded-xl ${cfg.icon} flex items-center justify-center shadow-sm`}>
                    <Clapperboard size={19} className="text-white" />
                  </div>
                  <span className="text-xs text-gray-400 font-medium pt-1">
                    {p.start_date ? formatDate(p.start_date) : 'TBD'}
                  </span>
                </div>

                {/* Bottom-left: status + title + director */}
                <div className="relative z-10 p-5 pt-6">
                  <p className={`text-xs font-semibold mb-1 ${cfg.badge}`}>{cfg.label}</p>
                  <h2 className="font-black text-slate-800 text-lg leading-tight mb-5 line-clamp-2">{p.title}</h2>
                  <p className="text-xs text-gray-400">{p.director?.name ?? '—'}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductionsPage;
