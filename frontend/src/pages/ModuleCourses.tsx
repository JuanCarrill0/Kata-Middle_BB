import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../services/api';
import { notifications } from '../services/notifications';
import { Course } from '../types';
import { useAuthStore } from '../stores/auth';
import './ModuleCourses.css';

const moduleNames = {
  fullstack: 'Desarrollo Fullstack',
  apis: 'APIs e Integraciones',
  cloud: 'Cloud',
  data: 'Data Engineer',
};

export default function ModuleCourses() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const { data: coursesResponse, isLoading } = useQuery(['courses'], coursesApi.getAll, {
    onError: (error: any) => {
      notifications.error(error.response?.data?.message || 'Error al cargar los cursos');
    }
  });

  const courses = Array.isArray(coursesResponse?.data) 
    ? coursesResponse.data.filter((course: Course) => course.module === moduleId)
    : [];

  const getProgress = (courseId: string) => {
    if (!user?.progress) return 0;
    const courseProgress = user.progress.find((p) => p.courseId === courseId);
    if (!courseProgress) return 0;
    const course = courses?.find(c => c.id === courseId);
    return (courseProgress.completedChapters.length / (course?.chapters?.length ?? 1)) * 100;
  };

  if (!moduleId || !moduleNames[moduleId as keyof typeof moduleNames]) {
    return (
      <div className="module-container">
        <h1 className="module-title">
          Módulo no encontrado
        </h1>
      </div>
    );
  }

  return (
    <div className="module-container">
      <h1 className="module-title">
        {moduleNames[moduleId as keyof typeof moduleNames]}
      </h1>

      {isLoading ? (
        <div className="loading-bar" />
      ) : courses?.length ? (
        <div className="courses-grid">
          {courses.map((course: Course) => (
            <div
              className="course-card"
              onClick={() => navigate(`/courses/${course.id}`)}
              key={course.id}
            >
              <div className="course-content">
                {course.imageUrl && (
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="course-image"
                  />
                )}
                <h2 className="course-title">
                  {course.title}
                </h2>
                <p className="course-description">
                  {course.description}
                </p>
                <div className="progress-container">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${getProgress(course.id)}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    Progreso: {Math.round(getProgress(course.id))}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-courses">
          No hay cursos disponibles en este módulo.
        </p>
      )}
    </div>
  );
}