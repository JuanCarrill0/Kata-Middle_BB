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

      // small delay so state updates before navigation
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
    <div className="auth-page">
      <div className="auth-left">
        <div className="brand">Portal de Capacitaciones</div>
        <h1 className="hero-title">Aprende a tu ritmo, alcanza tus metas</h1>
        <p className="hero-subtitle">Cursos, insignias y seguimiento de progreso para tu crecimiento profesional.</p>

        <ul className="hero-features">
          <li>Certificados e insignias</li>
          <li>Contenido multimedia y documentos</li>
          <li>Avance medible por curso</li>
        </ul>

        <div className="hero-cta">
          <button className="ghost" onClick={() => navigate('/register')}>Crear cuenta</button>
          <button className="outline" onClick={() => navigate('/courses')}>Explorar cursos</button>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="card-title">Iniciar Sesión</h2>

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

            <div className="card-footer">
              <button
                type="button"
                className="link-button"
                onClick={() => navigate('/register')}
                disabled={loading}
              >
                ¿No tienes cuenta? Regístrate
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}