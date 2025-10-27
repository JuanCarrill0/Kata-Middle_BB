import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './ModuleCard.css';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  path: string;
  coursesCount?: number;
}

export default function ModuleCard({ title, description, icon, path, coursesCount = 0 }: ModuleCardProps) {
  return (
    <div className="module-card">
      <Link to={path} className="module-card-content">
        <div className="module-card-header">
          <span className="module-card-icon">{icon}</span>
          <h3 className="module-card-title">{title}</h3>
        </div>
        <p className="module-card-description">
          {description}
        </p>
        <span className="module-card-courses">
          {coursesCount} cursos disponibles
        </span>
      </Link>
    </div>
  );
}