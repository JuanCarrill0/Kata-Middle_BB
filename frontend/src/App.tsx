import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navigation from './components/Navigation';
import { useAuthStore } from './stores/auth';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const queryClient = new QueryClient();

function App() {
  const token = useAuthStore((state) => state.token);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            bgcolor: 'background.default',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {token && <Navigation />}
          <Box component="main" sx={{ flex: 1 }}>
            <Outlet />
          </Box>
        </Box>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;