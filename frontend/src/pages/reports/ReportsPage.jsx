import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../api/reportsApi';
import { rehearsalsApi } from '../../api/rehearsalsApi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import SearchFilters from '../../components/common/SearchFilters';
import DataTable from '../../components/common/DataTable';
import { BarChart2, Table2, Maximize2, Minimize2, Filter } from 'lucide-react';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

const columns = [
  { key: 'name',            label: 'Member',     render: r => <span className="font-medium text-slate-800">{r.member?.name}</span> },
  { key: 'present',         label: 'Present',    render: r => <span className="text-green-600 font-medium">{r.present}</span> },
  { key: 'absent',          label: 'Absent',     render: r => <span className="text-red-500 font-medium">{r.absent}</span> },
  { key: 'late',            label: 'Late',       render: r => <span className="text-yellow-600 font-medium">{r.late}</span> },
  { key: 'excused',         label: 'Excused',    render: r => <span className="text-indigo-500 font-medium">{r.excused}</span> },
  { key: 'not_marked',      label: 'Not marked', render: r => r.not_marked ? <span className="text-gray-600 font-medium">{r.not_marked}</span> : <span className="text-gray-600">—</span> },
  { key: 'attendance_rate', label: 'Rate',       render: r => <span className="font-semibold text-slate-800">{r.attendance_rate}</span> },
];

const ReportsPage = () => {
  const [search, setSearch]         = useState('');
  const [view, setView]             = useState('chart');
  const [tableFullscreen, setTableFullscreen] = useState(false);
  const [selectedRehearsal, setSelectedRehearsal] = useState('');

  const { data: rehearsals = [] } = useQuery({
    queryKey: ['rehearsals'],
    queryFn: () => rehearsalsApi.getAll().then(r => r.data.data.rehearsals),
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ['attendance-report', selectedRehearsal],
    queryFn: () => reportsApi.getAttendance(
      selectedRehearsal ? { rehearsal_id: selectedRehearsal } : {}
    ).then(r => r.data.data.report),
  });

  const filtered = (report ?? []).filter(r =>
    !search || r.member?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = filtered.map(r => ({
    name:       r.member?.name?.split(' ')[0],
    present:    r.present,
    absent:     r.absent,
    late:       r.late,
    excused:    r.excused,
    not_marked: r.not_marked || 0,
  }));

  const selectedRehearsalLabel = rehearsals.find(r => r.id === selectedRehearsal);

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-normal text-slate-800 mb-1">Reports</h1>
          <p className="text-sm text-gray-600">Attendance analytics across all productions</p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('chart')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'chart' ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-600 hover:text-slate-700'
            }`}
          >
            <BarChart2 size={15} /> Chart
          </button>
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'table' ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-600 hover:text-slate-700'
            }`}
          >
            <Table2 size={15} /> Table
          </button>
        </div>
      </div>


      {/* ── Rehearsal Filter ── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Filter by rehearsal</span>
        </div>
        <select
          value={selectedRehearsal}
          onChange={e => setSelectedRehearsal(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white min-w-[220px]"
        >
          <option value="">All rehearsals</option>
          {rehearsals
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(r => (
              <option key={r.id} value={r.id}>
                {r.title} — {r.date}
              </option>
            ))}
        </select>
        {selectedRehearsal && (
          <button
            onClick={() => setSelectedRehearsal('')}
            className="text-xs text-gray-600 hover:text-red-500 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Chart view ── */}
      {view === 'chart' && (
        <div className="bg-white rounded-sm border border-gray-200 p-6">
          <h2 className="text-base font-black text-slate-800 mb-1">Attendance Overview</h2>
          {selectedRehearsalLabel && (
            <p className="text-xs text-indigo-500 mb-4 font-medium">
              {selectedRehearsalLabel.title} · {selectedRehearsalLabel.date}
            </p>
          )}
          {isLoading ? (
            <TableSkeleton rows={4} />
          ) : chartData.length === 0 ? (
            <EmptyState type="reports" message="No attendance data for this rehearsal." />
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-gray-600 capitalize">{v}</span>} />
                <Line type="monotone" dataKey="present"    name="present"    stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4, fill: '#22c55e' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="absent"     name="absent"     stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="late"       name="late"       stroke="#f59e0b" strokeWidth={2}   dot={{ r: 3, fill: '#f59e0b' }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="excused"    name="excused"    stroke="#6366f1" strokeWidth={2}   dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="not_marked" name="not marked" stroke="#d1d5db" strokeWidth={1.5} dot={{ r: 3, fill: '#d1d5db' }} activeDot={{ r: 4 }} strokeDasharray="4 3" />
              </LineChart>
            </ResponsiveContainer>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-600">View the full breakdown per member in the table</p>
            <button
              onClick={() => setView('table')}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
            >
              <Table2 size={13} /> View Table
            </button>
          </div>
        </div>
      )}

      {/* ── Table view ── */}
      {view === 'table' && (
        <>
          {tableFullscreen && (
            <div className="fixed inset-0 z-50 bg-white overflow-auto p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-slate-800">Attendance Report — Full View</h2>
                <button
                  onClick={() => setTableFullscreen(false)}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-slate-700 transition-colors"
                >
                  <Minimize2 size={16} /> Exit fullscreen
                </button>
              </div>
              <SearchFilters search={search} onSearch={setSearch} placeholder="Search by member name…" resultCount={filtered.length} filters={[]} />
              <DataTable columns={columns} data={filtered} />
            </div>
          )}

          {!tableFullscreen && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  {selectedRehearsalLabel
                    ? `${selectedRehearsalLabel.title} · ${selectedRehearsalLabel.date}`
                    : 'Showing per-member attendance breakdown'}
                </p>
                <button
                  onClick={() => setTableFullscreen(true)}
                  className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                >
                  <Maximize2 size={13} /> Full screen
                </button>
              </div>
              <SearchFilters search={search} onSearch={setSearch} placeholder="Search by member name…" resultCount={filtered.length} filters={[]} />
              <DataTable columns={columns} data={filtered} />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsPage;
