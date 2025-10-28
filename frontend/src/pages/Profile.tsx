import { useAuthStore } from '../stores/auth';
import { useQuery } from '@tanstack/react-query';
import { historyApi } from '../services/api';
import { notifications } from '../services/notifications';
import BadgeCard from '../components/BadgeCard';
import './Profile.css';

import type { ApiHistory } from '../types/api';

// Helpers
const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    'fullstack': '#4F46E5', // Indigo
    'apis': '#10B981', // Emerald
    'cloud': '#3B82F6', // Blue
    'data': '#F59E0B', // Amber
    'default': '#6B7280' // Gray
  };
  return colors[category] || colors.default;
};

export default function Profile() {
  const user = useAuthStore((state) => state.user);

  const { data: history } = useQuery<ApiHistory>(['history'], async () => {
    const response = await historyApi.getUserHistory();
    return response.data as ApiHistory;
  }, {
    onError: () => {
      notifications.error('Error al cargar el historial');
    }
  });

  const coursesStarted = user?.progress?.length || 0;

  return (
    <div className="profile-container">
      <h1 className="profile-title">Mi Perfil</h1>
      
      <div className="profile-content">
        {/* Información Personal */}
        <section className="profile-section">
          <h2 className="section-title">Información Personal</h2>
          <div className="profile-info">
            <div className="info-item">
              <span className="info-label">Nombre</span>
              <span className="info-value">{user?.name || 'No disponible'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Correo Electrónico</span>
              <span className="info-value">{user?.email || 'No disponible'}</span>
            </div>
          </div>
        </section>

        {/* Estadísticas y Progreso */}
        <section className="profile-section">
          <h2 className="section-title">Mi Progreso</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{history?.stats?.totalCourses || 0}</div>
              <div className="stat-label">Cursos Completados</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{coursesStarted}</div>
              <div className="stat-label">Cursos en Progreso</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{history?.stats?.totalChapters || 0}</div>
              <div className="stat-label">Capítulos Totales</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Math.round((history?.stats?.totalTime || 0) / 60)}</div>
              <div className="stat-label">Horas de Estudio</div>
            </div>
          </div>

          {/* Progreso por Categoría */}
          <div className="category-progress">
            <h3>Progreso por Categoría</h3>
            {history?.stats?.byCategory.map((cat: any) => (
              <div key={cat.category} className="category-item">
                <div className="category-header">
                  <span className="category-name">{cat.category}</span>
                  <span className="category-count">{cat.count} cursos</span>
                </div>
                <div className="category-bar">
                  <div 
                    className="category-fill"
                    style={{ 
                      width: `${(cat.count / (history.stats.totalCourses || 1)) * 100}%`,
                      backgroundColor: getCategoryColor(cat.category)
                    }}
                  />
                </div>
                <div className="category-date">
                  Último curso: {new Date(cat.lastCompleted).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Insignias */}
        <section className="profile-section">
          <h2 className="section-title">Mis Insignias</h2>
          {user?.badges?.length ? (
            <div className="badges-grid">
              {user.badges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          ) : (
            <p className="info-value">
              Aún no has ganado ninguna insignia. ¡Completa cursos para conseguirlas!
            </p>
          )}
        </section>
      </div>
    </div>
  );
}