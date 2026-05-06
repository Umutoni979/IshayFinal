import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../api/usersApi';
import { DetailSkeleton } from '../../components/common/Skeleton';

const MemberDetailPage = () => {
  const { id } = useParams();
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getById(id).then(r => r.data.data.user),
  });
  const { data: summary } = useQuery({
    queryKey: ['user-attendance', id],
    queryFn: () => usersApi.getAttendanceSummary(id).then(r => r.data.data.summary),
  });

  if (isLoading) return <DetailSkeleton />;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-normal text-slate-800 mb-6">{user?.name}</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4 space-y-3">
        <p><span className="font-medium text-gray-600">Email:</span> {user?.email}</p>
        <p><span className="font-medium text-gray-600">Role:</span> <span>{user?.role}</span></p>
        <p><span className="font-medium text-gray-600">Type:</span> <span>{user?.member_type ?? '—'}</span></p>
        <p><span className="font-medium text-gray-600">Phone:</span> {user?.phone ?? '—'}</p>
        <p><span className="font-medium text-gray-600">Skills:</span> {user?.skills?.join(', ') || '—'}</p>
        <p><span className="font-medium text-gray-600">Status:</span> {user?.is_active ? '✅ Active' : '❌ Inactive'}</p>
      </div>

      {summary && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Attendance Summary</h2>
          <div className="grid grid-cols-4 gap-3 text-center">
            {['present', 'absent', 'late', 'excused'].map(s => (
              <div key={s} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xl font-bold text-gray-800">{summary[s] ?? 0}</p>
                <p className="text-xs text-gray-500">{s}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-gray-500">Attendance rate: <strong>{summary.attendance_rate}%</strong></p>
        </div>
      )}
    </div>
  );
};

export default MemberDetailPage;
