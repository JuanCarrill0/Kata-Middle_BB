/// <reference types="vite/client" />
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../services/api';
import { Link } from 'react-router-dom';
import { Course } from '../types';
import './Courses.css';

const Courses = () => {
  const { data: courses, isLoading } = useQuery<Course[]>(['courses'], () =>
    coursesApi.getAll().then((res) => res.data)
  );

  if (isLoading) {
    return <div className="loading">Cargando cursos...</div>;
  }

  // Normalize API response to ensure we have an array to map
  const courseList: Course[] = Array.isArray(courses)
    ? courses
    : (courses && (courses as any).data && Array.isArray((courses as any).data))
    ? (courses as any).data
    : [];

  if (!Array.isArray(courses)) {
    // eslint-disable-next-line no-console
    console.warn('[Courses] unexpected courses payload', courses);
  }

  return (
    <div className="courses-container">
      <h1 className="courses-title">Cursos Disponibles</h1>
      <div className="courses-grid">
        {courseList.map((course: Course) => (
          <div className="course-card" key={course.id}>
            <img 
              className="course-image"
              src={`${import.meta.env.VITE_MINIO_URL}/${course.imageUrl}`}
              alt={course.title}
            />
            <div className="course-content">
              <h2 className="course-title">{course.title}</h2>
              <p className="course-description">
                {course.description}
              </p>
              <div className="course-footer">
                <span className={`category-chip ${course.category}`}>
                  {course.category}
                </span>
                <Link 
                  to={`/courses/${course.id}`}
                  className="view-course-button"
                >
                  Ver Curso
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Courses;