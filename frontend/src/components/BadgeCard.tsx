import { Badge } from '../types';
import './BadgeCard.css';

interface BadgeCardProps {
  badge: Badge;
}

export default function BadgeCard({ badge }: BadgeCardProps) {
  return (
    <div className="badge-tooltip" data-tooltip={badge.description} aria-label={badge.name}>
      <div className="badge-card content-card" role="img" aria-hidden>
        <div className="badge-content">
          <div className="badge-emoji" aria-hidden>
            🏅
          </div>
          <div className="badge-title">
            {badge.name}
          </div>
        </div>
      </div>
    </div>
  );
}