import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../../api/attendanceApi';
import { rehearsalsApi } from '../../api/rehearsalsApi';
import { adminApi } from '../../api/adminApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ClipboardCheck, Check } from 'lucide-react';

const statusStyle = {
  present: 'bg-green-100 text-green-700',
  absent:  'bg-red-100 text-red-700',
  late:    'bg-yellow-100 text-yellow-700',
  excused: 'bg-blue-100 text-blue-700',
};

const MyAttendancePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: selfCheckinData } = useQuery({
    queryKey: ['self-checkin-status-member'],
    queryFn: () => adminApi.getSelfCheckinStatus().then(r => r.data.data),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });
  const selfCheckinEnabled = selfCheckinData?.enabled;
  const windowMinutes      = selfCheckinData?.windowMinutes ?? 0;

  const getCloseTime = (startTime) => {
    if (!windowMinutes || !startTime) return null;
    const [h, m] = startTime.split(':').map(Number);
    const closeMins = h * 60 + m + windowMinutes;
    const ch = Math.floor(closeMins / 60) % 24;
    const cm = closeMins % 60;
    return `${String(ch).padStart(2, '0')}:${String(cm).padStart(2, '0')}`;
  };

  const { data: myAttendance = [], isLoading } = useQuery({
    queryKey: ['my-attendance', user?.id],
    queryFn: () => attendanceApi.getByMember(user.id).then(r => r.data.data.attendance),
    enabled: !!user?.id,
  });

  const { data: allRehearsals = [] } = useQuery({
    queryKey: ['rehearsals'],
    queryFn: () => rehearsalsApi.getAll().then(r => r.data.data.rehearsals),
  });

  const selfCheckinMutation = useMutation({
    mutationFn: ({ rehearsalId, status }) => attendanceApi.selfCheckin(rehearsalId, status),
    onSuccess: () => {
      toast.success('Checked in!');
      queryClient.invalidateQueries(['my-attendance', user?.id]);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Check-in failed'),
  });

  const today = new Date().toISOString().slice(0, 10);

  // Today's rehearsals from the full schedule
  const todayRehearsals = allRehearsals.filter(r => r.date === today);

  // Existing attendance records for today
  const todayRecords = myAttendance.filter(a => a.Rehearsal?.date === today);

  // Past records (excluding today), newest first
  const pastRecords = myAttendance
    .filter(a => a.Rehearsal?.date && a.Rehearsal.date < today)
    .sort((a, b) => new Date(b.Rehearsal.date) - new Date(a.Rehearsal.date));

  // Helper: find existing check-in record for a rehearsal
  const getRecord = (rehearsalId) => todayRecords.find(a => a.rehearsal_id === rehearsalId || a.Rehearsal?.id === rehearsalId);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
        <ClipboardCheck size={24} /> My Attendance
      </h1>

      {/* Today section */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Today</h2>

        {!selfCheckinEnabled ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-400">
            Self check-in is currently disabled. Your coordinator will mark attendance.
          </div>
        ) : todayRehearsals.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-400">
            No rehearsals scheduled for today.
          </div>
        ) : (
          <div className="space-y-3">
            {todayRehearsals.map(rehearsal => {
              const record = getRecord(rehearsal.id);
              return (
                <div key={rehearsal.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{rehearsal.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {rehearsal.start_time?.slice(0, 5)} – {rehearsal.end_time?.slice(0, 5)}
                        {rehearsal.location && <span> · {rehearsal.location}</span>}
                      </p>
                      {!record && getCloseTime(rehearsal.start_time) && (
                        <p className="text-xs text-amber-500 mt-0.5">
                          Check-in closes at {getCloseTime(rehearsal.start_time)}
                        </p>
                      )}
                    </div>

                    {record ? (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle[record.status]}`}>
                        {record.status === 'present' && <Check size={10} className="inline mr-1" />}
                        {record.status}
                      </span>
                    ) : (
                      <button
                        onClick={() => selfCheckinMutation.mutate({ rehearsalId: rehearsal.id, status: 'present' })}
                        disabled={selfCheckinMutation.isPending}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60 transition-colors"
                      >
                        Check In
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* History */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Attendance History</h2>

        {isLoading ? (
          <div className="text-gray-400 text-sm">Loading…</div>
        ) : pastRecords.length === 0 ? (
          <div className="text-gray-400 text-sm">No attendance records yet.</div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Rehearsal</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pastRecords.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{a.Rehearsal?.title || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{a.Rehearsal?.date || '—'}</td>
                    <td className="px-4 py-3">
                      {a.status
                        ? <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle[a.status]}`}>{a.status}</span>
                        : <span className="text-xs text-gray-300">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAttendancePage;
