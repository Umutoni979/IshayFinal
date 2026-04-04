const ROLES = {
  DIRECTOR: 'director',
  COORDINATOR: 'coordinator',
  ACTOR: 'actor',
  CREW: 'crew',
  GUEST: 'guest',
};

const MEMBER_TYPES = {
  ACTOR: 'actor',
  CREW: 'crew',
};

// Which roles can access which actions
const PERMISSIONS = {
  'users:read':              [ROLES.DIRECTOR, ROLES.COORDINATOR],
  'users:write':             [ROLES.DIRECTOR],
  'users:delete':            [ROLES.DIRECTOR],
  'productions:read':        [ROLES.DIRECTOR, ROLES.COORDINATOR, ROLES.ACTOR, ROLES.CREW],
  'productions:write':       [ROLES.DIRECTOR],
  'productions:delete':      [ROLES.DIRECTOR],
  'roles:read':              [ROLES.DIRECTOR, ROLES.COORDINATOR, ROLES.ACTOR, ROLES.CREW],
  'roles:write':             [ROLES.DIRECTOR, ROLES.COORDINATOR],
  'roles:approve':           [ROLES.DIRECTOR],
  'rehearsals:read':         [ROLES.DIRECTOR, ROLES.COORDINATOR, ROLES.ACTOR, ROLES.CREW],
  'rehearsals:write':        [ROLES.DIRECTOR, ROLES.COORDINATOR],
  'rehearsals:delete':       [ROLES.DIRECTOR],
  'attendance:read':         [ROLES.DIRECTOR, ROLES.COORDINATOR],
  'attendance:write':        [ROLES.DIRECTOR, ROLES.COORDINATOR],
  'reports:read':            [ROLES.DIRECTOR, ROLES.COORDINATOR],
  'reports:export':          [ROLES.DIRECTOR],
  'conflicts:read':          [ROLES.DIRECTOR, ROLES.COORDINATOR],
  'conflicts:resolve':       [ROLES.DIRECTOR, ROLES.COORDINATOR],
  'notifications:send':      [ROLES.DIRECTOR, ROLES.COORDINATOR],
  'admin:manage':            [ROLES.DIRECTOR],
  'admin:audit':             [ROLES.DIRECTOR],
};

module.exports = { ROLES, MEMBER_TYPES, PERMISSIONS };
