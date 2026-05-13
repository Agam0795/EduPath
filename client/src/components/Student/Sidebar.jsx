import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome, FiBarChart2, FiBook, FiMapPin,
  FiLogOut, FiMenu, FiX, FiUsers, FiBookOpen, FiPieChart
} from 'react-icons/fi';

const studentNav = [
  { path: '/student/dashboard', icon: FiHome, label: 'Dashboard' },
  { path: '/student/marks', icon: FiBarChart2, label: 'My Marks' },
  { path: '/student/recommendations', icon: FiBook, label: 'Recommendations' },
  { path: '/student/library', icon: FiMapPin, label: 'Library Finder' },
];

const adminNav = [
  { path: '/admin/dashboard', icon: FiHome, label: 'Dashboard' },
  { path: '/admin/students', icon: FiUsers, label: 'Students' },
  { path: '/admin/marks', icon: FiBarChart2, label: 'Marks Mgmt' },
  { path: '/admin/books', icon: FiBookOpen, label: 'Books' },
  { path: '/admin/libraries', icon: FiMapPin, label: 'Libraries' },
  { path: '/admin/analytics', icon: FiPieChart, label: 'Analytics' },
];

const Sidebar = ({ role }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const navItems = role === 'admin' ? adminNav : studentNav;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'EP';

  return (
    <>
      {/* Mobile Toggle */}
      <button className="sidebar-toggle" onClick={() => setOpen(!open)} id="sidebar-toggle-btn">
        {open ? <FiX size={22} /> : <FiMenu size={22} />}
      </button>

      {/* Overlay */}
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <FiBookOpen size={22} />
          </div>
          <div>
            <span className="sidebar-brand-name">EduPath</span>
            <span className="sidebar-brand-sub">Navigator</span>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <p className="user-name">{user?.name}</p>
            <p className="user-role">{role === 'admin' ? '👑 Administrator' : `🎓 Sem ${user?.semester}`}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${active ? 'nav-link-active' : ''}`}
                onClick={() => setOpen(false)}
                id={`nav-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {active && <div className="nav-active-bar"></div>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout} id="logout-button">
            <FiLogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
