import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import './ModuleCard.css';
import { useAuthStore } from '../stores/auth';
import { usersApi } from '../services/api';
import { notifications } from '../services/notifications';

interface ModuleCardProps {
  module: {
    id: string;
    name: string;
    slug?: string;
    description?: string;
  };
  icon?: ReactNode;
  path?: string;
  coursesCount?: number;
}

export default function ModuleCard({ module, icon, path = `/modules/${module.id}`, coursesCount = 0 }: ModuleCardProps) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const subscribed = !!user?.subscribedModules?.includes(module.id);

  const handleSubscribe = async () => {
    if (!token) return notifications.error('Debes iniciar sesión');
    try {
      setLoading(true);
      await usersApi.subscribe(module.id);
      const resp = await usersApi.getProfile();
      setAuth(token, resp.data as any);
      notifications.success('Suscrito al módulo');
    } catch (e: any) {
      notifications.error(e?.response?.data?.message || 'Error al suscribirse');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!token) return notifications.error('Debes iniciar sesión');
    try {
      setLoading(true);
      await usersApi.unsubscribe(module.id);
      const resp = await usersApi.getProfile();
      setAuth(token, resp.data as any);
      notifications.success('Se canceló la suscripción');
    } catch (e: any) {
      notifications.error(e?.response?.data?.message || 'Error al desuscribirse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="module-card content-card">
      <Link to={path} className="module-card-content" aria-label={`Ver módulo ${module.name}`}>
        <div className="module-card-header">
          <span className="module-card-icon">{icon || '📚'}</span>
          <h3 className="module-card-title">{module.name}</h3>
        </div>
        <p className="module-card-description">
          {module.description}
        </p>
        <span className="module-card-courses">
          {coursesCount} cursos disponibles
        </span>
      </Link>

      <div className="module-card-actions">
        {user && (user.role === 'admin' || user.role === 'teacher') ? (
          <Link to={`/modules/${module.id}/add-course`} className="view-course-button">Crear curso</Link>
        ) : (
          subscribed ? (
            <button className="view-course-button" disabled={loading} onClick={handleUnsubscribe}>
              {loading ? 'Procesando...' : 'Desuscribirse'}
            </button>
          ) : (
            <button className="view-course-button" disabled={loading} onClick={handleSubscribe}>
              {loading ? 'Procesando...' : 'Suscribirse'}
            </button>
          )
        )}
      </div>
    </div>
  );
}