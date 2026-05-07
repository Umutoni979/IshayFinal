import { Link, useLocation } from 'react-router-dom';

const LABELS = {
  dashboard:     'Dashboard',
  members:       'Members',
  productions:   'Productions',
  roles:         'Role Assignments',
  rehearsals:    'Rehearsal Schedule',
  attendance:    'Attendance',
  reports:       'Reports',
  conflicts:     'Conflicts',
  notifications: 'Notifications',
  admin:         'Admin',
};

const Breadcrumb = () => {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-1 text-sm mb-6 text-gray-600">
      <span className="text-gray-600">Ishya</span>
      {segments.map((seg, i) => {
        const path  = '/' + segments.slice(0, i + 1).join('/');
        const label = LABELS[seg] || seg;
        const isLast = i === segments.length - 1;
        return (
          <span key={path} className="flex items-center gap-1">
            <span className="text-gray-600 px-0.5">/</span>
            {isLast ? (
              <span className="text-slate-700 font-medium">{label}</span>
            ) : (
              <Link to={path} className="text-orange-500 hover:underline">{label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
