import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import './Navigation.css';

const pages = [
  { name: 'Inicio', path: '/' },
  { name: 'Cursos', path: '/courses' },
];

function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  // Use separate selectors to avoid creating a new object each render
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && avatarRef.current && 
          !menuRef.current.contains(event.target as Node) && 
          !avatarRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="nav">
      <div className="nav-container">
        <div className="nav-toolbar">
          <Link to="/" className="nav-logo">
            Portal de Capacitaciones
          </Link>

          <div className="nav-links">
            {pages.map((page) => (
              <Link
                key={page.path}
                to={page.path}
                className="nav-link"
              >
                {page.name}
              </Link>
            ))}
          </div>

          <div className="nav-user">
            <button
              ref={avatarRef}
              className="nav-avatar"
              onClick={toggleMenu}
              title="Abrir menú"
            >
              {user?.name?.charAt(0) || 'U'}
            </button>
            
            <div 
              ref={menuRef}
              className={`nav-menu ${isMenuOpen ? 'open' : ''}`}
            >
              <a 
                href="#" 
                className="nav-menu-item"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate('/profile');
                }}
              >
                Mi Perfil
              </a>
              <div className="nav-menu-divider" />
              <a 
                href="#" 
                className="nav-menu-item"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
              >
                Cerrar Sesión
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;