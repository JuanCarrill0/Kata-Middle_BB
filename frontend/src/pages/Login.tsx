import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import { LoginData, authApi } from '../services/api';
import { notifications } from '../services/notifications';
import './Login.css';

export default function Login() {
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    notifications.loading();

    try {
      const response = await authApi.login(formData);
      notifications.close();
      
      const { token, user } = response.data;
      setAuth(token, user);
      
      // Pequeño retraso para asegurar que el estado se actualice
      setTimeout(() => {
        notifications.success('¡Bienvenido de vuelta!');
        navigate('/dashboard', { replace: true });
      }, 100);
    } catch (err: any) {
      notifications.error(
        err.response?.data?.message || 'Error al iniciar sesión'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-paper">
          <h1 className="auth-title">Portal de Capacitaciones</h1>
          <h2 className="auth-subtitle">Iniciar Sesión</h2>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                className="form-input"
                required
                type="email"
                id="email"
                placeholder="Correo Electrónico"
                name="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <input
                className="form-input"
                required
                type="password"
                name="password"
                placeholder="Contraseña"
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>

            <button
              type="button"
              className="link-button"
              onClick={() => navigate('/register')}
              disabled={loading}
            >
              ¿No tienes cuenta? Regístrate
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}