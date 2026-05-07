import { useQuery } from '@tanstack/react-query';
import { rolesApi } from '../../api/rolesApi';
import { useAuth } from '../../context/AuthContext';
import { Theater } from 'lucide-react';
import { ListSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

const statusStyle = {
  open:     'bg-gray-100 text-gray-600',
  assigned: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
};

const MyRolesPage = () => {
  const { user } = useAuth();

  const { data: myRoles = [], isLoading } = useQuery({
    queryKey: ['my-roles', user?.id],
    queryFn: () => rolesApi.getAll().then(r =>
      r.data.data.roles.filter(role => role.assigned_to?.id === user?.id)
    ),
    enabled: !!user?.id,
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-normal text-slate-800 flex items-center gap-2 mb-1">
        My Roles
      </h1>
      <p className="text-sm text-gray-600 mb-6">Parts you have been assigned to in productions</p>

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : myRoles.length === 0 ? (
        <EmptyState type="roles" message="No roles assigned yet." sub="Your coordinator will assign you a role soon." />
      ) : (
        <div className="space-y-3">
          {myRoles.map(role => (
            <div key={role.id} className="bg-white border border-gray-100 rounded-xl px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">{role.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{role.Production?.title || '—'}</p>
                  {role.description && (
                    <p className="text-xs text-gray-600 mt-1.5">{role.description}</p>
                  )}
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle[role.status]}`}>
                  {role.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRolesPage;
