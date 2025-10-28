import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi, modulesApi } from '../services/api';
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

  const queryClient = useQueryClient();
  const deleteCourseMutation = useMutation((courseId: string) => coursesApi.delete(courseId), {
    onSuccess: () => {
      queryClient.invalidateQueries(['courses']);
      notifications.success('Curso eliminado');
    },
    onError: (error: any) => {
      notifications.error(error.response?.data?.message || 'Error al eliminar curso');
    }
  });

  const isLegacy = !!moduleNames[moduleId as keyof typeof moduleNames];

  // If legacy slug (fullstack/apis/...), continue using the global courses list and filter by category.
  // Otherwise, fetch module info and module-specific courses from the API.
  const { data: moduleData } = useQuery(
    ['module', moduleId],
    () => modulesApi.getById(moduleId as string).then(r => r.data),
    {
      enabled: !isLegacy && !!moduleId,
      onError: () => {
        // handled later by rendering "Módulo no encontrado"
      }
    }
  );

  const { data: moduleCoursesData } = useQuery(
    ['moduleCourses', moduleId],
    () => modulesApi.getCourses(moduleId as string).then(r => r.data),
    { enabled: !isLegacy && !!moduleId }
  );

  const courses: Course[] = (() => {
    if (isLegacy) {
      return Array.isArray(coursesResponse?.data)
        ? coursesResponse.data.filter((course: Course) => course.category === moduleId)
        : [];
    }

    // Non-legacy: use moduleCoursesData (from /api/modules/:id/courses)
    return Array.isArray(moduleCoursesData) ? moduleCoursesData : [];
  })();

  // Determine module title and missing module handling
  let moduleTitle: string | null = null;
  if (isLegacy) {
    moduleTitle = moduleNames[moduleId as keyof typeof moduleNames];
  } else if (moduleData) {
    moduleTitle = moduleData.name;
  }

  if (!moduleId || !moduleTitle) {
    return (
      <div className="module-container">
        <h1 className="module-title">Módulo no encontrado</h1>
      </div>
    );
  }

  return (
    <div className="module-container">
      <h1 className="module-title">{moduleTitle}</h1>

      {user && (user.role === 'admin' || user.role === 'teacher') && (
        <div style={{ marginBottom: 12 }}>
          <a href={`/modules/${moduleId}/add-course`} className="view-course-button">Crear curso en este módulo</a>
        </div>
      )}

      {isLoading ? (
        <div className="loading-bar" />
      ) : courses?.length ? (
        <div className="courses-grid">
          {courses.map((course: Course) => (
            <div key={course.id} className="course-card">
              <div className="course-card-clickable" onClick={() => navigate(`/courses/${course.id}`)}>
              <div className="course-content">
                <div className="course-illustration" aria-hidden="true">
                  <svg width="120" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 5.5C3 4.67157 3.67157 4 4.5 4H19" stroke="#1976d2" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 19.5C3 18.6716 3.67157 18 4.5 18H19" stroke="#1976d2" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19 4v14" stroke="#1976d2" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 7h8v10H8z" fill="#e3f2fd" stroke="#1976d2" strokeWidth="1"/>
                  </svg>
                </div>
                <h2 className="course-title">
                  {course.title}
                </h2>
                <p className="course-description">
                  {course.description}
                </p>
              </div>
              </div>

              {user && (user.role === 'admin' || user.role === 'teacher') && (
                <div style={{ padding: 8 }}>
                  <a href={`/courses/${course.id}/add-chapter`} className="view-course-button">Agregar capítulo</a>
                  <button
                    style={{ marginLeft: 8 }}
                    className="view-course-button danger"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const confirmed = await notifications.confirm('Se eliminará el curso y sus archivos asociados.');
                      if (confirmed.isConfirmed) {
                        deleteCourseMutation.mutate(course.id);
                      }
                    }}
                  >Eliminar curso</button>
                </div>
              )}
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