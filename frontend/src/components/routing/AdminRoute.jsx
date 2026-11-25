import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES } from '../../utils/roles';
import LoadingScreen from '../common/LoadingScreen';

const AdminRoute = () => {
  const { isAuthenticated, isInitializing, user } = useAuth();

  if (isInitializing) {
    return <LoadingScreen message="Checking admin access..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== USER_ROLES.ADMIN) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
