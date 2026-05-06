import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { productionsApi } from '../../api/productionsApi';
import { rehearsalsApi } from '../../api/rehearsalsApi';
import { conflictsApi } from '../../api/conflictsApi';
import { usersApi } from '../../api/usersApi';
import { canDo } from '../../utils/permissions';
import { formatDate, formatTime } from '../../utils/formatDate';
import { Film, CalendarDays, Users, AlertTriangle } from 'lucide-react'; // kept for future use
import EmptyState from '../../components/common/EmptyState';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const BASIC_ROLES = ['actor', 'crew', 'guest'];
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
const TABS = ['Overview', 'Rehearsals', 'Productions'];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Stat card decorations ──────────────────────────────────────
const StatDecoWave = ({ color }) => (
  <svg viewBox="0 0 160 200" className="absolute right-0 top-0 h-full w-2/5" preserveAspectRatio="xMaxYMid slice" aria-hidden>
    <path d="M160 10 C110 40 80 70 105 110 C130 150 65 170 85 200" stroke={color} strokeWidth="18" fill="none" strokeLinecap="round" opacity="0.15"/>
    <path d="M160 35 C118 60 88 88 112 126 C136 164 72 180 94 200" stroke={color} strokeWidth="13" fill="none" strokeLinecap="round" opacity="0.18"/>
    <path d="M160 60 C126 80 96 105 118 140 C140 175 80 188 104 200" stroke={color} strokeWidth="9"  fill="none" strokeLinecap="round" opacity="0.22"/>
  </svg>
);
const StatDecoDots = ({ color }) => (
  <svg viewBox="0 0 160 200" className="absolute right-0 top-0 h-full w-2/5" preserveAspectRatio="xMaxYMid slice" aria-hidden>
    {[...Array(35)].map((_, i) => {
      const t = i / 34;
      const cx = 70 + Math.sin(t * Math.PI * 2.2) * 55;
      const cy = t * 200;
      const r  = 2 + Math.sin(t * Math.PI) * 2.5;
      return <circle key={i} cx={cx} cy={cy} r={r} fill={color} opacity={0.12 + t * 0.25} />;
    })}
  </svg>
);
const StatDecoChevrons = ({ color }) => (
  <svg viewBox="0 0 140 130" className="absolute bottom-0 right-0 w-32 h-24" aria-hidden>
    {[0,1,2,3].map(i => (
      <polyline key={i} points={`${20 - i*8},${120 - i*20} ${85},${55 - i*20} ${140},${120 - i*20}`}
        fill="none" stroke={color} strokeWidth="13" strokeLinecap="square" opacity={0.08 + i * 0.08}/>
    ))}
  </svg>
);

const statCards = [
  { key: 'productions', label: 'Productions',   sub: 'Total in system',   gradient: 'from-indigo-500 to-blue-600' },
  { key: 'rehearsals',  label: 'Rehearsals',    sub: 'Scheduled sessions', gradient: 'from-teal-400 to-cyan-500'  },
  { key: 'members',     label: 'Members',       sub: 'Registered members', gradient: 'from-orange-400 to-amber-500' },
  { key: 'conflicts',   label: 'Open Conflicts',sub: 'Awaiting resolution', gradient: 'from-red-500 to-rose-600'  },
];

// ── Cartoon avatar ─────────────────────────────────────────────
const CartoonAvatar = () => (
  <svg viewBox="0 0 64 64" width="46" height="46" xmlns="http://www.w3.org/2000/svg">
    <style>{`.av-body{animation:avatarFloat 3s ease-in-out infinite}@keyframes avatarFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}`}</style>
    <g className="av-body">
      <rect x="27" y="47" width="10" height="7" rx="3" fill="#FDDCB5"/>
      <ellipse cx="32" cy="30" rx="17" ry="18" fill="#FDDCB5"/>
      <ellipse cx="32" cy="13" rx="17" ry="8" fill="#4a2c0a"/>
      <ellipse cx="17" cy="22" rx="5" ry="9" fill="#4a2c0a"/>
      <ellipse cx="47" cy="22" rx="5" ry="9" fill="#4a2c0a"/>
      <ellipse cx="15" cy="30" rx="3.5" ry="4" fill="#F5C89A"/>
      <ellipse cx="49" cy="30" rx="3.5" ry="4" fill="#F5C89A"/>
      <ellipse cx="23" cy="29" rx="5" ry="5.5" fill="white"/>
      <ellipse cx="41" cy="29" rx="5" ry="5.5" fill="white"/>
      <circle cx="23" cy="30" r="3" fill="#2d1a0e"/>
      <circle cx="24" cy="29" r="1" fill="white"/>
      <circle cx="41" cy="30" r="3" fill="#2d1a0e"/>
      <circle cx="42" cy="29" r="1" fill="white"/>
      <path d="M19 23 Q23 20 27 23" stroke="#4a2c0a" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M37 23 Q41 20 45 23" stroke="#4a2c0a" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M24 40 Q32 47 40 40" stroke="#c0705a" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <ellipse cx="19" cy="37" rx="4" ry="2.5" fill="#f9a8a8" opacity="0.45"/>
      <ellipse cx="45" cy="37" rx="4" ry="2.5" fill="#f9a8a8" opacity="0.45"/>
    </g>
  </svg>
);

// ── Custom tooltip ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
      {label && <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────
const DashboardPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('Overview');
  const isStaff = canDo(user?.role, 'users:read');
  const isBasic = BASIC_ROLES.includes(user?.role);

  const { data: productions } = useQuery({ queryKey: ['productions'], queryFn: () => productionsApi.getAll().then(r => r.data.data.productions) });
  const { data: rehearsals }  = useQuery({ queryKey: ['rehearsals'],  queryFn: () => rehearsalsApi.getAll().then(r => r.data.data.rehearsals) });
  const { data: conflicts }   = useQuery({ queryKey: ['conflicts', 'open'], queryFn: () => conflictsApi.getAll({ status: 'open' }).then(r => r.data.data.conflicts), enabled: isStaff });
  const { data: members }     = useQuery({ queryKey: ['users'], queryFn: () => usersApi.getAll().then(r => r.data.data.users), enabled: isStaff });

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (rehearsals ?? []).filter(r => r.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);

  const statValues = {
    productions: productions?.length ?? '—',
    rehearsals:  rehearsals?.length  ?? '—',
    members:     members?.length     ?? '—',
    conflicts:   conflicts?.length   ?? '—',
  };
  const visibleStats = isStaff ? statCards : statCards.slice(0, 2);

  // ── Chart data ─────────────────────────────────────────────
  const activityByMonth = useMemo(() => {
    const rCounts = {};
    (rehearsals ?? []).forEach(r => {
      if (!r.date) return;
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`;
      rCounts[key] = (rCounts[key] || 0) + 1;
    });
    const pCounts = {};
    (productions ?? []).forEach(p => {
      if (!p.createdAt && !p.created_at) return;
      const d = new Date(p.createdAt || p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`;
      pCounts[key] = (pCounts[key] || 0) + 1;
    });
    const allKeys = Array.from(new Set([...Object.keys(rCounts), ...Object.keys(pCounts)])).sort();
    return allKeys.slice(-10).map(key => {
      const [, mon] = key.split('-');
      return { month: MONTH_NAMES[parseInt(mon)], rehearsals: rCounts[key] || 0, productions: pCounts[key] || 0 };
    });
  }, [rehearsals, productions]);

  const rehearsalsByMonth = useMemo(() => {
    return activityByMonth.map(d => ({ month: d.month, count: d.rehearsals }));
  }, [activityByMonth]);

  const rehearsalTypes = useMemo(() => {
    const counts = {};
    (rehearsals ?? []).forEach(r => {
      const t = r.rehearsal_type || 'General';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [rehearsals]);

  const productionsByStatus = useMemo(() => {
    const counts = { planning: 0, active: 0, completed: 0, cancelled: 0 };
    (productions ?? []).forEach(p => { if (counts[p.status] !== undefined) counts[p.status]++; });
    return [
      { name: 'Planning',  value: counts.planning,  color: '#f97316' },
      { name: 'Active',    value: counts.active,    color: '#22c55e' },
      { name: 'Completed', value: counts.completed, color: '#3b82f6' },
      { name: 'Cancelled', value: counts.cancelled, color: '#f87171' },
    ].filter(d => d.value > 0);
  }, [productions]);

  const membersByRole = useMemo(() => {
    const counts = {};
    (members ?? []).forEach(m => {
      const r = m.role || 'Unknown';
      counts[r] = (counts[r] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [members]);

  const PIE_COLORS = ['#f97316','#3b82f6','#22c55e','#a855f7','#f87171','#eab308'];

  const RTYPE_COLORS = ['#6366f1','#f97316','#22c55e','#f59e0b','#ec4899','#14b8a6'];

  return (
    <div className="max-w-5xl">

      {/* ── Page header ── */}
      <div className="flex items-start gap-5 mb-6">
        <div className="w-16 h-16 rounded-xl bg-orange-500 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
          {user?.profile_image
            ? <img src={`${API_BASE}${user.profile_image}`} alt="avatar" className="w-full h-full object-cover" />
            : <CartoonAvatar />
          }
        </div>
        <div>
          <h1 className="text-[28px] font-normal text-slate-800 leading-tight">ISHYA Culture Troup</h1>
          <p className="text-sm text-gray-500 mt-0.5">by <span className="text-orange-500 font-semibold">{user?.name}</span></p>
          <p className="text-xs text-gray-400 mt-0.5">{user?.role} · Management System</p>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className={`grid gap-4 mb-6 ${visibleStats.length === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
        {visibleStats.map(({ key, label, sub, gradient }) => (
          <div key={key} className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl p-5 min-h-[140px] flex flex-col justify-between`}>
            {/* decorative circles */}
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white opacity-10" />
            <div className="absolute -bottom-6 -right-2 w-32 h-32 rounded-full bg-white opacity-10" />

            <p className="relative z-10 text-[10px] font-bold text-white/70 uppercase tracking-widest">{label}</p>
            <div className="relative z-10">
              <p className="text-5xl font-black text-white leading-none">{statValues[key]}</p>
              <p className="text-xs text-white/70 mt-2">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-500 hover:text-slate-700'
            }`}
          >{t}</button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'Overview' && (
        <div className="space-y-6">

          {/* Activity area chart — rehearsals + productions */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-1">Activity Overview</h2>
            <p className="text-xs text-gray-400 mb-5">Rehearsals &amp; productions per month</p>
            {activityByMonth.length === 0 ? (
              <EmptyState type="rehearsals" message="No activity data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={activityByMonth} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradReh2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.18}/>
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gradProd2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#ef4444" stopOpacity={0.18}/>
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    layout="horizontal"
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={9}
                    wrapperStyle={{ paddingBottom: 16 }}
                    formatter={v => <span style={{ fontSize: 12, color: '#64748b' }}>{v}</span>}
                  />
                  <Area type="monotone" dataKey="rehearsals"  name="Rehearsals"  stroke="#6366f1" strokeWidth={2.5} fill="url(#gradReh2)"  dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}  activeDot={{ r: 6 }} />
                  <Area type="monotone" dataKey="productions" name="Productions" stroke="#ef4444" strokeWidth={2.5} fill="url(#gradProd2)" dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Two-column: productions donut + members donut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Productions by status donut */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-slate-800 mb-1">Productions by Status</h2>
              <p className="text-xs text-gray-400 mb-4">Distribution across all productions</p>
              {productionsByStatus.length === 0 ? (
                <EmptyState type="productions" message="No productions yet." />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={productionsByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {productionsByStatus.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Members by role donut */}
            {isStaff && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <h2 className="text-sm font-bold text-slate-800 mb-1">Members by Role</h2>
                <p className="text-xs text-gray-400 mb-4">Breakdown of member roles</p>
                {membersByRole.length === 0 ? (
                  <EmptyState type="members" message="No members yet." />
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={membersByRole} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                        {membersByRole.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </div>

          {/* Upcoming rehearsals list */}
          {upcoming.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-slate-800 mb-4">Upcoming Rehearsals</h2>
              <div className="divide-y divide-gray-50">
                {upcoming.map(r => (
                  <div key={r.id} className="flex justify-between items-center py-3">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{r.title}</p>
                      <p className="text-xs text-gray-400">{r.location || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-medium">{formatDate(r.date)}</p>
                      {r.start_time && <p className="text-xs text-gray-400">{formatTime(r.start_time)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Rehearsals tab ── */}
      {tab === 'Rehearsals' && (
        <div className="space-y-6">

          {/* Bar chart: rehearsals per month */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-1">Rehearsals Per Month</h2>
            <p className="text-xs text-gray-400 mb-5">Monthly rehearsal frequency</p>
            {rehearsalsByMonth.length === 0 ? (
              <EmptyState type="rehearsals" message="No data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={rehearsalsByMonth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" name="Rehearsals" fill="#f97316" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Rehearsal types donut */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-1">Rehearsal Types</h2>
            <p className="text-xs text-gray-400 mb-4">Breakdown by rehearsal type</p>
            {rehearsalTypes.length === 0 ? (
              <EmptyState type="rehearsals" message="No data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={rehearsalTypes} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {rehearsalTypes.map((_, i) => (
                      <Cell key={i} fill={RTYPE_COLORS[i % RTYPE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ── Productions tab ── */}
      {tab === 'Productions' && (
        <div className="space-y-6">

          {/* Productions by status donut — large */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-1">Productions by Status</h2>
            <p className="text-xs text-gray-400 mb-4">Current status distribution</p>
            {productionsByStatus.length === 0 ? (
              <EmptyState type="productions" message="No productions yet." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={productionsByStatus} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}>
                    {productionsByStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bar chart: productions by status */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-1">Productions Overview</h2>
            <p className="text-xs text-gray-400 mb-5">Count per status category</p>
            {productionsByStatus.length === 0 ? (
              <EmptyState type="productions" message="No data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={productionsByStatus} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" name="Productions" radius={[6,6,0,0]}>
                    {productionsByStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
