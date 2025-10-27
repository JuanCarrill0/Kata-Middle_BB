import { Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navigation from './components/Navigation';
import { useAuthStore } from './stores/auth';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000
    }
  }
});

function App() {
  const token = useAuthStore((state) => state.token);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-container">
        {token && <Navigation />}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;