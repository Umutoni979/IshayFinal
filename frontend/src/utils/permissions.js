import { ROLES } from './constants';

const PERMISSIONS = {
  'users:read':         [ROLES.DIRECTOR, ROLES.COORDINATOR],
  'users:write':        [ROLES.DIRECTOR],
  'productions:write':  [ROLES.DIRECTOR],
  'productions:delete': [ROLES.DIRECTOR],
  'roles:write':        [ROLES.DIRECTOR, ROLES.COORDINATOR],
  'roles:approve':      [ROLES.DIRECTOR],
  'rehearsals:write':   [ROLES.DIRECTOR, ROLES.COORDINATOR],
  'rehearsals:delete':  [ROLES.DIRECTOR],
  'attendance:write':   [ROLES.DIRECTOR, ROLES.COORDINATOR],
  'reports:read':       [ROLES.DIRECTOR, ROLES.COORDINATOR],
  'conflicts:resolve':  [ROLES.DIRECTOR, ROLES.COORDINATOR],
  'notifications:send': [ROLES.DIRECTOR, ROLES.COORDINATOR],
  'admin:manage':       [ROLES.DIRECTOR],
};

export const canDo = (role, action) => {
  return PERMISSIONS[action]?.includes(role) ?? false;
};
