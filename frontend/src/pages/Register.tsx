import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import { RegisterDataExtended, authApi } from '../services/api';
import { notifications } from '../services/notifications';
import './Register.css';

export default function Register() {
  const [formData, setFormData] = useState<RegisterDataExtended>({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    notifications.loading();

    try {
      const response = await authApi.register(formData);
      setAuth(response.data.token, response.data.user);
      notifications.close();
      notifications.success('¡Registro exitoso! Bienvenido.');
      navigate('/dashboard');
    } catch (err: any) {
      notifications.error(
        err.response?.data?.message || 'Error al registrar usuario'
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
    <div className="auth-page register">
      <div className="auth-left">
        <div className="brand">Portal de Capacitaciones</div>
        <h1 className="hero-title">Únete y empieza a aprender</h1>
        <p className="hero-subtitle">Crea una cuenta como Estudiante o Profesor y comparte conocimiento.</p>

        <ul className="hero-features">
          <li>Panel de progreso personal</li>
          <li>Creación de cursos para profesores</li>
          <li>Descarga de certificados</li>
        </ul>

        <div className="hero-cta">
          <button className="ghost" onClick={() => navigate('/courses')}>Ver cursos</button>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="card-title">Registro</h2>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                className="form-input"
                required
                id="name"
                placeholder="Nombre Completo"
                name="name"
                autoComplete="name"
                autoFocus
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <input
                className="form-input"
                required
                type="email"
                id="email"
                placeholder="Correo Electrónico"
                name="email"
                autoComplete="email"
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
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group role-group">
              <label className="role-label">Registrarse como</label>
              <div className="role-options">
                <label className={`role-pill ${formData.role === 'user' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={formData.role === 'user'}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span>Usuario</span>
                </label>
                <label className={`role-pill ${formData.role === 'teacher' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={formData.role === 'teacher'}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span>Profesor</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>

            <div className="card-footer">
              <button
                type="button"
                className="link-button"
                onClick={() => navigate('/login')}
                disabled={loading}
              >
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}