import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';

const PrivateRoute = () => {
  const token = useAuthStore((state) => state.token);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;