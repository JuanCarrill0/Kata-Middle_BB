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
      navigate('/');
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
    <div className="register-container">
      <div className="register-box">
        <div className="register-paper">
          <h1 className="register-title">Portal de Capacitaciones</h1>
          <h2 className="register-subtitle">Registro de Usuario</h2>

          <form className="register-form" onSubmit={handleSubmit}>
            <div className="form-field">
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

            <div className="form-field">
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

            <div className="form-field">
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

              <div className="form-field">
                <label style={{ display: 'block', marginBottom: 6 }}>Registrarse como</label>
                <label style={{ marginRight: 12 }}>
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={formData.role === 'user'}
                    onChange={handleChange}
                    disabled={loading}
                  /> Usuario
                </label>
                <label>
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={formData.role === 'teacher'}
                    onChange={handleChange}
                    disabled={loading}
                  /> Profesor
                </label>
              </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>

            <button
              type="button"
              className="login-link"
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}