import { Box, Typography } from '@mui/material';

export default function NotFound() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <Typography variant="h1" component="h1">
        404
      </Typography>
      <Typography variant="h5" component="h2">
        Página no encontrada
      </Typography>
    </Box>
  );
}