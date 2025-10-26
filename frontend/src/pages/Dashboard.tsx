import { Box, Typography, Grid, Paper } from '@mui/material';
import { useAuthStore } from '../stores/auth';
import ModuleCard from '../components/ModuleCard';
import CodeIcon from '@mui/icons-material/Code';
import CloudIcon from '@mui/icons-material/Cloud';
import ApiIcon from '@mui/icons-material/Api';
import StorageIcon from '@mui/icons-material/Storage';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../services/api';
import { notifications } from '../services/notifications';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  
  const { data: coursesData } = useQuery(['courses'], coursesApi.getAll, {
    onError: (error: any) => {
      notifications.error(error.response?.data?.message || 'Error al cargar los cursos');
    }
  });

  const modules = [
    {
      title: 'Fullstack',
      description: 'Desarrollo web completo: Frontend, Backend y más',
      icon: <CodeIcon fontSize="large" />,
      path: '/modules/fullstack',
      coursesCount: coursesData?.filter(course => course.module === 'fullstack').length || 0
    },
    {
      title: 'APIs e Integraciones',
      description: 'DataPower, IBM Bus, Broker, APIs, Microservicios',
      icon: <ApiIcon fontSize="large" />,
      path: '/modules/apis',
      coursesCount: coursesData?.filter(course => course.module === 'apis').length || 0
    },
    {
      title: 'Cloud',
      description: 'Computación en la nube y servicios cloud',
      icon: <CloudIcon fontSize="large" />,
      path: '/modules/cloud',
      coursesCount: coursesData?.filter(course => course.module === 'cloud').length || 0
    },
    {
      title: 'Data Engineer',
      description: 'Ingeniería y análisis de datos',
      icon: <StorageIcon fontSize="large" />,
      path: '/modules/data',
      coursesCount: coursesData?.filter(course => course.module === 'data').length || 0
    }
  ];

  return (
    <Box sx={{ p: 4 }}>
      <Grid container spacing={4}>
        {/* Sección de bienvenida */}
        <Grid item xs={12}>
          <Typography variant="h4" component="h1" gutterBottom>
            ¡Bienvenido, {user?.name}!
          </Typography>
        </Grid>

        {/* Sección de insignias */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EmojiEventsIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Tus Insignias
              </Typography>
            </Box>
            {user?.badges?.length ? (
              <Grid container spacing={2}>
                {user.badges.map((badge) => (
                  <Grid item key={badge.id}>
                    {/* Componente de insignia */}
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                ¡Completa cursos para ganar insignias!
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Módulos de capacitación */}
        {modules.map((module) => (
          <Grid item xs={12} sm={6} md={3} key={module.title}>
            <ModuleCard {...module} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}