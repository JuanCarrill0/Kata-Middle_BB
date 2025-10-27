import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../services/api';
import { notifications } from '../services/notifications';
import { useAuthStore } from '../stores/auth';
import './CourseDetail.css';

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const { data: courseResponse, isLoading } = useQuery(
    ['course', id],
    () => id ? coursesApi.getById(id) : null,
    {
      onError: (error: any) => {
        notifications.error(error.response?.data?.message || 'Error al cargar el curso');
      }
    }
  );

  const course = courseResponse?.data;

  const completeMutation = useMutation(
    (chapterId: string) => coursesApi.completeChapter(id!, chapterId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course', id]);
        notifications.success('¡Capítulo completado!');
      },
      onError: (error: any) => {
        notifications.error(error.response?.data?.message || 'Error al marcar como completado');
      }
    }
  );

  const isChapterCompleted = (chapterId: string) => {
    return user?.progress?.find(p => p.courseId === id)?.completedChapters.includes(chapterId) || false;
  };

  const handleCompleteChapter = (chapterId: string) => {
    completeMutation.mutate(chapterId);
  };

  if (isLoading || !course) {
    return <div className="loading">Cargando curso...</div>;
  }

  const progress = user?.progress?.find(p => p.courseId === id);
  const progressPercentage = progress
    ? (progress.completedChapters.length / course.chapters.length) * 100
    : 0;

  return (
    <div className="course-detail">
      <div className="course-grid">
        {/* Información del curso */}
        <div className="course-info">
          {course.imageUrl && (
            <img
              src={course.imageUrl}
              alt={course.title}
            />
          )}
          <h1>{course.title}</h1>
          <p>{course.description}</p>
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="progress-text">
              Progreso: {Math.round(progressPercentage)}%
            </div>
          </div>
        </div>

        {/* Capítulos */}
        <div>
          <h2>Capítulos del Curso</h2>
          {course.chapters.map((chapter) => (
            <div className="chapter" key={chapter.id}>
              <div 
                className="chapter-header" 
                onClick={() => {
                  const content = document.getElementById(`chapter-${chapter.id}`);
                  if (content) {
                    content.style.display = content.style.display === 'none' ? 'block' : 'none';
                  }
                }}
              >
                <h3 className="chapter-title">
                  <span className="chapter-icon">
                    {isChapterCompleted(chapter.id) ? '✓' : '○'}
                  </span>
                  {chapter.title}
                </h3>
              </div>
              <div id={`chapter-${chapter.id}`} className="chapter-content">
                <p className="chapter-description">{chapter.description}</p>
                <div className="chapter-resources">
                  {chapter.videoUrl && (
                    <div className="resource-card">
                      <h4 className="resource-title">Video del capítulo</h4>
                      <iframe
                        className="resource-iframe"
                        src={chapter.videoUrl}
                        allowFullScreen
                      />
                    </div>
                  )}
                  {chapter.documentUrl && (
                    <div className="resource-card">
                      <h4 className="resource-title">Material de apoyo</h4>
                      <a
                        href={chapter.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="resource-link"
                      >
                        Ver documento
                      </a>
                    </div>
                  )}
                </div>
                <button
                  className={`complete-button ${isChapterCompleted(chapter.id) ? 'completed' : ''}`}
                  onClick={() => handleCompleteChapter(chapter.id)}
                  disabled={isChapterCompleted(chapter.id)}
                >
                  {isChapterCompleted(chapter.id) ? "Completado" : "Marcar como completado"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}