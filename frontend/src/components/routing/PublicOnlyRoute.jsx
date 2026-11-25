import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getPostAuthPath } from '../../utils/roles';
import LoadingScreen from '../common/LoadingScreen';

const PublicOnlyRoute = () => {
  const { isAuthenticated, isInitializing, user } = useAuth();

  if (isInitializing) {
    return <LoadingScreen message="Loading..." />;
  }

  if (isAuthenticated) {
    return <Navigate to={getPostAuthPath(user?.role)} replace />;
  }

  return <Outlet />;
};

export default PublicOnlyRoute;
