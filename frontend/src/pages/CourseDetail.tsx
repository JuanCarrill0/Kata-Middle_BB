import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi, usersApi } from '../services/api';
import { notifications } from '../services/notifications';
import { useAuthStore } from '../stores/auth';
import './CourseDetail.css';

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const { data: courseResponse, isLoading } = useQuery(
    ['course', id],
    () => (id ? coursesApi.getById(id) : Promise.resolve(null)),
    {
      onError: (error: any) => {
        notifications.error(error.response?.data?.message || 'Error al cargar el curso');
      }
    }
  );

  const course = courseResponse?.data;

  const resolveImage = (img?: string) => {
    if (!img) return `${import.meta.env.BASE_URL}default-badge.png`;
    if (/^https?:\/\//i.test(img)) return img;
    return `${import.meta.env.VITE_MINIO_URL}/${img}`;
  };

  const moduleId = (course as any)?.module?.id || (course as any)?.module || (course as any)?.category || '';
  const [subscribed, setSubscribed] = useState<boolean>(() => {
    return !!user?.subscribedModules?.includes(moduleId);
  });

  const completeMutation = useMutation((chapterId: string) => coursesApi.completeChapter(id!, chapterId), {
    onSuccess: (res: any) => {
      const returnedUser = res?.data?.user;
      if (returnedUser) {
        try {
          setAuth(token, returnedUser as any);
        } catch (e) {
          // ignore
        }
      }
      queryClient.invalidateQueries(['course', id]);
      queryClient.invalidateQueries(['courses']);
      notifications.success('¡Capítulo completado!');
    },
    onError: (error: any) => {
      notifications.error(error.response?.data?.message || 'Error al marcar como completado');
    }
  });

  const deleteCourseMutation = useMutation(() => coursesApi.delete(id!), {
    onSuccess: () => {
      queryClient.invalidateQueries(['courses']);
      notifications.success('Curso eliminado');
      navigate('/courses');
    },
    onError: (error: any) => {
      notifications.error(error.response?.data?.message || 'Error al eliminar curso');
    }
  });

  const deleteChapterMutation = useMutation((chapterId: string) => coursesApi.deleteChapter(id!, chapterId), {
    onSuccess: () => {
      queryClient.invalidateQueries(['course', id]);
      notifications.success('Capítulo eliminado');
    },
    onError: (error: any) => {
      notifications.error(error.response?.data?.message || 'Error al eliminar capítulo');
    }
  });

  // Keep subscribed state in sync when user or course changes
  useEffect(() => {
    setSubscribed(!!user?.subscribedModules?.includes(moduleId));
  }, [user, moduleId]);

  const subscribeMutation = useMutation(() => usersApi.subscribe(moduleId), {
    onSuccess: async () => {
      // refresh profile and update store
      try {
        const resp = await usersApi.getProfile();
        setAuth(token, resp.data as any);
        setSubscribed(true);
        notifications.success('Suscripción realizada');
      } catch (e) {
        notifications.error('Error actualizando perfil');
      }
    },
    onError: (err: any) => {
      notifications.error(err?.response?.data?.message || 'Error al suscribirse');
    }
  });

  const unsubscribeMutation = useMutation(() => usersApi.unsubscribe(moduleId), {
    onSuccess: async () => {
      try {
        const resp = await usersApi.getProfile();
        setAuth(token, resp.data as any);
        setSubscribed(false);
        notifications.success('Se canceló la suscripción');
      } catch (e) {
        notifications.error('Error actualizando perfil');
      }
    },
    onError: (err: any) => {
      notifications.error(err?.response?.data?.message || 'Error al desuscribirse');
    }
  });

  const isChapterCompleted = (chapterId: string) => {
    const prog = user?.progress?.find((p: any) => p.courseId === id || p.courseId === (id as any));
    if (!prog || !Array.isArray(prog.completedChapters)) return false;
    return prog.completedChapters.includes(chapterId);
  };

  const handleCompleteChapter = (chapterId: string) => {
    completeMutation.mutate(chapterId);
  };

  if (isLoading || !course) {
    return <div className="loading">Cargando curso...</div>;
  }

  const progress = user?.progress?.find((p: any) => p.courseId === id || p.courseId === (id as any));
  const progressPercentage = progress ? (progress.completedChapters.length / course.chapters.length) * 100 : 0;

  return (
    <div className="course-detail">
      <div className="course-grid">
        {/* Información del curso */}
        <div className="course-info">
          <img src={resolveImage(course.imageUrl)} alt={course.title} />
          <h1>{course.title}</h1>
          {user && (
            <div style={{ marginTop: 8 }}>
              {subscribed ? (
                <button className="view-course-button" onClick={() => unsubscribeMutation.mutate()} disabled={unsubscribeMutation.isLoading}>
                  {unsubscribeMutation.isLoading ? 'Procesando...' : 'Desuscribirse del módulo'}
                </button>
              ) : (
                <button className="view-course-button" onClick={() => subscribeMutation.mutate()} disabled={subscribeMutation.isLoading}>
                  {subscribeMutation.isLoading ? 'Procesando...' : 'Suscribirse al módulo'}
                </button>
              )}
            </div>
          )}
          {user && (user.role === 'admin' || user.role === 'teacher') && (
            <div style={{ marginTop: 12 }}>
              <a href={`/courses/${id}/add-chapter`} className="view-course-button">Agregar capítulo</a>
              <button
                style={{ marginLeft: 8 }}
                className="view-course-button danger"
                onClick={async () => {
                  const confirmed = await notifications.confirm('Se eliminará el curso y sus archivos asociados.');
                  if (confirmed.isConfirmed) {
                    deleteCourseMutation.mutate();
                  }
                }}
              >Eliminar curso</button>
            </div>
          )}
          <p>{course.description}</p>
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }} />
            </div>
            <div className="progress-text">Progreso: {Math.round(progressPercentage)}%</div>
          </div>
        </div>

        {/* Capítulos */}
        <div>
          <h2>Capítulos del Curso</h2>
          {course.chapters.map((chapter: any, idx: number) => {
            const chapterId = ((chapter as any)._id && (chapter as any)._id.toString()) || (chapter as any).id || String(idx);
            const elementId = `chapter-${chapterId}`;
            return (
              <div className="chapter" key={chapterId}>
                <div
                  className="chapter-header"
                  onClick={() => {
                    const content = document.getElementById(elementId);
                    if (content) {
                      content.style.display = content.style.display === 'none' ? 'block' : 'none';
                    }
                  }}
                >
                  <h3 className="chapter-title">
                    <span className="chapter-icon">{isChapterCompleted(chapterId) ? '✓' : '○'}</span>
                    {chapter.title}
                    {user && (user.role === 'admin' || user.role === 'teacher') && (
                      <button
                        style={{ marginLeft: 12 }}
                        className="danger"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const confirmed = await notifications.confirm('Se eliminará el capítulo y sus archivos.');
                          if (confirmed.isConfirmed) {
                            deleteChapterMutation.mutate(chapterId);
                          }
                        }}
                      >Eliminar capítulo</button>
                    )}
                  </h3>
                </div>
                <div id={elementId} className="chapter-content">
                  <p className="chapter-description">{chapter.description}</p>
                  <div className="chapter-resources">
                    {Array.isArray(chapter.content) && chapter.content.map((c: any, idx2: number) => {
                      const isGridFs = typeof c.url === 'string' && c.url.startsWith('/api/files');
                      const resourceUrl = isGridFs ? c.url : `${import.meta.env.VITE_MINIO_URL}/${c.url}`;

                      if (c.type === 'video') {
                        return (
                          <div className="resource-card" key={idx2}>
                            <h4 className="resource-title">Video del capítulo</h4>
                            <video className="resource-video" controls>
                              <source src={resourceUrl} type="video/mp4" />
                              Tu navegador no soporta video.
                            </video>
                          </div>
                        );
                      }

                      return (
                        <div className="resource-card" key={idx2}>
                          <h4 className="resource-title">Material de apoyo</h4>
                          <a href={resourceUrl} target="_blank" rel="noopener noreferrer" className="resource-link">Ver {c.type}</a>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    className={`complete-button ${isChapterCompleted(chapterId) ? 'completed' : ''}`}
                    onClick={() => handleCompleteChapter(chapterId)}
                    disabled={isChapterCompleted(chapterId)}
                  >
                    {isChapterCompleted(chapterId) ? 'Completado' : 'Marcar como completado'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}