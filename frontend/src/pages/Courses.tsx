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
        {courseList.map((course: Course) => {
          // (no thumbnail) we use an illustration instead

          return (
          <div className="course-card" key={course.id}>
            <div className="course-illustration" aria-hidden="true">
              {/* Libro SVG estilizado como representación del curso */}
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 5.5C3 4.67157 3.67157 4 4.5 4H19" stroke="#1976d2" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 19.5C3 18.6716 3.67157 18 4.5 18H19" stroke="#1976d2" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 4v14" stroke="#1976d2" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 7h8v10H8z" fill="#e3f2fd" stroke="#1976d2" strokeWidth="1"/>
              </svg>
            </div>
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
          );
        })}
      </div>
    </div>
  );
};

export default Courses;