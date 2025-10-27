import { useAuthStore } from '../stores/auth';
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../services/api';
import { notifications } from '../services/notifications';
import BadgeCard from '../components/BadgeCard';
import './Profile.css';

export default function Profile() {
  const user = useAuthStore((state) => state.user);

  const { data: coursesResponse } = useQuery(['courses'], coursesApi.getAll, {
    onError: (error: any) => {
      notifications.error(error.response?.data?.message || 'Error al cargar los cursos');
    }
  });

  const courses = coursesResponse?.data || [];

  // Calcular estadísticas
  const totalCourses = courses.length;
  const coursesStarted = user?.progress?.length || 0;
  const completedChapters = user?.progress?.reduce((acc, curr) => 
    acc + curr.completedChapters.length, 0) || 0;
  const totalBadges = user?.badges?.length || 0;

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

        {/* Estadísticas */}
        <section className="profile-section">
          <h2 className="section-title">Mis Estadísticas</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{totalCourses}</div>
              <div className="stat-label">Cursos Disponibles</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{coursesStarted}</div>
              <div className="stat-label">Cursos Iniciados</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{completedChapters}</div>
              <div className="stat-label">Capítulos Completados</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totalBadges}</div>
              <div className="stat-label">Insignias Ganadas</div>
            </div>
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