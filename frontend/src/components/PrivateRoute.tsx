import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';

const PrivateRoute = () => {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

export default PrivateRoute;