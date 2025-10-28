import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi, usersApi, historyApi } from '../services/api';
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

  // (no thumbnail) we use an illustration instead

  const moduleId = (course as any)?.module?.id || (course as any)?.module || (course as any)?.category || '';
  const [subscribed, setSubscribed] = useState<boolean>(() => {
    return !!user?.subscribedModules?.includes(moduleId);
  });

  // Local UI state to avoid requiring multiple clicks and to provide optimistic updates
  const [loadingChapters, setLoadingChapters] = useState<Record<string, boolean>>({});
  const [optimisticCompleted, setOptimisticCompleted] = useState<Record<string, boolean>>({});
  // Ref for synchronous in-flight checks to avoid race where state hasn't updated yet
  const inFlightRef = useRef<Record<string, boolean>>({});

  const completeMutation = useMutation((chapterId: string) => coursesApi.completeChapter(id!, chapterId), {
    onSuccess: (res: any) => {
      // After completing a chapter, refresh the profile to ensure store/localStorage
      // contains the canonical, populated user object (badges, completedCourses, progress)
      (async () => {
        try {
          const profileResp = await usersApi.getProfile();
          // Force update to ensure local store/localStorage reflect server state
          setAuth(token, profileResp.data as any, true);
        } catch (e) {
          // fallback to returned user if profile fetch fails
          const returnedUser = res?.data?.user;
          if (returnedUser) {
            try {
              setAuth(token, returnedUser as any, true);
            } catch (err) {}
          }
        }
      })();
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

  // Obtener el historial canonico del curso (si existe) para calcular progreso real
  const { data: courseHistoryResp } = useQuery(['history', 'course', id],
    () => (id ? historyApi.getCourseHistory(id) : Promise.resolve(null)),
    {
      enabled: !!id,
      onError: (err: any) => {
        // silencioso; seguimos mostrando datos locales si falla
        console.warn('Could not fetch course history', err?.response?.data || err);
      }
    }
  );
  const courseHistory = courseHistoryResp?.data || null;

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
    // Check optimistic state first
    if (optimisticCompleted[chapterId]) return true;
    // If the course is marked completed in the user profile, consider all chapters completed
    const courseIdStr = String(id);
    const isCourseCompleted = !!(user?.completedCourses && user.completedCourses.includes(courseIdStr));
    if (isCourseCompleted) return true;

    // If the server-side history for this course reports this chapter completed, honor it
    if (courseHistory && Array.isArray(courseHistory.completedChapters)) {
      const histSet = new Set((courseHistory.completedChapters || []).map((ch: any) => String(ch.chapterId ? ch.chapterId : ch)));
      if (histSet.has(chapterId)) return true;
    }

    const prog = user?.progress?.find((p: any) => p.courseId === id || p.courseId === (id as any));
    if (!prog || !Array.isArray(prog.completedChapters)) return false;
    const set = new Set((prog.completedChapters || []).map((c: any) => String(c)));
    return set.has(chapterId);
  };

  const handleCompleteChapter = async (chapterId: string) => {
    if (isChapterCompleted(chapterId)) return; // already completed

    // synchronous in-flight guard (ref) to prevent race where state hasn't flushed yet
    if (inFlightRef.current[chapterId]) return;
    inFlightRef.current[chapterId] = true;

    // Optimistically mark as completed in UI
    setOptimisticCompleted((s) => ({ ...s, [chapterId]: true }));
    setLoadingChapters((s) => ({ ...s, [chapterId]: true }));

    try {
      await completeMutation.mutateAsync(chapterId);
      // Success will update user via onSuccess and invalidate queries
    } catch (e) {
      // rollback optimistic flag on error
      setOptimisticCompleted((s) => { const copy = { ...s }; delete copy[chapterId]; return copy; });
    } finally {
      setLoadingChapters((s) => { const copy = { ...s }; delete copy[chapterId]; return copy; });
      // clear in-flight ref
      delete inFlightRef.current[chapterId];
    }
  };

  if (isLoading || !course) {
    return <div className="loading">Cargando curso...</div>;
  }

  const progress = user?.progress?.find((p: any) => p.courseId === id || p.courseId === (id as any));
  // If the course is in completedCourses, show 100% progress
  const courseIdStr = String(id);
  const isCourseCompleted = !!(user?.completedCourses && user.completedCourses.includes(courseIdStr));
  // Compute progress percentage but include optimistic completions so UI updates immediately
  const baseCompleted = progress ? (progress.completedChapters.length) : 0;
  const progSet = new Set((progress && Array.isArray(progress.completedChapters) ? progress.completedChapters.map((c: any) => String(c)) : []));
  const optimisticExtra = Object.keys(optimisticCompleted).filter(k => optimisticCompleted[k] && !progSet.has(k)).length;
  const completedCount = baseCompleted + optimisticExtra;

  // Also consider server-side history if available
  const histCompletedCount = courseHistory && Array.isArray(courseHistory.completedChapters) ? courseHistory.completedChapters.length : 0;
  const histCompleted = courseHistory && courseHistory.completedAt;

  const effectiveCompleted = Math.max(completedCount, histCompletedCount);
  const progressPercentage = (isCourseCompleted || histCompleted) ? 100 : (course.chapters.length > 0 ? (effectiveCompleted / course.chapters.length) * 100 : 0);

  return (
    <div className="course-detail">
      <div className="course-grid">
        {/* Información del curso */}
        <div className="course-info">
          <div className="course-illustration" aria-hidden="true">
            <svg width="160" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 5.5C3 4.67157 3.67157 4 4.5 4H19" stroke="#1976d2" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 19.5C3 18.6716 3.67157 18 4.5 18H19" stroke="#1976d2" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 4v14" stroke="#1976d2" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 7h8v10H8z" fill="#e3f2fd" stroke="#1976d2" strokeWidth="1"/>
            </svg>
          </div>
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
                    disabled={isChapterCompleted(chapterId) || !!loadingChapters[chapterId]}
                    aria-disabled={isChapterCompleted(chapterId) || !!loadingChapters[chapterId]}
                  >
                    {loadingChapters[chapterId] ? 'Procesando...' : (isChapterCompleted(chapterId) ? 'Completado' : 'Marcar como completado')}
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