import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canDo } from '../../utils/permissions';

const BASIC_ROLES = ['actor', 'crew', 'guest'];

const Sidebar = ({ open = true }) => {
  const { user } = useAuth();
  const isBasic = BASIC_ROLES.includes(user?.role);

  const navItems = [
    { to: '/dashboard',      label: 'Dashboard' },
    { to: '/productions',    label: 'Productions' },
    { to: '/roles',          label: 'Roles',          action: 'roles:write' },
    { to: '/rehearsals',     label: 'Rehearsals' },
    { to: '/attendance',     label: 'Attendance',     action: 'attendance:write' },
    ...(isBasic ? [{ to: '/my-attendance', label: 'My Attendance' }] : []),
    ...(isBasic ? [{ to: '/my-roles',      label: 'My Roles'      }] : []),
    { to: '/reports',        label: 'Reports',        action: 'reports:read' },
    { to: '/conflicts',      label: 'Conflicts',      action: 'conflicts:resolve' },
    { to: '/notifications',  label: 'Notifications' },
    { to: '/admin',          label: 'Admin',          action: 'admin:manage' },
  ];

  if (!open) return null;

  return (
    <aside className="w-56 shrink-0">
      <div className="fixed top-[58px] left-2 bottom-2 w-52 bg-white border border-gray-200 rounded-2xl py-4 flex flex-col shadow-sm overflow-y-auto z-40">
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map(({ to, label, action }) => {
            if (action && !canDo(user?.role, action)) return null;
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-full text-[13.5px] font-semibold transition-colors ${
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                {label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
