import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rehearsalsApi } from '../../api/rehearsalsApi';
import { attendanceApi } from '../../api/attendanceApi';
import { usersApi } from '../../api/usersApi';
import toast from 'react-hot-toast';
import { ClipboardCheck, Check, Lock } from 'lucide-react';
import { TableSkeleton } from '../../components/common/Skeleton';

const STATUS_OPTIONS = ['present', 'absent', 'late', 'excused'];

const statusStyle = {
  present: 'bg-green-100 text-green-700 border-green-200',
  absent:  'bg-red-100 text-red-700 border-red-200',
  late:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  excused: 'bg-blue-100 text-blue-700 border-blue-200',
};

const today = () => new Date().toISOString().slice(0, 10);

const AttendancePage = () => {
  const queryClient = useQueryClient();
  const [selectedRehearsal, setSelectedRehearsal] = useState('');
  const [saving, setSaving] = useState({});

  const { data: rehearsals = [] } = useQuery({
    queryKey: ['rehearsals'],
    queryFn: () => rehearsalsApi.getAll().then(r => r.data.data.rehearsals),
  });

  // Auto-select the most recent past rehearsal on load
  useEffect(() => {
    if (!rehearsals.length || selectedRehearsal) return;
    const t = today();
    const past = rehearsals.filter(r => r.date <= t);
    const pick = past.length ? past[past.length - 1] : rehearsals[0];
    setSelectedRehearsal(pick.id);
  }, [rehearsals]);

  const selectedRehearsalObj = rehearsals.find(r => r.id === selectedRehearsal);
  const isPast = selectedRehearsalObj ? selectedRehearsalObj.date < today() : false;

  // For past rehearsals: only load existing records (archived — no new members)
  // For today/future: load all current members so we can mark everyone
  const { data: allMembers = [] } = useQuery({
    queryKey: ['users-members'],
    queryFn: () => usersApi.getAll({ limit: 200 }).then(r => {
      const d = r.data.data;
      return (d.users || d).filter(u => ['actor', 'crew', 'coordinator'].includes(u.role));
    }),
    enabled: !!selectedRehearsal && !isPast,
  });

  const { data: existingRecords = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance', selectedRehearsal],
    queryFn: () => attendanceApi.getByRehearsal(selectedRehearsal).then(r => r.data.data.attendance),
    enabled: !!selectedRehearsal,
  });

  const rows = useMemo(() => {
    if (!selectedRehearsal) return [];

    if (isPast) {
      // Past: show only who was recorded — no new members, read-only
      return existingRecords.map(r => ({
        member: r.member || { id: r.member_id, name: r.member_id, role: '—' },
        status: r.status,
        readonly: true,
      }));
    }

    // Today/future: all current members, editable
    const byMember = {};
    existingRecords.forEach(r => { byMember[r.member_id] = r; });
    return allMembers.map(member => ({
      member,
      status: byMember[member.id]?.status || null,
      readonly: false,
    }));
  }, [allMembers, existingRecords, selectedRehearsal, isPast]);

  const markMutation = useMutation({
    mutationFn: (data) => attendanceApi.mark(data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries(['attendance', selectedRehearsal]);
      setSaving(s => ({ ...s, [vars.member_id]: false }));
    },
    onError: (_, vars) => {
      toast.error('Failed to save');
      setSaving(s => ({ ...s, [vars.member_id]: false }));
    },
  });

  const handleMark = (memberId, status) => {
    setSaving(s => ({ ...s, [memberId]: true }));
    markMutation.mutate({ rehearsal_id: selectedRehearsal, member_id: memberId, status });
  };

  const markedCount = rows.filter(r => r.status).length;

  return (
    <div>
      <h1 className="text-2xl font-normal text-slate-800 flex items-center gap-2 mb-6">
        Attendance Tracking
      </h1>

      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <select
          value={selectedRehearsal}
          onChange={e => setSelectedRehearsal(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-64"
        >
          <option value="">Select a rehearsal…</option>
          {rehearsals.map(r => (
            <option key={r.id} value={r.id}>{r.title} — {r.date}</option>
          ))}
        </select>

        {selectedRehearsal && !loadingAttendance && (
          <span className="text-sm text-gray-600">{markedCount} / {rows.length} marked</span>
        )}

        {isPast && (
          <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            <Lock size={11} /> Past rehearsal — view only
          </span>
        )}
      </div>

      {selectedRehearsal && (
        <>
          {loadingAttendance ? (
            <TableSkeleton rows={5} />
          ) : rows.length === 0 ? (
            <div className="text-gray-600 text-sm">
              {isPast ? 'No attendance was recorded for this rehearsal.' : 'No members found.'}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  {selectedRehearsalObj?.title}
                  {selectedRehearsalObj?.date && (
                    <span className="ml-2 text-gray-600 font-normal">{selectedRehearsalObj.date}</span>
                  )}
                </span>
                <span className="text-xs text-gray-600">
                  {isPast ? 'Archived record' : 'Click a status to mark'}
                </span>
              </div>
              <table className="w-full text-sm" style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700 }}>
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">Member</th>
                    <th className="text-left px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">Role</th>
                    <th className="text-left px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">
                      {isPast ? 'Status' : 'Mark Attendance'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ member, status, readonly }) => (
                    <tr key={member.id} className="border-b border-gray-600 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 text-gray-600 text-sm font-bold">{member.name}</td>
                      <td className="px-4 py-2 text-gray-600 text-sm font-bold capitalize">{member.role}</td>
                      <td className="px-4 py-2 text-gray-600 text-sm font-bold">
                        {readonly ? (
                          // Past: read-only badge
                          status
                            ? <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyle[status]}`}>{status}</span>
                            : <span className="text-xs text-gray-600 italic">not recorded</span>
                        ) : (
                          // Today/future: editable buttons
                          <div className="flex items-center gap-1.5">
                            {STATUS_OPTIONS.map(s => (
                              <button
                                key={s}
                                onClick={() => handleMark(member.id, s)}
                                disabled={saving[member.id]}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all capitalize
                                  ${status === s
                                    ? `${statusStyle[s]} ring-2 ring-offset-1 ring-current`
                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-600'
                                  }
                                  ${saving[member.id] ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                                `}
                              >
                                {status === s && <Check size={10} className="inline mr-0.5 -mt-0.5" />}
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AttendancePage;
