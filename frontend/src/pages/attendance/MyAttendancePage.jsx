import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { attendanceApi } from '../../api/attendanceApi';
import { rehearsalsApi } from '../../api/rehearsalsApi';
import { adminApi } from '../../api/adminApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ClipboardCheck, Check, Timer } from 'lucide-react';
import { InlineSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

// Countdown to an absolute ISO timestamp
const useCountdownTo = (closesAt) => {
  const [display, setDisplay] = useState(null);

  useEffect(() => {
    if (!closesAt) { setDisplay(null); return; }
    const target = new Date(closesAt).getTime();

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setDisplay('closed'); return; }
      const totalSecs = Math.floor(diff / 1000);
      const hrs  = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      if (hrs > 0)       setDisplay(`${hrs}h ${mins}m`);
      else if (mins > 0) setDisplay(`${mins}m ${secs}s`);
      else               setDisplay(`${secs}s`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [closesAt]);

  return display;
};

// Per-rehearsal card with global countdown
const RehearsalCheckinCard = ({ rehearsal, record, closesAt, onCheckin, isPending }) => {
  const countdown = useCountdownTo(closesAt);
  const closed    = countdown === 'closed';
  const closeTime = closesAt ? new Date(closesAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 text-sm">{rehearsal.title}</p>
          <p className="text-xs text-gray-600 mt-0.5">
            {rehearsal.start_time?.slice(0, 5)} – {rehearsal.end_time?.slice(0, 5)}
            {rehearsal.location && <span> · {rehearsal.location}</span>}
          </p>
          {!record && !closed && countdown && (
            <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
              <Timer size={11} /> Closes at {closeTime} · <span className="font-semibold">{countdown}</span> left
            </p>
          )}
          {!record && closed && (
            <p className="text-xs text-red-400 mt-1">Check-in closed</p>
          )}
        </div>

        {record ? (
          <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle[record.status]}`}>
            {record.status === 'present' && <Check size={10} className="inline mr-1" />}
            {record.status}
          </span>
        ) : closed ? null : (
          <button
            onClick={onCheckin}
            disabled={isPending}
            className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60 transition-colors"
          >
            Check In
          </button>
        )}
      </div>
    </div>
  );
};

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
  const selfCheckinClosesAt = selfCheckinData?.closesAt || null;

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
      <h1 className="text-2xl font-normal text-slate-800 flex items-center gap-2 mb-6">
        My Attendance
      </h1>

      {/* Today section */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Today</h2>

        {!selfCheckinEnabled ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600">
            Self check-in is currently disabled. Your coordinator will mark attendance.
          </div>
        ) : todayRehearsals.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600">
            No rehearsals scheduled for today.
          </div>
        ) : (
          <div className="space-y-3">
            {todayRehearsals.map(rehearsal => (
              <RehearsalCheckinCard
                key={rehearsal.id}
                rehearsal={rehearsal}
                record={getRecord(rehearsal.id)}
                closesAt={selfCheckinClosesAt}
                onCheckin={() => selfCheckinMutation.mutate({ rehearsalId: rehearsal.id, status: 'present' })}
                isPending={selfCheckinMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Attendance History</h2>

        {isLoading ? (
          <InlineSkeleton rows={3} />
        ) : pastRecords.length === 0 ? (
          <EmptyState type="attendance" message="No attendance records yet." />
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-600 uppercase tracking-wide">Rehearsal</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-600 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-600 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pastRecords.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{a.Rehearsal?.title || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{a.Rehearsal?.date || '—'}</td>
                    <td className="px-4 py-3">
                      {a.status
                        ? <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle[a.status]}`}>{a.status}</span>
                        : <span className="text-xs text-gray-600">—</span>
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
