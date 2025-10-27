import {
  Route,
  Navigate,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom';
import App from './App';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import ModuleCourses from './pages/ModuleCourses';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/PrivateRoute';
import { useAuthStore } from './stores/auth';

const RootIndexRedirect = () => {
  const token = useAuthStore((s) => s.token);
  return token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
  <Route index element={<RootIndexRedirect />} />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route element={<PrivateRoute />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="modules/:moduleId" element={<ModuleCourses />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:id" element={<CourseDetail />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);