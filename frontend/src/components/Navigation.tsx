import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import { usersApi } from '../services/api';
import './Navigation.css';
import './Navigation.css';
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
  const token = useAuthStore((s) => s.token);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    let mounted = true;
    usersApi.getNotifications().then((res) => {
      if (!mounted) return;
      setNotifications(res.data || []);
    }).catch(() => {
      setNotifications([]);
    });

    return () => { mounted = false; };
  }, [user, token]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleToggleNotifs = () => {
    setIsNotifOpen(!isNotifOpen);
  };

  const handleOpenNotification = async (n: any) => {
    try {
      if (!n.read && n._id) {
        await usersApi.markNotificationRead(n._id);
      }
    } catch (e) {
      // ignore
    }
    // navigate to link if present
    if (n.link) {
      window.location.href = n.link;
    }
    // optimistically mark read in UI
    setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x));
  };

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
            <div className="nav-notifications">
              <button className="nav-notif-button" onClick={handleToggleNotifs} title="Notificaciones">
                🔔
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>
              <div className={`notif-dropdown ${isNotifOpen ? 'open' : ''}`}>
                {notifications.length === 0 && <div className="notif-empty">No hay notificaciones</div>}
                {notifications.map(n => (
                  <div key={n._id || `${n.message}-${n.createdAt}`} className={`notif-item ${n.read ? 'read' : 'unread'}`} onClick={() => handleOpenNotification(n)}>
                    <div className="notif-message">{n.message}</div>
                    {n.link && <div className="notif-link">Ver</div>}
                    <div className="notif-time">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
                  </div>
                ))}
                {notifications.length > 0 && (
                  <div className="notif-footer">
                    <Link to="/profile" onClick={() => setIsNotifOpen(false)}>Ver todas</Link>
                  </div>
                )}
              </div>
            </div>
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