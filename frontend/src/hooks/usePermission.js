import { useAuth } from '../context/AuthContext';
import { canDo } from '../utils/permissions';

const usePermission = (action) => {
  const { user } = useAuth();
  if (!user) return false;
  return canDo(user.role, action);
};

export default usePermission;
