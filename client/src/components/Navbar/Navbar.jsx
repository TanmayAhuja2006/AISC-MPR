import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { Menu, X, Activity, Moon, Sun, LogOut, User, MessageCircle, LayoutDashboard } from 'lucide-react';
import { logout } from '../../redux/userSlice';
import { useTheme } from '../../context/ThemeProvider';
import './Navbar.css';

export default function Navbar() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, isAuthenticated } = useSelector((s) => s.user);
  const { theme, toggleTheme }    = useTheme();
  const [menuOpen, setMenuOpen]   = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navLinks = isAuthenticated
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/chat',      label: 'AI Chat',   icon: MessageCircle },
        { to: '/profile',   label: 'Profile',   icon: User },
      ]
    : [
        { to: '/login',    label: 'Login',    icon: null },
        { to: '/register', label: 'Register', icon: null },
      ];

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        {/* Brand */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="navbar__brand">
          <Activity size={22} className="navbar__brand-icon" />
          <span className="navbar__brand-text">MedRAG</span>
          <span className="navbar__brand-badge">AI</span>
        </Link>

        {/* Desktop links */}
        <ul className="navbar__links" role="list">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className={`navbar__link ${location.pathname === to ? 'navbar__link--active' : ''}`}
              >
                {Icon && <Icon size={15} />}
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="navbar__actions">
          <button
            className="navbar__icon-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAuthenticated && (
            <>
              <div className="navbar__avatar" title={user?.name}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <button
                className="navbar__icon-btn navbar__icon-btn--danger"
                onClick={handleLogout}
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className="navbar__hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="navbar__mobile-menu">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="navbar__mobile-link"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          {isAuthenticated && (
            <button className="navbar__mobile-link navbar__mobile-link--danger" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
