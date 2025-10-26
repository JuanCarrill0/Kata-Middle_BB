import { Box, Typography } from '@mui/material';
import { useAuthStore } from '../stores/auth';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Bienvenido, {user?.name}!
      </Typography>
      <Typography variant="body1" gutterBottom>
        Explora nuestros cursos y comienza tu viaje de aprendizaje.
      </Typography>
    </Box>
  );
}