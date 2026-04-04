import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../api/reportsApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import SearchFilters from '../../components/common/SearchFilters';
import DataTable from '../../components/common/DataTable';
import { BarChart2, Table2, Maximize2, Minimize2 } from 'lucide-react';

const columns = [
  { key: 'name',            label: 'Member',  render: r => <span className="font-medium text-slate-800">{r.member?.name}</span> },
  { key: 'present',         label: 'Present', render: r => <span className="text-green-600 font-medium">{r.present}</span> },
  { key: 'absent',          label: 'Absent',  render: r => <span className="text-red-500 font-medium">{r.absent}</span> },
  { key: 'late',            label: 'Late',    render: r => <span className="text-yellow-600 font-medium">{r.late}</span> },
  { key: 'excused',         label: 'Excused', render: r => <span className="text-indigo-500 font-medium">{r.excused}</span> },
  { key: 'attendance_rate', label: 'Rate',    render: r => <span className="font-semibold text-slate-800">{r.attendance_rate}</span> },
];

const ReportsPage = () => {
  const [search, setSearch]         = useState('');
  const [view, setView]             = useState('chart'); // 'chart' | 'table'
  const [tableFullscreen, setTableFullscreen] = useState(false);

  const { data: report, isLoading } = useQuery({
    queryKey: ['attendance-report'],
    queryFn: () => reportsApi.getAttendance().then(r => r.data.data.report),
  });

  const filtered = (report ?? []).filter(r =>
    !search || r.member?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = filtered.map(r => ({
    name:    r.member?.name?.split(' ')[0],
    present: r.present,
    absent:  r.absent,
    late:    r.late,
    excused: r.excused,
  }));

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 mb-1">Reports</h1>
          <p className="text-sm text-gray-400">Attendance analytics across all productions</p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('chart')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'chart' ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-500 hover:text-slate-700'
            }`}
          >
            <BarChart2 size={15} /> Chart
          </button>
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'table' ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-500 hover:text-slate-700'
            }`}
          >
            <Table2 size={15} /> Table
          </button>
        </div>
      </div>

      {/* ── Chart view ── */}
      {view === 'chart' && (
        <div className="bg-white rounded-sm border border-gray-200 p-6">
          <h2 className="text-base font-black text-slate-800 mb-4">Attendance Overview</h2>
          {isLoading ? (
            <div className="text-gray-400 text-sm">Loading…</div>
          ) : chartData.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No attendance data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={chartData} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#22c55e" radius={[4,4,0,0]} />
                <Bar dataKey="absent"  fill="#ef4444" radius={[4,4,0,0]} />
                <Bar dataKey="late"    fill="#f59e0b" radius={[4,4,0,0]} />
                <Bar dataKey="excused" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Prompt to switch to table */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">View the full breakdown per member in the table</p>
            <button
              onClick={() => setView('table')}
              className="flex items-center gap-1.5 bg-slate-500 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
            >
              <Table2 size={13} /> View Table
            </button>
          </div>
        </div>
      )}

      {/* ── Table view ── */}
      {view === 'table' && (
        <>
          {/* Fullscreen overlay */}
          {tableFullscreen && (
            <div className="fixed inset-0 z-50 bg-white overflow-auto p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-slate-800">Attendance Report — Full View</h2>
                <button
                  onClick={() => setTableFullscreen(false)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-slate-700 transition-colors"
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
                <p className="text-sm text-gray-500">Showing per-member attendance breakdown</p>
                <button
                  onClick={() => setTableFullscreen(true)}
                  className="flex items-center gap-1.5 bg-slate-500 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
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
