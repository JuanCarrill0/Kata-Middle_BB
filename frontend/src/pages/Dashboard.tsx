import { useAuthStore } from '../stores/auth';
import ModuleCard from '../components/ModuleCard';
import './Dashboard.css';
import { useQuery } from '@tanstack/react-query';
import { coursesApi, modulesApi } from '../services/api';
import { notifications } from '../services/notifications';
import BadgeCard from '../components/BadgeCard';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  
  const { data: coursesResponse } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
    onError: (error: any) => {
      notifications.error(error.response?.data?.message || 'Error al cargar los cursos');
    }
  });

  const { data: modulesResponse } = useQuery({
    queryKey: ['modules'],
    queryFn: modulesApi.getAll,
    staleTime: 10 * 60 * 1000,
    onError: (error: any) => {
      notifications.error(error.response?.data?.message || 'Error al cargar los módulos');
    }
  });

  const courses = coursesResponse?.data || [];
  const modules = modulesResponse?.data || [];
  return (
    <div className="dashboard-page">
      <div className="page-hero">
        <div className="hero-inner">
          <h1 className="hero-title">¡Bienvenido, {user?.name}!</h1>
          <p className="hero-sub">Sigue tu progreso, completa cursos y gana insignias.</p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-row">
          <div className="content-card badges-card">
            <div className="badges-header">
              <span className="badges-icon">🏆</span>
              <h2 className="badges-title">Tus Insignias</h2>
            </div>

            {user?.badges?.length ? (
              <div className="badges-grid">
                {user.badges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            ) : (
              <p className="no-badges-text">¡Completa cursos para ganar insignias!</p>
            )}
          </div>

          <div className="content-card modules-card">
            <h2 className="modules-title">Módulos de capacitación</h2>
            <div className="modules-grid">
              {modules.map((m: any) => {
                const modId = m.id || m._id;
                const computedCount = courses.filter((c: any) => {
                  const courseModule = (c as any).module || (c as any).category;
                  if (!courseModule) return false;
                  return (typeof courseModule === 'string' && courseModule === modId) || (courseModule && (courseModule as any)._id && ((courseModule as any)._id.toString() === modId || (courseModule as any).toString() === modId));
                }).length;

                const count = typeof m.coursesCount === 'number' ? m.coursesCount : computedCount;

                return (
                  <ModuleCard key={modId} module={{ id: modId, name: m.name, slug: m.slug, description: m.description }} coursesCount={count} />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}