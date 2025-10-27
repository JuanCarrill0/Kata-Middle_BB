import { Badge } from '../types';
import './BadgeCard.css';

interface BadgeCardProps {
  badge: Badge;
}

export default function BadgeCard({ badge }: BadgeCardProps) {
  return (
    <div className="badge-tooltip" data-tooltip={badge.description}>
      <div className="badge-card">
        <div className="badge-content">
          <img
            className="badge-image"
            src={badge.imageUrl}
            alt={badge.name}
          />
          <div className="badge-title">
            {badge.name}
          </div>
        </div>
      </div>
    </div>
  );
}