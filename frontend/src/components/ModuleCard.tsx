import { Card, CardContent, CardActionArea, Typography, Box } from '@mui/material';
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  path: string;
  coursesCount?: number;
}

export default function ModuleCard({ title, description, icon, path, coursesCount = 0 }: ModuleCardProps) {
  const navigate = useNavigate();

  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea 
        sx={{ height: '100%' }} 
        onClick={() => navigate(path)}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {icon}
            <Typography variant="h6" component="div" sx={{ ml: 1 }}>
              {title}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            {coursesCount} cursos disponibles
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}