import { useAuthStore } from '../stores/auth';
import ModuleCard from '../components/ModuleCard';
import './Dashboard.css';
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../services/api';
import { notifications } from '../services/notifications';
import { Course } from '../types';
import BadgeCard from '../components/BadgeCard';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  
  const { data: coursesResponse, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
    onError: (error: any) => {
      notifications.error(error.response?.data?.message || 'Error al cargar los cursos');
    }
  });

  const courses = coursesResponse?.data;

  const modules = [
    {
      title: 'Fullstack',
      description: 'Desarrollo web completo: Frontend, Backend y más',
      icon: '💻',
      path: '/modules/fullstack',
      coursesCount: courses?.filter((course: Course) => course.module === 'fullstack').length || 0
    },
    {
      title: 'APIs e Integraciones',
      description: 'DataPower, IBM Bus, Broker, APIs, Microservicios',
      icon: '🔌',
      path: '/modules/apis',
      coursesCount: courses?.filter((course: Course) => course.module === 'apis').length || 0
    },
    {
      title: 'Cloud',
      description: 'Computación en la nube y servicios cloud',
      icon: '☁️',
      path: '/modules/cloud',
      coursesCount: courses?.filter((course: Course) => course.module === 'cloud').length || 0
    },
    {
      title: 'Data Engineer',
      description: 'Ingeniería y análisis de datos',
      icon: '📊',
      path: '/modules/data',
      coursesCount: courses?.filter((course: Course) => course.module === 'data').length || 0
    }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">
        {/* Sección de bienvenida */}
        <div className="welcome-section">
          <h1 className="welcome-title">
            ¡Bienvenido, {user?.name}!
          </h1>
        </div>

        {/* Sección de insignias */}
        <div className="badges-section">
          <div className="badges-header">
            <span className="badges-icon">🏆</span>
            <h2 className="badges-title">
              Tus Insignias
            </h2>
          </div>
          {user?.badges?.length ? (
            <div className="badges-grid">
              {user.badges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          ) : (
            <p className="no-badges-text">
              ¡Completa cursos para ganar insignias!
            </p>
          )}
        </div>

        {/* Módulos de capacitación */}
        <div className="modules-grid">
          {modules.map((module) => (
            <ModuleCard key={module.title} {...module} />
          ))}
        </div>
      </div>
    </div>
  );
}