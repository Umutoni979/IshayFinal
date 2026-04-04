import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { productionsApi } from '../../api/productionsApi';
import { rehearsalsApi } from '../../api/rehearsalsApi';
import { conflictsApi } from '../../api/conflictsApi';
import { usersApi } from '../../api/usersApi';
import { canDo } from '../../utils/permissions';
import { formatDate, formatTime } from '../../utils/formatDate';
import { Clapperboard, Film, CalendarDays, Users, AlertTriangle } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';

const BASIC_ROLES = ['actor', 'crew', 'guest'];

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';

const TABS = ['Overview', 'Rehearsals', 'Productions'];

// ── Stat card decorations ──────────────────────────────────────
const StatDecoWave = ({ color }) => (
  <svg viewBox="0 0 160 200" className="absolute right-0 top-0 h-full w-2/5" preserveAspectRatio="xMaxYMid slice" aria-hidden>
    <path d="M160 10 C110 40 80 70 105 110 C130 150 65 170 85 200" stroke={color} strokeWidth="18" fill="none" strokeLinecap="round" opacity="0.15"/>
    <path d="M160 35 C118 60 88 88 112 126 C136 164 72 180 94 200" stroke={color} strokeWidth="13" fill="none" strokeLinecap="round" opacity="0.18"/>
    <path d="M160 60 C126 80 96 105 118 140 C140 175 80 188 104 200" stroke={color} strokeWidth="9"  fill="none" strokeLinecap="round" opacity="0.22"/>
    <path d="M160 85 C133 100 104 120 124 152 C144 184 88 193 114 200" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.27"/>
  </svg>
);

const StatDecoDots = ({ color }) => (
  <svg viewBox="0 0 160 200" className="absolute right-0 top-0 h-full w-2/5" preserveAspectRatio="xMaxYMid slice" aria-hidden>
    {[...Array(35)].map((_, i) => {
      const t  = i / 34;
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
      <polyline key={i}
        points={`${20 - i*8},${120 - i*20} ${85},${55 - i*20} ${140},${120 - i*20}`}
        fill="none" stroke={color} strokeWidth="13" strokeLinecap="square"
        opacity={0.08 + i * 0.08}
      />
    ))}
  </svg>
);

const statCards = [
  { key: 'productions',  label: 'Productions',   icon: Film,          bg: 'bg-orange-500', accent: '#f97316', Deco: StatDecoWave },
  { key: 'rehearsals',   label: 'Rehearsals',     icon: CalendarDays,  bg: 'bg-blue-500',   accent: '#3b82f6', Deco: StatDecoDots },
  { key: 'members',      label: 'Members',        icon: Users,         bg: 'bg-green-500',  accent: '#22c55e', Deco: StatDecoChevrons },
  { key: 'conflicts',    label: 'Open Conflicts', icon: AlertTriangle, bg: 'bg-red-400',    accent: '#f87171', Deco: StatDecoWave },
];

// ── Production card decorations ────────────────────────────────
const statusConfig = {
  planning:  { label: 'Planning',  badge: 'text-orange-600', icon: 'bg-orange-500', accent: '#f97316' },
  active:    { label: 'Active',    badge: 'text-green-600',  icon: 'bg-green-500',  accent: '#22c55e' },
  completed: { label: 'Completed', badge: 'text-blue-600',   icon: 'bg-blue-500',   accent: '#3b82f6' },
  cancelled: { label: 'Cancelled', badge: 'text-red-500',    icon: 'bg-red-400',    accent: '#f87171' },
};

const DecoWave = ({ color }) => (
  <svg viewBox="0 0 160 200" className="absolute right-0 top-0 h-full w-1/2" preserveAspectRatio="xMaxYMid slice" aria-hidden>
    <path d="M160 20 C120 40 80 60 100 100 C120 140 60 160 80 200" stroke={color} strokeWidth="16" fill="none" strokeLinecap="round" opacity="0.18"/>
    <path d="M160 40 C125 58 85 75 108 115 C130 155 68 172 90 200" stroke={color} strokeWidth="12" fill="none" strokeLinecap="round" opacity="0.22"/>
    <path d="M160 60 C130 76 92 90 115 128 C138 166 76 180 100 200" stroke={color} strokeWidth="9"  fill="none" strokeLinecap="round" opacity="0.26"/>
    <path d="M160 80 C135 95 100 106 122 142 C144 178 84 188 110 200" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.3"/>
    <path d="M160 100 C140 112 108 122 130 156 C150 188 92 196 118 200" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.35"/>
  </svg>
);

const DecoDots = ({ color }) => (
  <svg viewBox="0 0 160 200" className="absolute right-0 top-0 h-full w-1/2" preserveAspectRatio="xMaxYMid slice" aria-hidden>
    {[...Array(40)].map((_, i) => {
      const t  = i / 39;
      const cx = 80 + Math.sin(t * Math.PI * 2.5) * 50;
      const cy = t * 200;
      const r  = 2.5 + Math.sin(t * Math.PI) * 2;
      return <circle key={i} cx={cx} cy={cy} r={r} fill={color} opacity={0.15 + t * 0.3} />;
    })}
  </svg>
);

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

// ── Animated cartoon avatar ────────────────────────────────────
const CartoonAvatar = () => (
  <svg viewBox="0 0 64 64" width="46" height="46" xmlns="http://www.w3.org/2000/svg">
    <style>{`
      @keyframes avatarFloat {
        0%,100% { transform: translateY(0px); }
        50%      { transform: translateY(-2px); }
      }
      @keyframes avatarBlink {
        0%,92%,100% { transform: scaleY(1); }
        96%          { transform: scaleY(0.08); }
      }
      @keyframes avatarSmile {
        0%,100% { d: path("M24 39 Q32 45 40 39"); }
        50%     { d: path("M24 39 Q32 47 40 39"); }
      }
      .av-body { animation: avatarFloat 3s ease-in-out infinite; }
      .av-eye-l { transform-origin: 23px 29px; animation: avatarBlink 4s ease-in-out infinite; }
      .av-eye-r { transform-origin: 41px 29px; animation: avatarBlink 4s ease-in-out infinite; }
    `}</style>

    <g className="av-body">
      {/* Neck */}
      <rect x="27" y="47" width="10" height="7" rx="3" fill="#FDDCB5"/>
      {/* Shoulders / body */}
      <ellipse cx="32" cy="60" rx="15" ry="7" fill="#fff" opacity="0.35"/>

      {/* Head */}
      <ellipse cx="32" cy="30" rx="17" ry="18" fill="#FDDCB5"/>

      {/* Hair */}
      <ellipse cx="32" cy="13" rx="17" ry="8" fill="#4a2c0a"/>
      <ellipse cx="17" cy="22" rx="5" ry="9" fill="#4a2c0a"/>
      <ellipse cx="47" cy="22" rx="5" ry="9" fill="#4a2c0a"/>

      {/* Ears */}
      <ellipse cx="15" cy="30" rx="3.5" ry="4" fill="#F5C89A"/>
      <ellipse cx="49" cy="30" rx="3.5" ry="4" fill="#F5C89A"/>

      {/* Eyes whites */}
      <ellipse cx="23" cy="29" rx="5" ry="5.5" fill="white"/>
      <ellipse cx="41" cy="29" rx="5" ry="5.5" fill="white"/>

      {/* Pupils */}
      <g className="av-eye-l">
        <circle cx="23" cy="30" r="3" fill="#2d1a0e"/>
        <circle cx="24" cy="29" r="1" fill="white"/>
      </g>
      <g className="av-eye-r">
        <circle cx="41" cy="30" r="3" fill="#2d1a0e"/>
        <circle cx="42" cy="29" r="1" fill="white"/>
      </g>

      {/* Eyebrows */}
      <path d="M19 23 Q23 20 27 23" stroke="#4a2c0a" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M37 23 Q41 20 45 23" stroke="#4a2c0a" strokeWidth="1.8" fill="none" strokeLinecap="round"/>

      {/* Nose */}
      <ellipse cx="32" cy="35" rx="2" ry="1.5" fill="#e8a87c" opacity="0.7"/>

      {/* Smile */}
      <path d="M24 40 Q32 47 40 40" stroke="#c0705a" strokeWidth="2" fill="none" strokeLinecap="round"/>

      {/* Cheek blush */}
      <ellipse cx="19" cy="37" rx="4" ry="2.5" fill="#f9a8a8" opacity="0.45"/>
      <ellipse cx="45" cy="37" rx="4" ry="2.5" fill="#f9a8a8" opacity="0.45"/>
    </g>
  </svg>
);

// ── Main component ─────────────────────────────────────────────
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
  const recent   = (rehearsals ?? []).filter(r => r.date <  today).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const statValues = {
    productions: productions?.length ?? '—',
    rehearsals:  rehearsals?.length  ?? '—',
    members:     members?.length     ?? '—',
    conflicts:   conflicts?.length   ?? '—',
  };
  const visibleStats = isStaff ? statCards : statCards.slice(0, 2);

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
          <h1 className="text-[28px] font-black text-slate-800 leading-tight">ISHYA Culture Troup</h1>
          <p className="text-sm text-gray-500 mt-0.5">by <span className="text-orange-500 font-semibold">{user?.name}</span></p>
          <p className="text-xs text-gray-400 mt-0.5">{user?.role} · Management System</p>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className={`grid gap-4 mb-6 ${visibleStats.length === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
        {visibleStats.map(({ key, label, icon: Icon, bg, accent, Deco }) => (
          <div key={key} className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl p-5 min-h-[140px] flex flex-col justify-between">
            <Deco color={accent} />

            {/* Bottom: number + label */}
            <div className="relative z-10 mt-4">
              <p className="text-4xl font-black text-slate-800 leading-none">{statValues[key]}</p>
              <p className="text-xs font-semibold text-gray-400 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tab navigation ── */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-500 hover:text-slate-700'
            }`}
          >{t}</button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {tab === 'Overview' && (
        <div>


          {/* Upcoming */}
          <h2 className="text-base font-black text-slate-800 mb-1">Upcoming Rehearsals</h2>
          <p className="text-sm text-gray-400 mb-4">Your next scheduled rehearsal sessions</p>
          {upcoming.length === 0 ? (
            <EmptyState type="rehearsals" message="No upcoming rehearsals." sub="Nothing scheduled yet — check back later." />
          ) : (
            <div className="border border-gray-200 rounded-sm divide-y divide-gray-100 mb-8">
              {upcoming.map((r) => (
                <div key={r.id} className="flex justify-between items-center px-5 py-3.5">
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
          )}

          {/* Recent */}
          {recent.length > 0 && (
            <>
              <h2 className="text-base font-black text-slate-800 mb-1">Recent Rehearsals</h2>
              <p className="text-sm text-gray-400 mb-4">Rehearsals that have already taken place</p>
              <div className="border border-gray-200 rounded-sm divide-y divide-gray-100">
                {recent.map((r) => (
                  <div key={r.id} className="flex justify-between items-center px-5 py-3.5 opacity-70">
                    <div>
                      <p className="font-semibold text-slate-700 text-sm">{r.title}</p>
                      <p className="text-xs text-gray-400">{r.location || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-medium">{formatDate(r.date)}</p>
                      {r.start_time && <p className="text-xs text-gray-400">{formatTime(r.start_time)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Rehearsals tab ── */}
      {tab === 'Rehearsals' && (
        <div>
          <h2 className="text-base font-black text-slate-800 mb-4">All Rehearsals</h2>
          {!rehearsals || rehearsals.length === 0 ? (
            <EmptyState type="rehearsals" message="No rehearsals found." />
          ) : (
            <div className="border border-gray-200 rounded-sm divide-y divide-gray-100">
              {rehearsals.map((r) => (
                <div key={r.id} className="flex justify-between items-center px-5 py-3.5">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{r.title}</p>
                    <p className="text-xs text-gray-400">{r.location || '—'} · {r.rehearsal_type || 'General'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-medium">{formatDate(r.date)}</p>
                    {r.start_time && <p className="text-xs text-gray-400">{formatTime(r.start_time)} – {formatTime(r.end_time)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Productions tab — card design ── */}
      {tab === 'Productions' && (
        <div>
          <h2 className="text-base font-black text-slate-800 mb-5">All Productions</h2>
          {!productions || productions.length === 0 ? (
            <EmptyState type="productions" message="No productions found." sub="Create your first production to get started." />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {productions.map(p => {
                const cfg  = statusConfig[p.status] ?? statusConfig.planning;
                const deco = decoMap[p.status] ?? decoMap.planning;
                return (
                  <Link key={p.id} to={`/productions/${p.id}`}
                    className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl flex flex-col justify-between min-h-[240px] hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                  >
                    {deco(cfg.accent)}

                    {/* Top: icon + date */}
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
      )}
    </div>
  );
};

export default DashboardPage;
